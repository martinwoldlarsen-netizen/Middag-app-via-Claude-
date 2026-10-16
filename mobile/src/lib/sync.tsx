import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import * as cloud from '@/lib/cloud';
import { useMeals } from '@/lib/meals-store';
import { EMPTY_STATE, useShopping, type Patch, type ShoppingState } from '@/lib/shopping';

// Holder ukeplanen og handlelista lik på alle telefonene i husstanden.
//
// Hver endring sendes som en liten patch til databasen. Hvert fjerde sekund
// hentes lista på nytt, så det samboer gjør dukker opp nesten med en gang.
// Uten nett legges endringene i kø og sendes når nettet er tilbake.

export type SyncStatus = 'off' | 'syncing' | 'ok' | 'offline';

const QUEUE_KEY = 'handleklar.syncQueue';
const POLL_MS = 4000;

const SyncContext = createContext<{ status: SyncStatus; syncNow: () => void }>({ status: 'off', syncNow: () => {} });

function normalize(remote: Record<string, unknown>): ShoppingState {
  return { ...EMPTY_STATE, ...(remote as Partial<ShoppingState>) };
}

function hasContent(state: ShoppingState): boolean {
  return Object.keys(state.entries).length > 0 || Object.keys(state.extras).length > 0;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { householdToken } = useMeals();
  const { state, replaceState, onLocalPatch, ready } = useShopping();
  const [status, setStatus] = useState<SyncStatus>('off');

  const tokenRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const versionRef = useRef(0);
  const queue = useRef<Patch[]>([]);
  const sending = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveQueue = useCallback(() => {
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.current)).catch(() => {});
  }, []);

  const applyRemote = useCallback(
    (remote: cloud.RemoteList) => {
      // Svar som kommer etter en nyere versjon, eller mens egne endringer venter, ignoreres.
      if (remote.version < versionRef.current || queue.current.length > 0 || sending.current) return;
      versionRef.current = remote.version;
      replaceState(normalize(remote.state));
    },
    [replaceState],
  );

  const flush = useCallback(async () => {
    const token = tokenRef.current;
    if (!token || sending.current) return;
    sending.current = true;
    let last: cloud.RemoteList | null = null;
    try {
      while (queue.current.length > 0) {
        setStatus('syncing');
        last = await cloud.patchList(token, queue.current[0] as Record<string, unknown>);
        queue.current.shift();
        saveQueue();
        versionRef.current = Math.max(versionRef.current, last.version);
      }
      setStatus('ok');
    } catch {
      setStatus('offline');
    } finally {
      sending.current = false;
    }
    if (last && queue.current.length === 0) {
      versionRef.current = 0;
      applyRemote(last);
    }
  }, [applyRemote, saveQueue]);

  const poll = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (queue.current.length > 0) {
      flush();
      return;
    }
    try {
      const remote = await cloud.getList(token);
      if (remote.version > versionRef.current) applyRemote(remote);
      setStatus('ok');
    } catch {
      setStatus('offline');
    }
  }, [applyRemote, flush]);

  // Lokale endringer sendes videre så lenge telefonen er med i en husstand.
  useEffect(() => {
    const previous = tokenRef.current;
    tokenRef.current = householdToken;
    if (!householdToken) {
      onLocalPatch.current = null;
      setStatus('off');
      // Telefonen forlot husstanden (logget ut): ventende endringer hører til den.
      if (previous) {
        queue.current = [];
        versionRef.current = 0;
        AsyncStorage.removeItem(QUEUE_KEY).catch(() => {});
      }
      return;
    }
    onLocalPatch.current = patch => {
      queue.current.push(patch);
      saveQueue();
      flush();
    };
    return () => {
      onLocalPatch.current = null;
    };
  }, [householdToken, onLocalPatch, flush, saveQueue]);

  // Første synk når husstanden er kjent: enten henter vi den felles lista, eller
  // så er dette første telefon, og da lastes ukeplanen som allerede finnes opp.
  useEffect(() => {
    if (!householdToken || !ready) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(QUEUE_KEY);
        if (saved) queue.current = [...JSON.parse(saved), ...queue.current];
        setStatus('syncing');
        const remote = await cloud.getList(householdToken);
        if (cancelled) return;
        if (remote.version === 0 && hasContent(stateRef.current)) {
          const current = stateRef.current;
          queue.current.unshift({
            entries: current.entries,
            extras: current.extras,
            checked: current.checked,
            swaps: current.swaps,
            skipped: current.skipped,
            meta: current.meta as Record<string, unknown>,
            fridge: current.fridge,
          });
          saveQueue();
        } else if (queue.current.length === 0) {
          versionRef.current = 0;
          applyRemote(remote);
        }
        await flush();
        if (!cancelled) setStatus('ok');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [householdToken, ready, applyRemote, flush, saveQueue]);

  // Henter endringer fra samboer jevnlig, og med en gang når appen kommer i forgrunnen igjen.
  useEffect(() => {
    if (!householdToken) return;
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    };
  }, [householdToken, poll]);

  const value = useMemo(() => ({ status, syncNow: poll }), [status, poll]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  return useContext(SyncContext);
}

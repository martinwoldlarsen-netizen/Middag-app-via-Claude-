import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { SUPABASE_KEY, SUPABASE_URL } from '@/constants/config';
import { useMeals } from '@/lib/meals-store';
import { EMPTY_STATE, useShopping } from '@/lib/shopping';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Telefonen er koblet til denne kontoen (bruker-id). Da trenger vi ikke koble på nytt.
const LINKED_KEY = 'handleklar.accountLinked';
// «Bruk uten konto»: appen virker som før, med husstandsnøkkel på telefonen.
const GUEST_KEY = 'handleklar.guest';

export const MIN_PASSWORD = 8;

type LoginResult = { token: string; owner_key: string | null; is_owner: boolean; name: string | null };
export type AccountInfo = { name: string | null; is_owner: boolean; members: string[] };

type AuthState = {
  ready: boolean;
  session: Session | null;
  email: string | null;
  guest: boolean;
  // Lenken i e-posten for nytt passord er åpnet: vis skjemaet for nytt passord.
  recovery: boolean;
  googleEnabled: boolean;
  linkError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<'signed_in' | 'confirm_email'>;
  signInWithGoogle: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setNewPassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueWithoutAccount: () => void;
  showLogin: () => void;
  retryLink: () => void;
  accountInfo: () => Promise<AccountInfo | null>;
};

const AuthContext = createContext<AuthState | null>(null);

// Supabase sine feilmeldinger er på engelsk og tekniske.
export function authErrorText(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Feil e-post eller passord.';
  if (/email not confirmed/i.test(message)) return 'Bekreft e-posten din først. Sjekk innboksen og søppelpost.';
  if (/already registered|already exists/i.test(message)) return 'Det finnes allerede en konto med denne e-posten. Prøv å logge inn.';
  if (/password should be at least|weak password/i.test(message)) return `Passordet må ha minst ${MIN_PASSWORD} tegn.`;
  if (/pwned|leaked|compromised/i.test(message)) return 'Dette passordet har vært med i en kjent datalekkasje. Velg et annet.';
  if (/invalid email|unable to validate email|invalid format/i.test(message)) return 'Sjekk at e-postadressen er riktig.';
  if (/not authorized|sending .*email|error sending/i.test(message))
    return 'Fikk ikke sendt e-post akkurat nå. Prøv igjen senere, eller be eieren slå av e-postbekreftelse.';
  if (/rate limit|too many|security purposes/i.test(message)) return 'For mange forsøk. Vent litt og prøv igjen.';
  if (/fetch|network|failed to fetch/i.test(message)) return 'Fikk ikke kontakt. Sjekk nettet og prøv igjen.';
  if (/same password|different from the old/i.test(message)) return 'Velg et annet passord enn det gamle.';
  return 'Noe gikk galt. Prøv igjen.';
}

function redirectUrl(): string | undefined {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { householdToken, joinHousehold, leaveHousehold, memberName, setMemberName, loading: mealsLoading } = useMeals();
  const { ownerKey, unlockOwner, lockOwner, ready: appReady } = useApp();
  const { replaceState } = useShopping();

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [linkedUser, setLinkedUser] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const linking = useRef(false);
  // Sjekkes én gang hver gang appen åpnes, så alle telefonene havner i samme
  // husstand selv om kontoen ble koblet til en annen husstand et annet sted.
  const verifiedFor = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [[, savedGuest], [, savedLinked]] = await AsyncStorage.multiGet([GUEST_KEY, LINKED_KEY]).catch(
        () => [[GUEST_KEY, null], [LINKED_KEY, null]] as [string, string | null][],
      );
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (!alive) return;
      setGuest(savedGuest === '1');
      setLinkedUser(savedLinked);
      setSession(data.session);
      setReady(true);
    })();
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    // Google-knappen vises bare når Google er slått på i Supabase, så den aldri gir feil.
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
      .then(res => (res.ok ? res.json() : null))
      .then((settings: { external?: { google?: boolean } } | null) => alive && setGoogleEnabled(Boolean(settings?.external?.google)))
      .catch(() => {});
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Etter innlogging: koble kontoen til husstanden (eller hent husstanden til
  // en ny telefon), og ta med eierskapet hvis kontoen er eier.
  const link = useCallback(
    async (userId: string, firstTime = true) => {
      if (linking.current) return;
      linking.current = true;
      try {
        const { data, error } = await supabase.rpc('hk_account_login', {
          p_token: householdToken,
          p_owner_key: ownerKey,
          p_name: memberName.trim() || null,
        });
        if (error) throw new Error(error.message);
        const result = data as LoginResult;
        if (result.token && result.token !== householdToken) await joinHousehold(result.token);
        if (result.owner_key) await unlockOwner(result.owner_key);
        if (result.name && !memberName.trim()) setMemberName(result.name);
        await AsyncStorage.multiSet([
          [LINKED_KEY, userId],
          [GUEST_KEY, '0'],
        ]);
        verifiedFor.current = userId;
        setLinkedUser(userId);
        setGuest(false);
        setLinkError(null);
      } catch (error) {
        // Uten nett når appen åpnes er helt greit: telefonen er allerede koblet.
        if (firstTime) setLinkError(error instanceof Error ? authErrorText(error.message) : 'Kunne ikke koble kontoen');
      } finally {
        linking.current = false;
      }
    },
    [householdToken, ownerKey, memberName, joinHousehold, unlockOwner, setMemberName],
  );

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId || mealsLoading || !appReady) return;
    // Kobles når kontoen er ny på telefonen, telefonen har mistet nøkkelen,
    // eller appen nettopp er åpnet.
    const firstTime = linkedUser !== userId || !householdToken;
    if (firstTime || verifiedFor.current !== userId) link(userId, firstTime);
  }, [userId, mealsLoading, appReady, linkedUser, householdToken, link]);

  // Ble telefonen eier mens du er innlogget (via /eier), knyttes eierskapet til kontoen.
  const ownerLinked = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || !ownerKey || linkedUser !== userId || ownerLinked.current === ownerKey) return;
    ownerLinked.current = ownerKey;
    supabase.rpc('hk_account_login', { p_token: householdToken, p_owner_key: ownerKey, p_name: null }).then(() => {});
  }, [userId, ownerKey, linkedUser, householdToken]);

  // Endrer du navnet ditt (under Del med samboer), lagres det på kontoen også.
  const savedName = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || linkedUser !== userId) return;
    const name = memberName.trim();
    if (savedName.current === null) {
      savedName.current = name;
      return;
    }
    if (name === savedName.current) return;
    const timer = setTimeout(() => {
      savedName.current = name;
      supabase.rpc('hk_account_set_name', { p_name: name || null }).then(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, linkedUser, memberName]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      if (password.length < MIN_PASSWORD) {
        throw new Error(`Velg et passord på minst ${MIN_PASSWORD} tegn. Tips: bruk en setning, f.eks. «taco på fredag».`);
      }
      if (name.trim()) setMemberName(name.trim());
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectUrl(), data: name.trim() ? { name: name.trim() } : undefined },
      });
      if (error) throw new Error(authErrorText(error.message));
      // Supabase sier ikke fra om e-posten finnes fra før, men gir da ingen identiteter.
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('Det finnes allerede en konto med denne e-posten. Prøv å logge inn.');
      }
      return data.session ? 'signed_in' : 'confirm_email';
    },
    [setMemberName],
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl() } });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectUrl() } });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const setNewPassword = useCallback(async (password: string) => {
    if (password.length < MIN_PASSWORD) throw new Error(`Passordet må ha minst ${MIN_PASSWORD} tegn.`);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(authErrorText(error.message));
    setRecovery(false);
  }, []);

  // Logg ut: telefonen glemmer husstanden og lista. Alt ligger trygt på kontoen.
  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    await leaveHousehold();
    lockOwner();
    replaceState(EMPTY_STATE);
    await AsyncStorage.multiRemove([LINKED_KEY, GUEST_KEY]).catch(() => {});
    verifiedFor.current = null;
    setLinkedUser(null);
    setGuest(false);
    setRecovery(false);
  }, [leaveHousehold, lockOwner, replaceState]);

  const continueWithoutAccount = useCallback(() => {
    setGuest(true);
    AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
  }, []);

  const showLogin = useCallback(() => {
    setGuest(false);
    AsyncStorage.setItem(GUEST_KEY, '0').catch(() => {});
  }, []);

  const retryLink = useCallback(() => {
    if (userId) link(userId);
  }, [userId, link]);

  const accountInfo = useCallback(async () => {
    const { data, error } = await supabase.rpc('hk_account_info');
    if (error) throw new Error(authErrorText(error.message));
    return (data as AccountInfo | null) ?? null;
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      email: session?.user.email ?? null,
      guest,
      recovery,
      googleEnabled,
      linkError,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmation,
      sendPasswordReset,
      setNewPassword,
      signOut,
      continueWithoutAccount,
      showLogin,
      retryLink,
      accountInfo,
    }),
    [
      ready,
      session,
      guest,
      recovery,
      googleEnabled,
      linkError,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmation,
      sendPasswordReset,
      setNewPassword,
      signOut,
      continueWithoutAccount,
      showLogin,
      retryLink,
      accountInfo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth må brukes inne i AuthProvider');
  return context;
}

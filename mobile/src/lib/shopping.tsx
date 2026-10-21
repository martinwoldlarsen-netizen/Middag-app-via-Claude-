import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

import { forChain, type Ingredient, type Meal, type Product } from '@/data/meals';
import type { Store } from '@/data/stores';
import { formatQuantity, mealBase, scaleQuantity } from '@/lib/meals';
import { useMeals } from '@/lib/meals-store';
import { chainFor, ingredientCost, isPantry, toBase, type MealPrice, type PriceBook } from '@/lib/prices';
import { STOPS, stopFor, type StopId } from '@/lib/stops';
import { useApp } from '@/lib/store';

// Ukeplanen og handlelista. Hjemme velger du middagene for uka; i butikken blir
// alle varene slått sammen til én liste i butikkens rekkefølge.
//
// Tilstanden er bygget av små oppslag (én nøkkel per middag, vare og avhuking),
// og alle endringer er «patcher» på disse. Da kan to telefoner i samme husstand
// endre lista samtidig uten å skrive over hverandre.

export type PlanEntry = {
  id: string;
  mealId: string | number;
  persons: number;
  // 0 = mandag … 6 = søndag. null betyr ingen bestemt dag.
  day: number | null;
  addedAt: number;
  // Satt når middagen er handlet. Den blir stående i uka, men er ute av lista.
  boughtAt?: number | null;
};

export type ExtraItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  product?: Product | null;
  addedAt: number;
  addedBy?: string | null;
};

// Erstatning når butikken ikke har varen.
export type Swap = { name: string; product?: Product | null };

// Det dere har hjemme. Delt med husstanden, og brukt til sparemiddag og «har hjemme» i lista.
export type FridgeItem = {
  id: string;
  name: string;
  amount: string;
  // Dato varen går ut, som ÅÅÅÅ-MM-DD. null betyr at den holder seg.
  expires: string | null;
  addedAt: number;
  addedBy?: string | null;
};

export type ShoppingMeta = {
  storeId?: string | null;
  // Hvem som står i butikken nå. Vises som en melding hos samboer.
  shopper?: { name: string; since: number; deviceId?: string } | null;
};

export type ShoppingState = {
  entries: Record<string, PlanEntry>;
  extras: Record<string, ExtraItem>;
  checked: Record<string, true>;
  swaps: Record<string, Swap>;
  skipped: Record<string, true>;
  meta: ShoppingMeta;
  fridge: Record<string, FridgeItem>;
};

type Section = keyof ShoppingState;
export type Patch = Partial<Record<Section, Record<string, unknown>>>;

const SECTIONS: Section[] = ['entries', 'extras', 'checked', 'swaps', 'skipped', 'meta', 'fridge'];

export const EMPTY_STATE: ShoppingState = {
  entries: {},
  extras: {},
  checked: {},
  swaps: {},
  skipped: {},
  meta: {},
  fridge: {},
};

// En verdi på null i en patch betyr «fjern nøkkelen».
export function applyPatch(state: ShoppingState, patch: Patch): ShoppingState {
  const next = { ...state } as Record<Section, Record<string, unknown>>;
  for (const section of SECTIONS) {
    const changes = patch[section];
    if (!changes) continue;
    const copy = { ...(next[section] ?? {}) };
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined) delete copy[key];
      else copy[key] = value;
    }
    next[section] = copy;
  }
  return next as unknown as ShoppingState;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
export const DAYS_SHORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export function sortEntries(entries: PlanEntry[]): PlanEntry[] {
  return [...entries].sort((a, b) => (a.day ?? 99) - (b.day ?? 99) || a.addedAt - b.addedAt);
}

// ---- Den samlede lista ----

export type ListLine = {
  // Stabil nøkkel for avhuking: strekkode eller navn, pluss enhetsfamilie.
  key: string;
  stop: StopId;
  name: string;
  originalName: string;
  amount: string;
  // Sammenslått mengde, brukt til pris. Mengden gjelder allerede for alle personene.
  ingredient: Ingredient;
  product: Product | null;
  sources: string[];
  // Hvor mange middager som trenger varen. Brukes i prisanslag uten pakkestørrelse.
  mealCount: number;
  extraIds: string[];
  pantry: boolean;
  swapped: boolean;
};

export type ListStop = { stop: StopId; label: string; lines: ListLine[] };

const WHOLE_UNITS = ['pk', 'pakke', 'boks', 'pose', 'glass', 'flaske', 'beger', 'hode', 'bunt', 'stk', 'terning'];

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatAmount(quantity: number, unit: string): string {
  const lower = unit.toLowerCase();
  if (WHOLE_UNITS.includes(lower)) return `${Math.max(1, Math.ceil(quantity - 0.05))} ${unit}`;
  if (lower === 'g' && quantity >= 1000) return formatQuantity(Math.round(quantity / 100) / 10, 'kg');
  if (lower === 'ml' && quantity >= 1000) return formatQuantity(Math.round(quantity / 100) / 10, 'l');
  return formatQuantity(quantity, unit);
}

type Draft = {
  key: string;
  name: string;
  section: string;
  quantity: number;
  unit: string;
  product: Product | null;
  sources: string[];
  mealCount: number;
  extraIds: string[];
  pantry: boolean;
};

function addToDrafts(
  drafts: Map<string, Draft>,
  ingredient: Ingredient,
  quantity: number,
  source: string,
  options: { extraId?: string; fromMeal: boolean },
) {
  const product = ingredient.product ?? null;
  const base = toBase(quantity, ingredient.unit);
  const family = base?.unit ?? ingredient.unit.toLowerCase();
  const key = `${product?.ean ? `p:${product.ean}` : `n:${normalizeName(ingredient.name)}`}|${family}`;
  const amount = base?.value ?? quantity;
  const unit = base?.unit ?? ingredient.unit;
  const pantry = isPantry(ingredient);

  const existing = drafts.get(key);
  if (existing) {
    existing.quantity += amount;
    if (!existing.sources.includes(source)) existing.sources.push(source);
    if (options.fromMeal) existing.mealCount += 1;
    if (options.extraId) existing.extraIds.push(options.extraId);
    existing.pantry = existing.pantry && pantry;
    if (!existing.product && product) existing.product = product;
    return;
  }
  drafts.set(key, {
    key,
    name: ingredient.name,
    section: ingredient.section,
    quantity: amount,
    unit,
    product,
    sources: [source],
    mealCount: options.fromMeal ? 1 : 0,
    extraIds: options.extraId ? [options.extraId] : [],
    pantry,
  });
}

// Slår sammen alle varene fra middagene som ikke er handlet ennå, pluss egne varer.
// Varene velges for kjeden du handler i (en vare kan være Mutti på Kiwi og Petti på Rema).
export function buildLines(
  state: ShoppingState,
  findMeal: (id: string | number) => Meal | undefined,
  chain: string | null = null,
): ListLine[] {
  const drafts = new Map<string, Draft>();

  for (const entry of sortEntries(Object.values(state.entries))) {
    if (entry.boughtAt) continue;
    const meal = findMeal(entry.mealId);
    if (!meal) continue;
    const base = mealBase(meal);
    for (const ingredient of meal.ingredients) {
      addToDrafts(drafts, forChain(ingredient, chain), scaleQuantity(ingredient.quantity, entry.persons, base), meal.name, { fromMeal: true });
    }
  }

  const extras = Object.values(state.extras).sort((a, b) => a.addedAt - b.addedAt);
  const extraNotes = new Map<string, string[]>();
  for (const extra of extras) {
    // Skriver du «Melk» selv mens lasagnen trenger 500 ml, blir det én linje:
    // «500 ml + 1 stk» i stedet for to linjer som begge heter Melk.
    if (!extra.product) {
      const name = normalizeName(extra.name);
      const family = toBase(extra.quantity, extra.unit)?.unit ?? extra.unit.toLowerCase();
      // Treffer også varer som er koblet til et produkt, så lenge ingrediensen heter det samme.
      const match = [...drafts.values()].find(
        draft => normalizeName(draft.name) === name && !draft.key.endsWith(`|${family}`),
      );
      if (match) {
        const label = extra.addedBy ? `Lagt til av ${extra.addedBy}` : 'Lagt til';
        match.extraIds.push(extra.id);
        if (!match.sources.includes(label)) match.sources.push(label);
        extraNotes.set(match.key, [...(extraNotes.get(match.key) ?? []), formatAmount(extra.quantity, extra.unit)]);
        continue;
      }
    }
    addToDrafts(
      drafts,
      { name: extra.name, quantity: extra.quantity, unit: extra.unit, section: '', product: extra.product ?? undefined, pantry: false },
      extra.quantity,
      extra.addedBy ? `Lagt til av ${extra.addedBy}` : 'Lagt til',
      { extraId: extra.id, fromMeal: false },
    );
  }

  return [...drafts.values()].map(draft => {
    const swap = state.swaps[draft.key];
    const name = swap?.name ?? draft.name;
    const product = swap ? (swap.product ?? null) : draft.product;
    const swappedStop = swap ? stopFor({ name: swap.name, section: '' }) : null;
    return {
      key: draft.key,
      stop: swappedStop && swappedStop !== 'annet' ? swappedStop : stopFor({ name: draft.name, section: draft.section }),
      name,
      originalName: draft.name,
      amount: [formatAmount(draft.quantity, draft.unit), ...(extraNotes.get(draft.key) ?? [])].join(' + '),
      ingredient: {
        name,
        quantity: draft.quantity,
        unit: draft.unit,
        section: draft.section,
        product: product ?? undefined,
        pantry: draft.pantry,
      },
      product,
      sources: draft.sources,
      mealCount: draft.mealCount,
      extraIds: draft.extraIds,
      pantry: draft.pantry,
      swapped: Boolean(swap),
    };
  });
}

// Grupperer linjene per stopp i butikkens rekkefølge. Ukjente stopp havner sist.
export function groupByStops(lines: ListLine[], storeStops: StopId[]): ListStop[] {
  const byStop = new Map<StopId, ListLine[]>();
  for (const line of lines) {
    const list = byStop.get(line.stop) ?? [];
    list.push(line);
    byStop.set(line.stop, list);
  }
  const ordered: ListStop[] = [];
  for (const stop of storeStops) {
    const stopLines = byStop.get(stop);
    if (stopLines?.length) {
      ordered.push({ stop, label: STOPS[stop], lines: stopLines });
      byStop.delete(stop);
    }
  }
  for (const [stop, stopLines] of byStop) ordered.push({ stop, label: STOPS[stop], lines: stopLines });
  return ordered;
}

export function linePrice(line: ListLine, chain: string | null, book: PriceBook) {
  const cost = ingredientCost(line.ingredient, 1, 1, chain, book);
  // Uten kjent pakkestørrelse gjetter vi én pakke per middag som trenger varen.
  if (!line.ingredient.product?.packSize && cost.source !== 'pantry' && line.mealCount > cost.packs) {
    const packs = line.mealCount;
    return { ...cost, packs, amount: (cost.amount / Math.max(1, cost.packs)) * packs };
  }
  return cost;
}

export function listPrice(lines: ListLine[], chain: string | null, book: PriceBook, skipped: Record<string, true> = {}): MealPrice {
  let total = 0;
  let priced = 0;
  let toBuy = 0;
  for (const line of lines) {
    if (skipped[line.key]) continue;
    const cost = linePrice(line, chain, book);
    if (cost.source === 'pantry') continue;
    toBuy += 1;
    if (cost.source === 'exact') priced += 1;
    total += cost.amount;
  }
  return { total: Math.round(total), exact: toBuy > 0 && priced === toBuy, priced, toBuy };
}

// ---- Rester og kjøleskap ----

export type Leftover = { key: string; name: string; amount: string; stop: StopId };

const LEFTOVER_CONTAINERS = ['boks', 'glass', 'flaske', 'pose', 'pk', 'pakke', 'beger'];

// Hva som blir til overs fordi pakkene kommer hele: 300 g rømme kjøpt, 100 g brukt.
export function leftovers(lines: ListLine[], skipped: Record<string, true> = {}): Leftover[] {
  const result: Leftover[] = [];
  for (const line of lines) {
    if (skipped[line.key] || line.pantry || line.mealCount === 0) continue;
    const ingredient = line.ingredient;
    const unit = ingredient.unit.toLowerCase();
    const product = ingredient.product;
    if (product?.packSize) {
      const need = toBase(ingredient.quantity, ingredient.unit);
      const pack = toBase(product.packSize, product.packUnit);
      if (need && pack && pack.value > 0 && (need.unit === pack.unit || (need.unit !== 'stk' && pack.unit !== 'stk'))) {
        const packs = Math.max(1, Math.ceil(need.value / pack.value - 0.05));
        const left = packs * pack.value - need.value;
        if (left >= pack.value * 0.1) {
          result.push({ key: line.key, name: line.name, amount: formatQuantity(left, need.unit), stop: line.stop });
        }
        continue;
      }
    }
    if (LEFTOVER_CONTAINERS.includes(unit)) {
      const left = Math.ceil(ingredient.quantity - 0.05) - ingredient.quantity;
      if (left >= 0.2) result.push({ key: line.key, name: line.name, amount: formatQuantity(left, ingredient.unit), stop: line.stop });
    }
  }
  return result;
}

// Hvor lenge en åpnet vare holder seg, grovt anslått ut fra hvor den står i butikken.
const SHELF_DAYS: Partial<Record<StopId, number>> = {
  kjott: 2,
  fisk: 2,
  brod: 3,
  meieri: 5,
  ost: 7,
  palegg: 5,
  ferdigmat: 3,
  'frukt-gront': 5,
  egg: 14,
  hermetikk: 4,
  sauser: 14,
};

export function defaultExpiry(stop: StopId): string | null {
  const days = SHELF_DAYS[stop];
  if (days === undefined) return null;
  const date = new Date(Date.now() + days * 86400000);
  return date.toISOString().slice(0, 10);
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
  return Math.round((new Date(date).getTime() - today) / 86400000);
}

export function expiryText(date: string | null): string | null {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) return 'gått ut';
  if (days === 0) return 'går ut i dag';
  if (days === 1) return 'går ut i morgen';
  return `går ut om ${days} dager`;
}

// Finner varer i kjøleskapet som passer en ingrediens, f.eks. «Rømme» og «Lettrømme».
export function fridgeMatch(name: string, fridge: FridgeItem[]): FridgeItem | undefined {
  const target = normalizeName(name);
  return fridge.find(item => {
    const have = normalizeName(item.name);
    if (have.length < 3 || target.length < 3) return false;
    return target.includes(have) || have.includes(target) || target.split(' ')[0] === have.split(' ')[0];
  });
}

export function lineEans(lines: ListLine[]): string[] {
  return [...new Set(lines.map(line => line.product?.ean).filter((ean): ean is string => Boolean(ean)))].sort();
}

export function storeChain(store: Store | undefined): string | null {
  return store ? chainFor(store) : null;
}

// ---- Tilstand og lagring ----

const STATE_KEY = 'handleklar.shopping';
// Fra før ukeplanen fantes: én middag og én butikk.
const LEGACY_ACTIVE_KEY = 'handleklar.activeList';
const LEGACY_CHECKED_KEY = 'handleklar.checked';
const PERSONS_KEY = 'handleklar.persons';

type ShoppingContext = {
  state: ShoppingState;
  ready: boolean;
  entries: PlanEntry[];
  activeEntries: PlanEntry[];
  entryFor: (mealId: string | number) => PlanEntry | undefined;
  addMeal: (mealId: string | number, persons: number, day?: number | null) => string;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, change: Partial<Pick<PlanEntry, 'persons' | 'day' | 'mealId'>>) => void;
  setStore: (storeId: string) => void;
  addExtra: (item: Omit<ExtraItem, 'id' | 'addedAt'>) => void;
  updateExtra: (id: string, change: Partial<Pick<ExtraItem, 'quantity'>>) => void;
  removeExtras: (ids: string[]) => void;
  setChecked: (key: string, value: boolean) => void;
  putAllBack: () => void;
  swapLine: (key: string, swap: Swap | null) => void;
  skipLine: (key: string, value: boolean) => void;
  finishShopping: () => void;
  clearBought: () => void;
  addFridge: (item: Omit<FridgeItem, 'id' | 'addedAt'>) => void;
  addFridgeItems: (items: Omit<FridgeItem, 'id' | 'addedAt'>[]) => void;
  removeFridge: (id: string) => void;
  // Settes av synkroniseringen i etappe 2. Får alle patcher som gjøres lokalt.
  commit: (patch: Patch) => void;
  replaceState: (next: ShoppingState) => void;
  onLocalPatch: RefObject<((patch: Patch) => void) | null>;
};

const Context = createContext<ShoppingContext | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShoppingState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<ShoppingState>(EMPTY_STATE);
  const onLocalPatch = useRef<((patch: Patch) => void) | null>(null);

  const persist = useCallback((next: ShoppingState) => {
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const replaceState = useCallback(
    (next: ShoppingState) => {
      stateRef.current = next;
      setState(next);
      persist(next);
    },
    [persist],
  );

  useEffect(() => {
    (async () => {
      try {
        const [[, saved], [, legacy], [, legacyPersons]] = await AsyncStorage.multiGet([
          STATE_KEY,
          LEGACY_ACTIVE_KEY,
          PERSONS_KEY,
        ]);
        if (saved) {
          replaceState({ ...EMPTY_STATE, ...JSON.parse(saved) });
        } else if (legacy) {
          // Flytter den gamle «én middag»-lista inn i ukeplanen.
          const old = JSON.parse(legacy) as { mealId: string | number; storeId: string };
          const persons = Number(legacyPersons) || 2;
          const id = newId('e');
          replaceState({
            ...EMPTY_STATE,
            entries: { [id]: { id, mealId: old.mealId, persons, day: null, addedAt: Date.now() } },
            meta: { storeId: old.storeId },
          });
          await AsyncStorage.multiRemove([LEGACY_ACTIVE_KEY, LEGACY_CHECKED_KEY]);
        }
      } catch {
        // Ingen lagret plan ennå.
      } finally {
        setReady(true);
      }
    })();
  }, [replaceState]);

  const commit = useCallback(
    (patch: Patch) => {
      replaceState(applyPatch(stateRef.current, patch));
      onLocalPatch.current?.(patch);
    },
    [replaceState],
  );

  const entries = useMemo(() => sortEntries(Object.values(state.entries)), [state.entries]);
  const activeEntries = useMemo(() => entries.filter(entry => !entry.boughtAt), [entries]);

  const entryFor = useCallback(
    (mealId: string | number) => activeEntries.find(entry => String(entry.mealId) === String(mealId)),
    [activeEntries],
  );

  const addMeal = useCallback(
    (mealId: string | number, persons: number, day: number | null = null) => {
      const existing = Object.values(stateRef.current.entries).find(
        entry => !entry.boughtAt && String(entry.mealId) === String(mealId),
      );
      if (existing) return existing.id;
      const id = newId('e');
      commit({ entries: { [id]: { id, mealId, persons, day, addedAt: Date.now() } } });
      return id;
    },
    [commit],
  );

  const removeEntry = useCallback((id: string) => commit({ entries: { [id]: null } }), [commit]);

  const updateEntry = useCallback(
    (id: string, change: Partial<Pick<PlanEntry, 'persons' | 'day' | 'mealId'>>) => {
      const entry = stateRef.current.entries[id];
      if (!entry) return;
      const persons = change.persons === undefined ? entry.persons : Math.min(12, Math.max(1, change.persons));
      commit({ entries: { [id]: { ...entry, ...change, persons } } });
    },
    [commit],
  );

  const setStore = useCallback(
    (storeId: string) => commit({ meta: { storeId } }),
    [commit],
  );

  const addExtra = useCallback(
    (item: Omit<ExtraItem, 'id' | 'addedAt'>) => {
      const id = newId('x');
      commit({ extras: { [id]: { ...item, id, addedAt: Date.now() } } });
    },
    [commit],
  );

  const updateExtra = useCallback(
    (id: string, change: Partial<Pick<ExtraItem, 'quantity'>>) => {
      const extra = stateRef.current.extras[id];
      if (!extra) return;
      if (change.quantity !== undefined && change.quantity <= 0) commit({ extras: { [id]: null } });
      else commit({ extras: { [id]: { ...extra, ...change } } });
    },
    [commit],
  );

  const removeExtras = useCallback(
    (ids: string[]) => commit({ extras: Object.fromEntries(ids.map(id => [id, null])) }),
    [commit],
  );

  const setChecked = useCallback(
    (key: string, value: boolean) => commit({ checked: { [key]: value ? true : null } }),
    [commit],
  );

  const putAllBack = useCallback(() => {
    const current = stateRef.current;
    commit({
      checked: Object.fromEntries(Object.keys(current.checked).map(key => [key, null])),
      skipped: Object.fromEntries(Object.keys(current.skipped).map(key => [key, null])),
    });
  }, [commit]);

  const swapLine = useCallback(
    (key: string, swap: Swap | null) => commit({ swaps: { [key]: swap }, skipped: { [key]: null } }),
    [commit],
  );

  const skipLine = useCallback(
    (key: string, value: boolean) => commit({ skipped: { [key]: value ? true : null }, checked: { [key]: null } }),
    [commit],
  );

  // Ferdig handlet: middagene blir stående i uka som handlet, lista tømmes.
  const finishShopping = useCallback(() => {
    const current = stateRef.current;
    const now = Date.now();
    const clear = (section: Record<string, unknown>) => Object.fromEntries(Object.keys(section).map(key => [key, null]));
    commit({
      entries: Object.fromEntries(
        Object.values(current.entries)
          .filter(entry => !entry.boughtAt)
          .map(entry => [entry.id, { ...entry, boughtAt: now }]),
      ),
      extras: clear(current.extras),
      checked: clear(current.checked),
      swaps: clear(current.swaps),
      skipped: clear(current.skipped),
      meta: { shopper: null },
    });
  }, [commit]);

  const addFridgeItems = useCallback(
    (items: Omit<FridgeItem, 'id' | 'addedAt'>[]) => {
      const now = Date.now();
      commit({
        fridge: Object.fromEntries(
          items.map(item => {
            const id = newId('k');
            return [id, { ...item, id, addedAt: now }];
          }),
        ),
      });
    },
    [commit],
  );

  const addFridge = useCallback((item: Omit<FridgeItem, 'id' | 'addedAt'>) => addFridgeItems([item]), [addFridgeItems]);

  const removeFridge = useCallback((id: string) => commit({ fridge: { [id]: null } }), [commit]);

  const clearBought = useCallback(() => {
    const current = stateRef.current;
    commit({
      entries: Object.fromEntries(
        Object.values(current.entries)
          .filter(entry => entry.boughtAt)
          .map(entry => [entry.id, null]),
      ),
    });
  }, [commit]);

  const value = useMemo(
    () => ({
      state,
      ready,
      entries,
      activeEntries,
      entryFor,
      addMeal,
      removeEntry,
      updateEntry,
      setStore,
      addExtra,
      updateExtra,
      removeExtras,
      setChecked,
      putAllBack,
      swapLine,
      skipLine,
      finishShopping,
      clearBought,
      addFridge,
      addFridgeItems,
      removeFridge,
      commit,
      replaceState,
      onLocalPatch,
    }),
    [
      state,
      ready,
      entries,
      activeEntries,
      entryFor,
      addMeal,
      removeEntry,
      updateEntry,
      setStore,
      addExtra,
      updateExtra,
      removeExtras,
      setChecked,
      putAllBack,
      swapLine,
      skipLine,
      finishShopping,
      clearBought,
      addFridge,
      addFridgeItems,
      removeFridge,
      commit,
      replaceState,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useShopping(): ShoppingContext {
  const context = useContext(Context);
  if (!context) throw new Error('useShopping må brukes inne i ShoppingProvider');
  return context;
}

// Den samlede lista for butikken som er valgt, gruppert etter ruta.
export function useShoppingList() {
  const { state } = useShopping();
  const { findMeal } = useMeals();
  const { stores } = useApp();
  const store = stores.find(s => s.id === state.meta.storeId) ?? stores[0];
  const chain = store ? storeChain(store) : null;
  const lines = useMemo(() => buildLines(state, findMeal, chain), [state, findMeal, chain]);
  const stops = useMemo(() => groupByStops(lines, store?.stops ?? []), [lines, store]);
  const remaining = lines.filter(line => !state.checked[line.key] && !state.skipped[line.key]).length;
  return { lines, stops, store, remaining };
}

export type SaveMeal = { meal: Meal; uses: FridgeItem[]; soonest: number | null };

// Sparemiddag: middager som bruker opp det dere har hjemme, det som går ut først øverst.
export function saveMeals(meals: Meal[], fridge: FridgeItem[]): SaveMeal[] {
  if (fridge.length === 0) return [];
  const result: SaveMeal[] = [];
  for (const meal of meals) {
    const uses: FridgeItem[] = [];
    for (const ingredient of meal.ingredients) {
      if (isPantry(ingredient)) continue;
      const match = fridgeMatch(ingredient.name, fridge);
      if (match && !uses.includes(match)) uses.push(match);
    }
    if (uses.length === 0) continue;
    const days = uses.map(item => daysUntil(item.expires)).filter((d): d is number => d !== null);
    result.push({ meal, uses, soonest: days.length ? Math.min(...days) : null });
  }
  return result.sort(
    (a, b) => (a.soonest ?? 99) - (b.soonest ?? 99) || b.uses.length - a.uses.length,
  );
}

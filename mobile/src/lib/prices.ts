import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

import { API_ORIGIN } from '@/constants/config';
import { forChain, type Ingredient, type Meal } from '@/data/meals';
import type { Store } from '@/data/stores';
import { BASE_PERSONS, ingredientPrice, mealBase } from '@/lib/meals';

// Pris per kjede for én vare, f.eks. { KIWI: 54.9, REMA_1000: 57.9 }.
export type ChainPrices = Record<string, number>;
export type PriceBook = Record<string, ChainPrices>;

// Kassalapp sine kjedekoder. Butikker brukeren legger til selv får kjede ut fra navnet.
const CHAIN_RULES: [RegExp, string][] = [
  [/rema/i, 'REMA_1000'],
  [/kiwi/i, 'KIWI'],
  [/meny/i, 'MENY_NO'],
  [/spar/i, 'SPAR_NO'],
  [/joker/i, 'JOKER_NO'],
  [/bunnpris/i, 'BUNNPRIS'],
  [/prix/i, 'COOP_PRIX'],
  [/mega/i, 'COOP_MEGA'],
  [/obs/i, 'COOP_OBS'],
  [/marked/i, 'COOP_MARKED'],
  [/oda/i, 'ODA_NO'],
  [/extra|coop/i, 'COOP_EXTRA'],
];

// Kassalapp har ofte bare én felles kode for Coop-butikkene.
const CHAIN_FALLBACK: Record<string, string> = {
  COOP_EXTRA: 'COOP_NO',
  COOP_PRIX: 'COOP_NO',
  COOP_MEGA: 'COOP_NO',
  COOP_OBS: 'COOP_NO',
  COOP_MARKED: 'COOP_NO',
};

export function chainPrice(prices: ChainPrices | undefined, chain: string | null): number | undefined {
  if (!prices || !chain) return undefined;
  return prices[chain] ?? (CHAIN_FALLBACK[chain] ? prices[CHAIN_FALLBACK[chain]] : undefined);
}

export function chainFor(store: Pick<Store, 'id' | 'name'>): string | null {
  const text = `${store.id} ${store.name}`;
  return CHAIN_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

const COUNT_UNITS = ['stk', 'boks', 'pose', 'pakke', 'pk', 'glass', 'flaske', 'beger', 'porsjon', 'terning', 'hode', 'bunt'];
const PANTRY_NAME = /^(salt|pepper|salt og pepper|vann|olje|olivenolje|rapsolje|nøytral olje|matolje)$/i;

// Skjeer og en klype salt kjøper man ikke til hver middag.
export function isPantry(ingredient: Ingredient): boolean {
  if (ingredient.pantry !== undefined) return ingredient.pantry;
  const unit = ingredient.unit.toLowerCase();
  return unit === 'ss' || unit === 'ts' || unit === 'klype' || PANTRY_NAME.test(ingredient.name.trim());
}

// Gjør om til felles grunnenhet så oppskriftens mengde kan sammenlignes med pakken.
export function toBase(value: number, unit: string | null | undefined): { value: number; unit: 'g' | 'ml' | 'stk' } | null {
  switch ((unit ?? '').toLowerCase()) {
    case 'g':
      return { value, unit: 'g' };
    case 'kg':
      return { value: value * 1000, unit: 'g' };
    case 'ml':
      return { value, unit: 'ml' };
    case 'cl':
      return { value: value * 10, unit: 'ml' };
    case 'dl':
      return { value: value * 100, unit: 'ml' };
    case 'l':
      return { value: value * 1000, unit: 'ml' };
    case 'stk':
      return { value, unit: 'stk' };
    default:
      return null;
  }
}

const ESTIMATE_PACK = 500;

// Enheter der én i oppskriften er én pakke i butikken, uansett hva pakken veier.
const CONTAINER_UNITS = ['boks', 'glass', 'flaske', 'pose', 'pakke', 'beger', 'hode', 'bunt'];

// Hvor mange hele pakker som må kjøpes. Litt slingringsmonn, så 410 g ikke blir to pakker à 400 g.
export function packsNeeded(ingredient: Ingredient, persons: number, base = BASE_PERSONS): number {
  const quantity = (ingredient.quantity * persons) / base;
  const unit = ingredient.unit.toLowerCase();
  const whole = Math.max(1, Math.ceil(quantity - 0.05));
  if (unit === 'pk' || unit === 'pakke') return whole;

  const product = ingredient.product;
  if (product) {
    // «2 boks hakkede tomater» er to bokser, selv om boksen er oppgitt i gram.
    if (CONTAINER_UNITS.includes(unit)) return whole;
    if (product.packSize) {
      const need = toBase(quantity, unit);
      const pack = toBase(product.packSize, product.packUnit);
      // Gram og milliliter regnes likt for rømme, melk og lignende.
      const sameFamily =
        need && pack && (need.unit === pack.unit || (need.unit !== 'stk' && pack.unit !== 'stk'));
      if (need && pack && sameFamily && pack.value > 0) {
        return Math.max(1, Math.ceil(need.value / pack.value - 0.05));
      }
    }
    // Ukjent forhold mellom oppskrift og pakke (f.eks. «2 stk løk» mot en kilopose): én pakke.
    return 1;
  }
  if (COUNT_UNITS.includes(unit)) return Math.max(1, Math.round(quantity));
  // Uten koblet vare gjetter vi pakker på rundt en halv kilo eller liter, så
  // prisanslaget vokser med antall personer.
  const need = toBase(quantity, unit);
  if (need && need.unit !== 'stk') return Math.max(1, Math.ceil(need.value / ESTIMATE_PACK - 0.05));
  return 1;
}

export type PriceSource = 'exact' | 'old' | 'other-chain' | 'estimate' | 'pantry';

export type ItemPrice = { amount: number; packs: number; source: PriceSource; unitPrice: number | null };

export function ingredientCost(
  ingredient: Ingredient,
  persons: number,
  base: number,
  chain: string | null,
  book: PriceBook,
): ItemPrice {
  ingredient = forChain(ingredient, chain);
  const packs = packsNeeded(ingredient, persons, base);
  if (isPantry(ingredient)) return { amount: 0, packs, source: 'pantry', unitPrice: null };

  const prices = ingredient.product ? book[ingredient.product.ean] : undefined;
  const exact = chainPrice(prices, chain);
  if (exact) {
    // En gammel pris fra riktig kjede er bedre enn en fersk fra en annen kjede, men den er et anslag.
    const source = isStalePrice(ingredient.product?.ean, chain) ? 'old' : 'exact';
    return { amount: exact * packs, packs, source, unitPrice: exact };
  }

  // Kjeden mangler pris (vanlig for Coop): snittet fra de andre kjedene er et godt anslag.
  const others = prices ? Object.values(prices) : [];
  if (others.length) {
    const average = others.reduce((sum, value) => sum + value, 0) / others.length;
    return { amount: average * packs, packs, source: 'other-chain', unitPrice: average };
  }

  return { amount: ingredientPrice(ingredient.name) * packs, packs, source: 'estimate', unitPrice: null };
}

export type MealPrice = {
  total: number;
  exact: boolean; // alle varer som skal kjøpes har ekte pris fra denne kjeden
  priced: number; // varer med ekte pris
  toBuy: number; // varer som telles med (ikke «har hjemme»)
};

export function mealPrice(meal: Meal, persons: number, chain: string | null, book: PriceBook): MealPrice {
  const base = mealBase(meal);
  let total = 0;
  let priced = 0;
  let toBuy = 0;
  for (const ingredient of meal.ingredients) {
    const cost = ingredientCost(ingredient, persons, base, chain, book);
    if (cost.source === 'pantry') continue;
    toBuy += 1;
    if (cost.source === 'exact') priced += 1;
    total += cost.amount;
  }
  return { total: Math.round(total), exact: toBuy > 0 && priced === toBuy, priced, toBuy };
}

export function formatPrice(price: MealPrice): string {
  return `${price.exact ? '' : 'ca. '}${price.total} kr`;
}

export function formatKroner(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} kr`;
}

export function mealEans(meals: Meal[]): string[] {
  const eans = new Set<string>();
  for (const meal of meals)
    for (const ing of meal.ingredients) {
      if (ing.product?.ean) eans.add(ing.product.ean);
      for (const product of Object.values(ing.storeProducts ?? {})) if (product?.ean) eans.add(product.ean);
    }
  return [...eans].sort();
}

// ---- Henting og mellomlagring av priser ----
// Prisene lagres i minnet og på telefonen i seks timer, så lista vises med en gang
// neste gang og vi holder oss godt innenfor Kassalapps grenser.

const CACHE_KEY = 'handleklar.prices';
const TTL_MS = 6 * 60 * 60 * 1000;
type CacheEntry = { prices: ChainPrices; at: number; image?: string | null; dates?: Record<string, string> };
const memory = new Map<string, CacheEntry>();
// Produktbilder kommer med prisoppslaget, så faste middager også får bilder i lista.
const images = new Map<string, string>();

// Når prisen i hver kjede sist ble sjekket. Kiwi- og Rema-priser hos Kassalapp kan
// være flere år gamle; de brukes, men regnes som anslag («ca.»).
const priceDates = new Map<string, Record<string, string>>();
const STALE_MS = 60 * 86400000;

export function priceDate(ean: string | undefined | null, chain: string | null): string | null {
  if (!ean || !chain) return null;
  const dates = priceDates.get(ean);
  return dates?.[chain] ?? dates?.[CHAIN_FALLBACK[chain] ?? ''] ?? null;
}

export function isStalePrice(ean: string | undefined | null, chain: string | null): boolean {
  const date = priceDate(ean, chain);
  return Boolean(date) && Date.now() - new Date(date as string).getTime() > STALE_MS;
}

export function productImage(ean: string | undefined | null): string | null {
  return ean ? (images.get(ean) ?? null) : null;
}
const listeners = new Set<() => void>();
let diskLoaded: Promise<void> | null = null;
let unavailable: string | null = null;

function notify() {
  listeners.forEach(listener => listener());
}

function loadDisk(): Promise<void> {
  diskLoaded ??= AsyncStorage.getItem(CACHE_KEY)
    .then(raw => {
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, CacheEntry>;
      for (const [ean, entry] of Object.entries(saved)) {
        if (!memory.has(ean)) memory.set(ean, entry);
        if (entry.image) images.set(ean, entry.image);
        if (entry.dates) priceDates.set(ean, entry.dates);
      }
    })
    .catch(() => {});
  return diskLoaded;
}

function persist() {
  const fresh = Object.fromEntries([...memory].filter(([, entry]) => Date.now() - entry.at < TTL_MS));
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
}

// Søkeresultater har allerede pris per kjede; de legges rett i boka.
export function rememberPrices(ean: string, prices: ChainPrices) {
  memory.set(ean, { prices, at: Date.now() });
  persist();
  notify();
}

const inFlight = new Set<string>();

async function fetchPrices(eans: string[]) {
  await loadDisk();
  const stale = eans.filter(ean => {
    const entry = memory.get(ean);
    return !inFlight.has(ean) && (!entry || Date.now() - entry.at > TTL_MS);
  });
  if (stale.length === 0) {
    notify();
    return;
  }
  stale.forEach(ean => inFlight.add(ean));
  try {
    for (let i = 0; i < stale.length; i += 100) {
      const chunk = stale.slice(i, i + 100);
      const response = await fetch(`${API_ORIGIN}/api/prices?eans=${chunk.join(',')}`);
      const body = (await response.json()) as {
        prices?: PriceBook;
        images?: Record<string, string>;
        dates?: Record<string, Record<string, string>>;
        unavailable?: string;
      };
      unavailable = body.unavailable ?? null;
      if (!response.ok || body.unavailable) continue;
      for (const ean of chunk) {
        const image = body.images?.[ean] ?? null;
        const dates = body.dates?.[ean];
        if (image) images.set(ean, image);
        if (dates) priceDates.set(ean, dates);
        memory.set(ean, { prices: body.prices?.[ean] ?? {}, at: Date.now(), image, dates });
      }
    }
    persist();
  } catch {
    unavailable = 'error';
  } finally {
    stale.forEach(ean => inFlight.delete(ean));
    notify();
  }
}

export function usePrices(eans: string[]): { book: PriceBook; unavailable: string | null } {
  const key = [...new Set(eans)].sort().join(',');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion(v => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (key) fetchPrices(key.split(','));
  }, [key]);

  const book = useMemo(() => {
    const result: PriceBook = {};
    if (!key) return result;
    for (const ean of key.split(',')) {
      const entry = memory.get(ean);
      if (entry) result[ean] = entry.prices;
    }
    return result;
    // version endres når nye priser kommer inn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return { book, unavailable };
}

export type StorePrice = { store: Store; price: MealPrice };

// Pris i hver av brukerens butikker, billigst først.
export function pricesByStore(meal: Meal, persons: number, stores: Store[], book: PriceBook): StorePrice[] {
  return stores
    .map(store => ({ store, price: mealPrice(meal, persons, chainFor(store), book) }))
    .sort((a, b) => a.price.total - b.price.total);
}

const MONTH = new Intl.DateTimeFormat('nb-NO', { month: 'long', year: 'numeric' });

// «Kiwi-prisene er fra april 2023 …» når en butikk bare har gamle priser.
export function stalePriceNote(meals: Meal[], stores: Store[]): string | null {
  const notes: string[] = [];
  for (const store of stores) {
    const chain = chainFor(store);
    let oldest: string | null = null;
    for (const meal of meals) {
      for (const ingredient of meal.ingredients) {
        const ean = ingredient.product?.ean;
        if (!isStalePrice(ean, chain)) continue;
        const date = priceDate(ean, chain);
        if (date && (!oldest || date < oldest)) oldest = date;
      }
    }
    if (oldest) notes.push(`${store.name}-prisene er fra ${MONTH.format(new Date(oldest))}`);
  }
  return notes.length ? `${notes.join(', ')}, så de kan være høyere nå.` : null;
}

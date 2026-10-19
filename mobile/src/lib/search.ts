import { useEffect, useState } from 'react';

import { API_ORIGIN } from '@/constants/config';
import type { Product } from '@/data/meals';
import { formatKroner, rememberPrices, type ChainPrices } from '@/lib/prices';

export type SearchHit = {
  ean: string;
  name: string;
  brand: string | null;
  image: string | null;
  weight: number | null;
  weightUnit: string | null;
  prices: ChainPrices;
};

export type SearchState = 'idle' | 'loading' | 'done' | 'no_key' | 'error';

const CHAIN_NAMES: Record<string, string> = {
  REMA_1000: 'Rema',
  KIWI: 'Kiwi',
  COOP_EXTRA: 'Extra',
  COOP_NO: 'Coop',
  MENY_NO: 'Meny',
  SPAR_NO: 'Spar',
  COOP_PRIX: 'Prix',
  COOP_MEGA: 'Mega',
  COOP_OBS: 'Obs',
  JOKER_NO: 'Joker',
  BUNNPRIS: 'Bunnpris',
  ODA_NO: 'Oda',
  ENGROSSNETT_NO: 'Engrossnett',
};

// Butikkene i Spydeberg. Prisen derfra vises først, siden det er der det handles.
const HOME_CHAINS = ['KIWI', 'REMA_1000', 'COOP_EXTRA', 'COOP_NO'];

function chainName(chain: string): string {
  if (CHAIN_NAMES[chain]) return CHAIN_NAMES[chain];
  // Ukjente koder som «NAERBUTIKKEN_NO» blir «Naerbutikken».
  const word = chain.replace(/_NO$/, '').replace(/_/g, ' ').toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function sizeText(weight: number | null | undefined, unit: string | null | undefined): string | null {
  if (!weight || !unit) return null;
  return `${String(weight).replace('.', ',')} ${unit}`;
}

export function cheapestText(prices: ChainPrices | undefined): string | null {
  const entries = Object.entries(prices ?? {}).sort((a, b) => a[1] - b[1]);
  if (!entries.length) return null;
  const home = entries.filter(([chain]) => HOME_CHAINS.includes(chain));
  const [chain, price] = home[0] ?? entries[0];
  return `${formatKroner(price)} hos ${chainName(chain)}`;
}

export function hitToProduct(hit: SearchHit): Product {
  return { ean: hit.ean, name: hit.name, image: hit.image, packSize: hit.weight, packUnit: hit.weightUnit };
}

export function hitMeta(hit: SearchHit): string {
  return [hit.brand, sizeText(hit.weight, hit.weightUnit), cheapestText(hit.prices) ?? 'ingen pris'].filter(Boolean).join(' · ');
}

// Søker hos Kassalapp mens du skriver, med en liten pause så vi ikke spør for hvert tastetrykk.
// Tidligere søk huskes mens appen er åpen, så du får treffene med en gang
// hvis du sletter tilbake til et ord du har søkt på.
const searchCache = new Map<string, SearchHit[]>();

export function useProductSearch(query: string, delay = 350): { hits: SearchHit[]; state: SearchState } {
  const key = query.trim().toLowerCase();
  // Treffene hører til ett bestemt søk. Gamle treff vises ikke mens nye hentes,
  // så du ikke trykker på en vare fra forrige søk.
  const [result, setResult] = useState<{ key: string; hits: SearchHit[] }>({ key: '', hits: [] });
  const [state, setState] = useState<SearchState>('idle');

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setResult({ key: '', hits: [] });
      setState('idle');
      return;
    }
    const cached = searchCache.get(needle.toLowerCase());
    if (cached) {
      setResult({ key: needle.toLowerCase(), hits: cached });
      setState('done');
      return;
    }
    setState('loading');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_ORIGIN}/api/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as { products?: SearchHit[]; unavailable?: string };
        if (body.unavailable === 'no_key') {
          setResult({ key: needle.toLowerCase(), hits: [] });
          setState('no_key');
        } else if (!response.ok || body.unavailable) {
          setResult({ key: needle.toLowerCase(), hits: [] });
          setState('error');
        } else {
          const products = body.products ?? [];
          products.forEach(hit => rememberPrices(hit.ean, hit.prices));
          searchCache.set(needle.toLowerCase(), products);
          setResult({ key: needle.toLowerCase(), hits: products });
          setState('done');
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState('error');
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay]);

  return { hits: result.key === key ? result.hits : [], state };
}

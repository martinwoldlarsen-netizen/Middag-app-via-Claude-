import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BackLink, Body, Button, Chip, Eyebrow, Page, PersonStepper, Title } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { Ingredient, Meal } from '@/data/meals';
import { BASE_PERSONS } from '@/lib/meals';
import { useMeals } from '@/lib/meals-store';
import { Counter } from '@/components/AddItemSheet';
import { cheapestText, hitMeta, hitToProduct, useProductSearch, type SearchHit } from '@/lib/search';
import { chainFor, formatPrice, isPantry, mealEans, pricesByStore, usePrices, type ChainPrices } from '@/lib/prices';
import { useShopping } from '@/lib/shopping';
import { useApp } from '@/lib/store';

const CATEGORIES = ['Kjøtt', 'Kylling', 'Fisk', 'Pasta', 'Meksikansk', 'Pizza', 'Suppe', 'Vegetar', 'Enkelt'];

type DraftItem = Ingredient & { key: string };

let nextKey = 0;
const newKey = () => `vare-${Date.now()}-${nextKey++}`;

export default function NewMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; fra?: string }>();
  const { persons, stores } = useApp();
  const { findMeal, saveMeal, loading } = useMeals();
  const { addMeal } = useShopping();

  const editing = params.id ? findMeal(params.id) : undefined;
  const template = editing ?? (params.fra ? findMeal(params.fra) : undefined);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Enkelt');
  const [basePersons, setBasePersons] = useState(persons);
  const [time, setTime] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [query, setQuery] = useState('');
  const { hits, state: searchState } = useProductSearch(query);
  const [linking, setLinking] = useState<string | null>(null);
  // Kobler vi en egen vare for én butikk (f.eks. Petti på Rema), står kjeden her.
  const [linkChain, setLinkChain] = useState<string | null>(null);
  const storeOptions = useMemo(() => {
    const seen = new Set<string>();
    return stores
      .map(store => ({ chain: chainFor(store), name: store.name }))
      .filter((option): option is { chain: string; name: string } => {
        if (!option.chain || seen.has(option.chain)) return false;
        seen.add(option.chain);
        return true;
      });
  }, [stores]);
  const storeName = (chain: string) => storeOptions.find(option => option.chain === chain)?.name ?? chain;
  const searchRef = useRef<TextInput>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fyller skjemaet når vi endrer en middag eller lager vår versjon av en fast rett.
  useEffect(() => {
    if (initialized || (loading && (params.id || params.fra) && !template)) return;
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setBasePersons(template.basePersons ?? BASE_PERSONS);
      setTime(template.timeMinutes ? String(template.timeMinutes) : '');
      setStepsText(template.steps.join('\n'));
      setItems(template.ingredients.map(ingredient => ({ ...ingredient, key: newKey() })));
    }
    setInitialized(true);
  }, [initialized, loading, params.id, params.fra, template]);

  const addedFor = (ean: string) => items.find(item => item.product?.ean === ean);

  const eans = useMemo(() => mealEans([{ ingredients: items } as unknown as Meal]), [items]);
  const { book } = usePrices(eans);

  const draftMeal: Meal = {
    id: 'utkast',
    name: name || 'Ny middag',
    emoji: '🍽️',
    description: template?.description ?? '',
    timeMinutes: Number(time) || 0,
    priceLevel: 0,
    category,
    tags: [],
    ingredients: items,
    steps: [],
    basePersons,
  };
  const storePrices = items.length ? pricesByStore(draftMeal, basePersons, stores, book) : [];

  function updateItem(key: string, change: Partial<Ingredient>) {
    setItems(current => current.map(item => (item.key === key ? { ...item, ...change } : item)));
  }

  // Som i Rema-appen: søket står åpent, og trykker du på samme vare igjen, øker antallet.
  function pick(hit: SearchHit) {
    if (linking && linkChain) {
      const item = items.find(other => other.key === linking);
      updateItem(linking, { storeProducts: { ...item?.storeProducts, [linkChain]: hitToProduct(hit) } });
      setLinking(null);
      setLinkChain(null);
      setQuery('');
      return;
    }
    if (linking) {
      updateItem(linking, { product: hitToProduct(hit) });
      setLinking(null);
      setQuery('');
      return;
    }
    const existing = items.find(item => item.product?.ean === hit.ean);
    if (existing) {
      updateItem(existing.key, { quantity: Math.floor(existing.quantity) + 1 });
      return;
    }
    setItems(current => [
      ...current,
      { key: newKey(), name: hit.name, quantity: 1, unit: 'pk', section: '', product: hitToProduct(hit) },
    ]);
  }

  function changeCount(item: DraftItem, delta: number) {
    const next = Math.floor(item.quantity) + delta;
    if (next <= 0) setItems(current => current.filter(other => other.key !== item.key));
    else updateItem(item.key, { quantity: next });
  }

  function addFreeText() {
    const text = query.trim();
    if (!text) return;
    if (linking) {
      updateItem(linking, { name: text });
      setLinking(null);
    } else {
      setItems(current => [...current, { key: newKey(), name: text, quantity: 1, unit: 'stk', section: '' }]);
    }
    setQuery('');
  }

  function startLinking(item: DraftItem, chain: string | null = null) {
    setLinking(item.key);
    setLinkChain(chain);
    setQuery(item.name);
    searchRef.current?.focus();
  }

  // «Lagre og legg i handlelista»: når du lager middagen fordi du skal lage den
  // nå, havner den rett i uka og varene i handlelista.
  async function save(shopNow = false) {
    if (!name.trim()) {
      setError('Gi middagen et navn.');
      return;
    }
    if (items.length === 0) {
      setError('Legg til minst én vare.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveMeal({
        id: editing?.custom ? String(editing.id) : undefined,
        name: name.trim(),
        emoji: template?.emoji ?? '🍽️',
        description: template?.description ?? '',
        timeMinutes: Number(time) || 0,
        priceLevel: 0,
        category,
        tags: template?.tags ?? [],
        ingredients: items.map(({ key: _key, ...ingredient }) => ingredient),
        steps: stepsText
          .split('\n')
          .map(step => step.trim())
          .filter(Boolean),
        basePersons,
        basedOn: editing?.custom ? editing.basedOn : typeof template?.id === 'number' ? template.id : undefined,
      });
      if (shopNow) {
        addMeal(saved.id, basePersons);
        router.replace('/handleliste');
      } else {
        router.replace(`/rett/${saved.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre');
      setSaving(false);
    }
  }

  const linkingItem = items.find(item => item.key === linking);
  const title = editing ? `Endre ${editing.name}` : template ? `Din versjon av ${template.name}` : 'Ny middag';

  return (
    <Page maxWidth={760}>
      <BackLink label="Tilbake" href="/" />
      <View style={styles.header}>
        <Eyebrow>Egen middag</Eyebrow>
        <Title size="lg">{title}</Title>
        <Body>Søk opp varene slik du handler dem. Prisen regnes ut fra dagens priser i butikkene dine.</Body>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Navn</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="F.eks. Madelén pasta"
          placeholderTextColor={colors.muted}
          style={styles.input}
          maxLength={80}
          accessibilityLabel="Navn på middagen"
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {CATEGORIES.map(option => (
            <Chip key={option} label={option} selected={option === category} onPress={() => setCategory(option)} />
          ))}
        </View>

        <View style={styles.inlineFields}>
          <View style={styles.field}>
            <Text style={styles.label}>Mengdene gjelder for</Text>
            <PersonStepper value={basePersons} onChange={next => setBasePersons(Math.min(12, Math.max(1, next)))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Tid (minutter)</Text>
            <TextInput
              value={time}
              onChangeText={text => setTime(text.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="30"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.input, styles.timeInput]}
              accessibilityLabel="Tid i minutter"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Title size="md">Varer</Title>

        {items.length === 0 ? (
          <Body>Ingen varer ennå. Søk under og trykk + for å legge til.</Body>
        ) : (
          <View style={styles.items}>
            {items.map(item => (
              <ItemRow
                key={item.key}
                item={item}
                prices={item.product ? book[item.product.ean] : undefined}
                linking={item.key === linking}
                onChange={change => updateItem(item.key, change)}
                onRemove={() => setItems(current => current.filter(other => other.key !== item.key))}
                onLink={() => startLinking(item)}
                storeOptions={storeOptions}
                onLinkStore={chain => startLinking(item, chain)}
                onRemoveStore={chain => {
                  const next = { ...item.storeProducts };
                  delete next[chain];
                  updateItem(item.key, { storeProducts: next });
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.searchBox}>
          {linkingItem && (
            <View style={styles.linkBanner}>
              <Text style={styles.linkBannerText} numberOfLines={2}>
                {linkChain ? `Velg vare for «${linkingItem.name}» i ${storeName(linkChain)}` : `Velg vare for «${linkingItem.name}»`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setLinking(null);
                  setLinkChain(null);
                }}
                hitSlop={8}>
                <Text style={styles.linkCancel}>Avbryt</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.inkSoft} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => (hits[0] ? pick(hits[0]) : addFreeText())}
              placeholder="Søk etter vare, f.eks. kjøttdeig"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Søk etter vare"
            />
            {searchState === 'loading' && <ActivityIndicator size="small" color={colors.inkSoft} />}
            {query.length > 0 && (
              <Pressable accessibilityLabel="Tøm søket" onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {searchState === 'no_key' && (
            <Text style={styles.searchNote}>
              Varesøket er ikke slått på ennå. Du kan likevel legge til varene som tekst.
            </Text>
          )}
          {searchState === 'error' && (
            <Text style={styles.searchNote}>Fikk ikke søkt akkurat nå. Prøv igjen, eller legg til som tekst.</Text>
          )}
          {searchState === 'done' && hits.length === 0 && (
            <Text style={styles.searchNote}>Fant ingen varer. Prøv et annet ord.</Text>
          )}

          {hits.slice(0, 8).map(hit => (
            <Pressable
              key={hit.ean}
              accessibilityRole="button"
              accessibilityLabel={`${linking ? 'Velg' : 'Legg til'} ${hit.name}`}
              onPress={() => pick(hit)}
              style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => [
                styles.hit,
                (hovered || pressed) && styles.hitActive,
              ]}>
              <View style={styles.hitImage}>
                {hit.image ? (
                  <Image source={{ uri: hit.image }} style={StyleSheet.absoluteFill} contentFit="contain" />
                ) : (
                  <Ionicons name="cube-outline" size={22} color={colors.muted} />
                )}
              </View>
              <View style={styles.hitText}>
                <Text style={styles.hitName} numberOfLines={2}>
                  {hit.name}
                </Text>
                <Text style={styles.hitMeta} numberOfLines={1}>
                  {hitMeta(hit)}
                </Text>
              </View>
              {!linking && addedFor(hit.ean) ? (
                <Counter
                  value={addedFor(hit.ean)!.quantity}
                  unit="pk"
                  label={hit.name}
                  onMinus={() => changeCount(addedFor(hit.ean)!, -1)}
                  onPlus={() => changeCount(addedFor(hit.ean)!, 1)}
                />
              ) : (
                <View style={styles.hitAdd}>
                  <Ionicons name={linking ? 'link' : 'add'} size={20} color={colors.ink} />
                </View>
              )}
            </Pressable>
          ))}

          {query.trim().length >= 2 && searchState !== 'loading' && !linkChain && (
            <Pressable accessibilityRole="button" onPress={addFreeText} style={styles.freeText}>
              <Ionicons name="text-outline" size={16} color={colors.green} />
              <Text style={styles.freeTextLabel}>
                {linking ? `Bruk «${query.trim()}» som navn` : `Legg til «${query.trim()}» uten vare`}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {storePrices.length > 0 && (
        <View style={styles.priceCard}>
          <Eyebrow>Pris for {basePersons} {basePersons === 1 ? 'person' : 'personer'}</Eyebrow>
          {storePrices.map(({ store, price }) => (
            <View key={store.id} style={styles.priceRow}>
              <Text style={styles.priceStore}>{store.name}</Text>
              <Text style={styles.priceValue}>{formatPrice(price)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Title size="md">Slik gjør du</Title>
        <Body>Valgfritt. Ett steg per linje.</Body>
        <TextInput
          value={stepsText}
          onChangeText={setStepsText}
          placeholder={'Stek kjøttdeigen.\nKok pastaen.'}
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.stepsInput]}
          accessibilityLabel="Fremgangsmåte"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        {!editing?.custom && (
          <Button
            label={saving ? 'Lagrer …' : 'Lagre og legg i handlelista'}
            icon="basket-outline"
            onPress={() => save(true)}
            disabled={saving}
          />
        )}
        <Button
          label={editing?.custom ? (saving ? 'Lagrer …' : 'Lagre endringer') : 'Bare lagre'}
          icon="checkmark"
          variant={editing?.custom ? 'primary' : 'outline'}
          onPress={() => save(false)}
          disabled={saving}
        />
        <Button label="Avbryt" variant="outline" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
    </Page>
  );
}

function ItemRow({
  item,
  prices,
  linking,
  onChange,
  onRemove,
  onLink,
  storeOptions,
  onLinkStore,
  onRemoveStore,
}: {
  item: DraftItem;
  prices: ChainPrices | undefined;
  linking: boolean;
  onChange: (change: Partial<Ingredient>) => void;
  onRemove: () => void;
  onLink: () => void;
  storeOptions: { chain: string; name: string }[];
  onLinkStore: (chain: string) => void;
  onRemoveStore: (chain: string) => void;
}) {
  const [showStores, setShowStores] = useState(false);
  const overrides = Object.entries(item.storeProducts ?? {}).filter(([, product]) => product);
  const nameFor = (chain: string) => storeOptions.find(option => option.chain === chain)?.name ?? chain;
  const free = storeOptions.filter(option => !item.storeProducts?.[option.chain]);
  const pantry = isPantry(item);
  const counted = item.unit === 'pk' || item.unit === 'stk';
  const [amountText, setAmountText] = useState(String(item.quantity).replace('.', ','));

  return (
    <View style={[styles.item, linking && styles.itemLinking]}>
      <View style={styles.itemImage}>
        {item.product?.image ? (
          <Image source={{ uri: item.product.image }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <Ionicons name={item.product ? 'cube-outline' : 'text-outline'} size={20} color={colors.muted} />
        )}
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemMeta} numberOfLines={1}>
          {item.product
            ? [item.product.name !== item.name ? item.product.name : null, cheapestText(prices) ?? 'henter pris …']
                .filter(Boolean)
                .join(' · ')
            : 'Ingen vare koblet, prisen anslås'}
        </Text>
        <View style={styles.itemActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.product ? `Bytt vare for ${item.name}` : `Koble vare til ${item.name}`}
            onPress={onLink}
            hitSlop={6}>
            <Text style={styles.itemLink}>{item.product ? 'Bytt vare' : 'Koble vare'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="checkbox"
            aria-checked={pantry}
            accessibilityLabel={`Har hjemme: ${item.name}`}
            onPress={() => onChange({ pantry: !pantry })}
            hitSlop={6}
            style={styles.pantryToggle}>
            <Ionicons name={pantry ? 'checkbox' : 'square-outline'} size={16} color={colors.inkSoft} />
            <Text style={styles.pantryText}>Har hjemme</Text>
          </Pressable>
        </View>
        {overrides.map(([chain, product]) => (
          <View key={chain} style={styles.storeRow}>
            <Text style={styles.storeRowText} numberOfLines={1}>
              {nameFor(chain)}: {product?.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Fjern egen vare i ${nameFor(chain)} for ${item.name}`}
              onPress={() => onRemoveStore(chain)}
              hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        {item.product && free.length > 0 && (
          <>
            <Pressable accessibilityRole="button" aria-expanded={showStores} onPress={() => setShowStores(open => !open)} hitSlop={6}>
              <Text style={styles.itemLinkSoft}>Annen vare i en butikk</Text>
            </Pressable>
            {showStores && (
              <View style={styles.storeChips}>
                {free.map(option => (
                  <Pressable
                    key={option.chain}
                    accessibilityRole="button"
                    accessibilityLabel={`Annen vare i ${option.name} for ${item.name}`}
                    onPress={() => {
                      setShowStores(false);
                      onLinkStore(option.chain);
                    }}
                    style={styles.storeChip}>
                    <Text style={styles.storeChipText}>{option.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
      <View style={styles.itemAmount}>
        {counted ? (
          <View style={styles.counter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Færre ${item.name}`}
              onPress={() => (item.quantity <= 1 ? onRemove() : onChange({ quantity: item.quantity - 1 }))}
              style={styles.counterButton}>
              <Ionicons name={item.quantity <= 1 ? 'trash-outline' : 'remove'} size={16} color={colors.ink} />
            </Pressable>
            <Text style={styles.counterValue}>
              {String(item.quantity).replace('.', ',')} {item.unit}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Flere ${item.name}`}
              onPress={() => onChange({ quantity: Math.floor(item.quantity) + 1 })}
              style={styles.counterButton}>
              <Ionicons name="add" size={16} color={colors.ink} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.amountField}>
            <TextInput
              value={amountText}
              onChangeText={text => {
                setAmountText(text);
                const value = Number(text.replace(',', '.'));
                if (Number.isFinite(value) && value > 0) onChange({ quantity: value });
              }}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              accessibilityLabel={`Mengde ${item.name}`}
            />
            <Text style={styles.amountUnit}>{item.unit}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Fjern ${item.name}`} onPress={onRemove} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    minHeight: 48,
    outlineStyle: 'none',
  } as object,
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  timeInput: {
    width: 110,
  },
  section: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  items: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexWrap: 'wrap',
  },
  itemLinking: {
    backgroundColor: colors.lime,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemBody: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  itemName: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  itemMeta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 4,
  },
  itemLinkSoft: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  storeRowText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
  },
  storeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  storeChip: {
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  storeChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  itemLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  pantryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pantryText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  itemAmount: {
    marginLeft: 'auto',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.beige,
    borderRadius: radius.round,
  },
  counterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    minWidth: 52,
    textAlign: 'center',
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    color: colors.ink,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountInput: {
    width: 72,
    backgroundColor: colors.beige,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    outlineStyle: 'none',
  } as object,
  amountUnit: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.inkSoft,
    minWidth: 28,
  },
  searchBox: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  linkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.lime,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkBannerText: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink,
  },
  linkCancel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.beige,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: spacing.md,
    outlineStyle: 'none',
  } as object,
  searchNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  hitActive: {
    borderColor: colors.ink,
  },
  hitImage: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hitText: {
    flex: 1,
    gap: 2,
  },
  hitName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  hitMeta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
  },
  hitAdd: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  freeTextLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.green,
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  priceCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.beige,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  priceStore: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  priceValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    color: colors.ink,
  },
  stepsInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: spacing.xl,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});

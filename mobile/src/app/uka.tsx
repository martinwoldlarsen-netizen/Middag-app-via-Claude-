import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Counter } from '@/components/AddItemSheet';
import { Body, Button, Chip, Eyebrow, Page, Title } from '@/components/ui';
import { WeekBalance } from '@/components/WeekBalance';
import { WeekSuggestions } from '@/components/WeekSuggestions';
import { categoryTints, colors, defaultTint, fonts, radius, spacing } from '@/constants/theme';
import { INSPO } from '@/data/inspo';
import type { Meal } from '@/data/meals';
import { useMeals } from '@/lib/meals-store';
import { photoFor } from '@/lib/photos';
import { formatPrice, mealEans, mealPrice, usePrices, type PriceBook } from '@/lib/prices';
import {
  buildLines,
  DAYS,
  DAYS_SHORT,
  lineEans,
  listPrice,
  storeChain,
  useShopping,
  useShoppingList,
  type PlanEntry,
} from '@/lib/shopping';
import { useApp } from '@/lib/store';

// Planlegging hjemme: velg middagene for uka, hvilken dag og hvor mange som
// spiser. I butikken blir alt til én samlet handleliste.
export default function WeekScreen() {
  const router = useRouter();
  const { stores, persons, ready: appReady } = useApp();
  const { findMeal, meals: myMeals } = useMeals();
  const { ready, entries, addMeal, removeEntry, updateEntry, setStore, clearBought, state } = useShopping();
  const { lines, store, remaining } = useShoppingList();

  const planned = entries.map(entry => ({ entry, meal: findMeal(entry.mealId) })).filter(item => item.meal) as {
    entry: PlanEntry;
    meal: Meal;
  }[];
  const { book } = usePrices([...lineEans(lines), ...mealEans(planned.map(item => item.meal))]);

  if (!ready || !appReady) return null;

  const active = planned.filter(item => !item.entry.boughtAt);
  const bought = planned.filter(item => item.entry.boughtAt);
  const portions = active.reduce((sum, item) => sum + item.entry.persons, 0);
  // Hver butikk regnes med sine egne varer (f.eks. Petti på Rema, Mutti på Kiwi).
  const storePrices = stores
    .map(s => ({ store: s, price: listPrice(buildLines(state, findMeal, storeChain(s)), storeChain(s), book) }))
    .sort((a, b) => a.price.total - b.price.total);
  const current = storePrices.find(item => item.store.id === store?.id) ?? storePrices[0];
  const cheapest = storePrices[0];

  return (
    <Page maxWidth={860}>
      <View style={styles.header}>
        <Eyebrow>Ukeplan</Eyebrow>
        <Title size="lg">Ukas middager</Title>
        <Body>Velg middagene hjemme. I butikken får du alt i én liste, i den rekkefølgen du går.</Body>
      </View>

      {active.length === 0 && bought.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={36} color={colors.ink} />
          <Title size="sm">Ingen middager i uka ennå</Title>
          <Body style={styles.center}>Trykk + på middagene du vil ha, så havner de her.</Body>
          <Button label="Velg middager" icon="restaurant-outline" onPress={() => router.navigate('/')} />
        </View>
      ) : (
        <>
          {active.length > 0 && current && (
            <View style={styles.summary}>
              <View style={styles.summaryNumbers}>
                <View>
                  <Text style={styles.summaryValue}>{active.length}</Text>
                  <Text style={styles.summaryLabel}>{active.length === 1 ? 'middag' : 'middager'}</Text>
                </View>
                <View>
                  <Text style={styles.summaryValue}>{formatPrice(current.price)}</Text>
                  <Text style={styles.summaryLabel}>i {current.store.name}</Text>
                </View>
                <View>
                  <Text style={styles.summaryValue}>{portions ? Math.round(current.price.total / portions) : 0} kr</Text>
                  <Text style={styles.summaryLabel}>per porsjon</Text>
                </View>
              </View>
              {cheapest && cheapest.store.id !== current.store.id && current.price.total - cheapest.price.total >= 5 && (
                <Text style={styles.cheaper}>
                  {cheapest.store.name} er {current.price.total - cheapest.price.total} kr billigere for denne uka.
                </Text>
              )}
              <Text style={styles.summaryLabel}>Handler i</Text>
              <View style={styles.chips}>
                {stores.map(s => (
                  <Chip key={s.id} label={s.name} selected={s.id === store?.id} onPress={() => setStore(s.id)} />
                ))}
              </View>
              <Button
                label={`Til handlelista (${remaining} ${remaining === 1 ? 'vare' : 'varer'})`}
                icon="basket-outline"
                onPress={() => router.navigate('/handleliste')}
                style={styles.summaryButton}
              />
            </View>
          )}

          <View style={styles.list}>
            {active.map(({ entry, meal }) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                meal={meal}
                chain={storeChain(store)}
                book={book}
                onOpen={() => router.push(`/rett/${meal.id}`)}
                onDay={day => updateEntry(entry.id, { day })}
                onPersons={persons => updateEntry(entry.id, { persons })}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Legg til middag" icon="add" variant="outline" onPress={() => router.navigate('/')} />
          </View>

          <WeekBalance
            meals={active.map(item => item.meal)}
            candidates={[...myMeals, ...INSPO]}
            onAdd={meal => addMeal(meal.id, persons)}
            onOpen={meal => router.push(`/rett/${meal.id}`)}
          />

          <WeekSuggestions
            planned={active}
            candidates={[...myMeals, ...INSPO]}
            mine={new Set(myMeals.map(meal => String(meal.id)))}
            chain={storeChain(store)}
            storeName={store?.name ?? null}
            book={book}
            findMeal={findMeal}
            onSwap={(entryId, mealId) => updateEntry(entryId, { mealId })}
            onOpen={mealId => router.push(`/rett/${mealId}`)}
          />

          {bought.length > 0 && (
            <View style={styles.bought}>
              <View style={styles.boughtHeader}>
                <Text style={styles.boughtTitle}>Handlet ({bought.length})</Text>
                <Pressable accessibilityRole="button" onPress={clearBought} hitSlop={8}>
                  <Text style={styles.link}>Fjern handlede</Text>
                </Pressable>
              </View>
              {bought.map(({ entry, meal }) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="link"
                  accessibilityLabel={meal.name}
                  onPress={() => router.push(`/rett/${meal.id}`)}
                  style={styles.boughtRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                  <Text style={styles.boughtName}>{meal.name}</Text>
                  <Text style={styles.boughtMeta}>
                    {entry.day !== null ? DAYS[entry.day] : ''} · {entry.persons} pers
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </Page>
  );
}

function EntryCard({
  entry,
  meal,
  chain,
  book,
  onOpen,
  onDay,
  onPersons,
  onRemove,
}: {
  entry: PlanEntry;
  meal: Meal;
  chain: string | null;
  book: PriceBook;
  onOpen: () => void;
  onDay: (day: number | null) => void;
  onPersons: (persons: number) => void;
  onRemove: () => void;
}) {
  const price = mealPrice(meal, entry.persons, chain, book);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Pressable accessibilityRole="link" accessibilityLabel={meal.name} onPress={onOpen} style={styles.cardLink}>
          <View style={[styles.thumb, { backgroundColor: categoryTints[meal.category] ?? defaultTint }]}>
            <Image source={{ uri: photoFor(meal) }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardDay}>{entry.day !== null ? DAYS[entry.day] : 'Ingen dag valgt'}</Text>
            <Text style={styles.cardName} numberOfLines={2}>
              {meal.name}
            </Text>
            <Text style={styles.cardMeta}>
              {formatPrice(price)} · {Math.round(price.total / entry.persons)} kr/pers
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Fjern ${meal.name} fra uka`} onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Ionicons name="close" size={20} color={colors.inkSoft} />
        </Pressable>
      </View>
      <View style={styles.cardControls}>
        <View style={styles.days} accessibilityLabel={`Dag for ${meal.name}`}>
          {DAYS_SHORT.map((label, day) => {
            const selected = entry.day === day;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                aria-selected={selected}
                accessibilityLabel={`${DAYS[day]} for ${meal.name}`}
                onPress={() => onDay(selected ? null : day)}
                style={[styles.day, selected && styles.daySelected]}>
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Counter
          value={entry.persons}
          unit="pers"
          label={`personer til ${meal.name}`}
          onMinus={() => onPersons(entry.persons - 1)}
          onPlus={() => onPersons(entry.persons + 1)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  center: {
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  summary: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  summaryNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  summaryLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkSoft,
  },
  cheaper: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardLink: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardDay: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkSoft,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  days: {
    flexDirection: 'row',
    gap: 4,
  },
  day: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.ink,
  },
  dayText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.limeStrong,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  bought: {
    marginTop: spacing.xxl,
    backgroundColor: colors.beige,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  boughtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  boughtTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  boughtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: colors.beigeDark,
  },
  boughtName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  boughtMeta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkSoft,
  },
});

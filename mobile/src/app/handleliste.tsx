import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddItemSheet } from '@/components/AddItemSheet';
import { SwapSheet } from '@/components/SwapSheet';
import { Body, Button, Chip, Eyebrow, Page, Title } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useHistory } from '@/lib/history';
import { useMeals } from '@/lib/meals-store';
import { formatPrice, productImage, usePrices } from '@/lib/prices';
import { sizeText } from '@/lib/search';
import {
  defaultExpiry,
  fridgeMatch,
  leftovers,
  lineEans,
  listPrice,
  storeChain,
  useShopping,
  useShoppingList,
  type FridgeItem,
  type ListLine,
} from '@/lib/shopping';
import { useApp } from '@/lib/store';

// Lista er snudd opp ned i forhold til en vanlig liste: det du skal hente neste
// står alltid øverst, og det du har tatt samles nederst i «I kurven», der du
// kan legge det tilbake med ett trykk. Slik slipper du å scrolle i butikken.
export default function ShoppingListScreen() {
  const router = useRouter();
  const { stores, isOwner, ready: appReady } = useApp();
  const { findMeal, loading, memberName, deviceId } = useMeals();
  const { recordTrip } = useHistory();
  const {
    state,
    ready,
    activeEntries,
    entries,
    setChecked,
    setStore,
    putAllBack,
    skipLine,
    finishShopping,
    removeExtras,
    commit,
    addFridgeItems,
  } = useShopping();
  const [leftoversSaved, setLeftoversSaved] = useState(false);
  const { lines, stops, store } = useShoppingList();
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [swapping, setSwapping] = useState<ListLine | null>(null);
  const { book } = usePrices(lineEans(lines));

  if (!ready || !appReady || (loading && activeEntries.length > 0 && lines.length === 0)) return null;

  const addSheet = <AddItemSheet visible={adding} onClose={() => setAdding(false)} />;

  if (lines.length === 0) {
    const allBought = entries.length > 0 && activeEntries.length === 0;
    return (
      <Page maxWidth={760}>
        <View style={styles.emptyCard}>
          <Ionicons name={allBought ? 'checkmark-circle-outline' : 'basket-outline'} size={40} color={colors.ink} />
          <Eyebrow>Handleliste</Eyebrow>
          <Title size="md">{allBought ? 'Alt er handlet' : 'Ingen handleliste ennå'}</Title>
          <Body style={styles.center}>
            {allBought
              ? 'Middagene for uka er handlet. Legg til flere middager eller varer når du trenger det.'
              : 'Legg middager i uka, så samler vi alt i én liste i den rekkefølgen du går gjennom butikken.'}
          </Body>
          <View style={styles.emptyButtons}>
            <Button label="Velg middager" icon="restaurant-outline" onPress={() => router.navigate('/')} />
            <Button label="Legg til vare" icon="add" variant="outline" onPress={() => setAdding(true)} />
          </View>
        </View>
        {addSheet}
      </Page>
    );
  }

  const isDone = (key: string) => Boolean(state.checked[key] || state.skipped[key]);
  const total = lines.length;
  const done = lines.filter(line => isDone(line.key)).length;
  const allDone = done === total;
  const price = listPrice(lines, storeChain(store), book, state.skipped);

  const remaining = stops
    .map(stop => ({ ...stop, lines: stop.lines.filter(line => !isDone(line.key)) }))
    .filter(stop => stop.lines.length > 0);
  const inBasket = stops.flatMap(stop => stop.lines.filter(line => isDone(line.key)));
  const undoLine = lastChecked ? lines.find(line => line.key === lastChecked && state.checked[line.key]) : undefined;
  const fridge = Object.values(state.fridge);
  const rest = allDone ? leftovers(lines, state.skipped) : [];

  function saveLeftovers() {
    addFridgeItems(
      rest.map(item => ({
        name: item.name,
        amount: item.amount,
        expires: defaultExpiry(item.stop),
        addedBy: memberName.trim() || null,
      })),
    );
    setLeftoversSaved(true);
  }

  const meals = activeEntries
    .map(entry => ({ entry, meal: findMeal(entry.mealId) }))
    .filter((item): item is { entry: (typeof activeEntries)[number]; meal: NonNullable<ReturnType<typeof findMeal>> } => Boolean(item.meal));
  const extraCount = Object.keys(state.extras).length;
  const title =
    meals.length === 1 ? meals[0].meal.name : meals.length > 1 ? `${meals.length} middager` : 'Egne varer';
  const summary = [
    ...meals.map(({ entry, meal }) => `${meal.name} (${entry.persons})`),
    ...(extraCount ? [`${extraCount} egne ${extraCount === 1 ? 'vare' : 'varer'}`] : []),
  ].join(' · ');

  function check(key: string) {
    setChecked(key, true);
    setLastChecked(key);
    // Første avhuking betyr at du er i butikken. Samboer får se det og kan legge til varer.
    const shopper = state.meta.shopper;
    if (!shopper || shopper.deviceId !== deviceId || Date.now() - shopper.since > 3 * 3600000) {
      commit({ meta: { shopper: { name: memberName.trim() || 'Noen', since: Date.now(), deviceId } } });
    }
  }

  function putBack(line: ListLine) {
    if (state.skipped[line.key]) skipLine(line.key, false);
    else setChecked(line.key, false);
    setLastChecked(null);
  }

  function finish() {
    recordTrip({
      storeId: store?.id ?? '',
      storeName: store?.name ?? '',
      total: price.total,
      exact: price.exact,
      meals: meals.map(({ entry, meal }) => ({ mealId: meal.id, name: meal.name, persons: entry.persons })),
      items: lines.map(line => ({
        name: line.name,
        amount: line.amount,
        ean: line.product?.ean ?? null,
        skipped: Boolean(state.skipped[line.key]),
      })),
      by: memberName.trim() || null,
    });
    finishShopping();
    router.navigate('/uka');
  }

  return (
    <View style={styles.screen}>
      <Page maxWidth={760}>
        <View style={styles.header}>
          <Text style={styles.eyebrowLine} numberOfLines={1}>
            Handleliste · {store?.name}
          </Text>
          <View style={styles.titleRow}>
            <Title size="sm" style={styles.title}>
              {title}
            </Title>
            <Text style={styles.price}>{formatPrice(price)}</Text>
          </View>
          {meals.length + (extraCount ? 1 : 0) > 1 && (
            <Text style={styles.summary} numberOfLines={2}>
              {summary}
            </Text>
          )}
          <View style={styles.progressRow}>
            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: total, now: done }}>
              <View style={[styles.progressFill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {done} av {total} i kurven
            </Text>
          </View>
        </View>

        {undoLine && (
          <View style={styles.undoBar}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={styles.undoText} numberOfLines={1}>
              {undoLine.name} er i kurven
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Angre ${undoLine.name}`}
              onPress={() => putBack(undoLine)}
              hitSlop={8}>
              <Text style={styles.undoAction}>Angre</Text>
            </Pressable>
          </View>
        )}

        {allDone && (
          <View style={styles.doneCard}>
            <Title size="md">Alt er i kurven</Title>
            <Body>God middag! Trykk ferdig, så blir middagene stående som handlet i uka.</Body>
            {rest.length > 0 && (
              <View style={styles.leftovers}>
                <Text style={styles.leftoversTitle}>Til overs etter middagene</Text>
                <Text style={styles.leftoversText}>{rest.map(item => `${item.amount} ${item.name.toLowerCase()}`).join(', ')}</Text>
                {leftoversSaved ? (
                  <Text style={styles.leftoversDone}>Lagt i kjøleskapet ✓</Text>
                ) : (
                  <Button label="Legg restene i kjøleskapet" icon="snow-outline" variant="secondary" onPress={saveLeftovers} style={styles.doneButton} />
                )}
              </View>
            )}
            <Button label="Ferdig handlet" icon="checkmark" onPress={finish} style={styles.doneButton} />
          </View>
        )}

        <View style={styles.stops}>
          {remaining.map((stop, position) => {
            const isNext = position === 0;
            return (
              <View key={stop.stop} style={[styles.stop, isNext && styles.stopNext]}>
                <View style={styles.stopHeader}>
                  <Text style={[styles.stopLabel, !isNext && styles.stopLabelLater]}>{stop.label}</Text>
                  {isNext ? (
                    <View style={styles.nextPill}>
                      <Text style={styles.nextPillText}>Neste</Text>
                    </View>
                  ) : (
                    <Text style={styles.stopCount}>{stop.lines.length} igjen</Text>
                  )}
                </View>
                {stop.lines.map(line => (
                  <LineRow
                    key={line.key}
                    line={line}
                    atHome={fridgeMatch(line.originalName, fridge)}
                    isNext={isNext}
                    showSources={meals.length > 1}
                    onCheck={() => check(line.key)}
                    onSwap={() => setSwapping(line)}
                    onRemove={line.mealCount === 0 ? () => removeExtras(line.extraIds) : undefined}
                  />
                ))}
              </View>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.addRow}>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={18} color={colors.inkSoft} />
          </View>
          <Text style={styles.addRowText}>Legg til vare …</Text>
        </Pressable>

        {inBasket.length > 0 && (
          <View style={styles.basket}>
            <View style={styles.basketHeader}>
              <Text style={styles.basketTitle}>I kurven ({inBasket.length})</Text>
              <Pressable accessibilityRole="button" onPress={putAllBack} hitSlop={8}>
                <Text style={styles.basketAction}>Legg alt tilbake</Text>
              </Pressable>
            </View>
            <Text style={styles.basketHint}>Trykk på en vare for å legge den tilbake</Text>
            {inBasket.map(line => {
              const skipped = Boolean(state.skipped[line.key]);
              return (
                <Pressable
                  key={line.key}
                  accessibilityRole="checkbox"
                  aria-checked
                  accessibilityLabel={line.name}
                  onPress={() => putBack(line)}
                  style={styles.basketItem}>
                  <View style={[styles.checkbox, styles.checkboxChecked, skipped && styles.checkboxSkipped]}>
                    <Ionicons name={skipped ? 'close' : 'checkmark'} size={16} color={skipped ? colors.bg : colors.limeStrong} />
                  </View>
                  <Text style={styles.basketName} numberOfLines={1}>
                    {line.name}
                    {skipped ? ' – hoppet over' : ''}
                  </Text>
                  <Text style={styles.basketAmount}>{line.amount}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Eyebrow>Butikk</Eyebrow>
          <View style={styles.storeChips}>
            {stores.map(s => (
              <Chip key={s.id} label={s.name} selected={s.id === store?.id} onPress={() => setStore(s.id)} />
            ))}
          </View>
          {isOwner && store && (
            <Pressable accessibilityRole="link" onPress={() => router.push(`/butikker/${store.id}`)} style={styles.footerLink}>
              <Ionicons name="swap-vertical" size={16} color={colors.green} />
              <Text style={styles.footerLinkText}>Stemmer ikke rekkefølgen? Endre den for {store.name}</Text>
            </Pressable>
          )}
          <View style={styles.footerButtons}>
            <Button label="Til ukeplanen" icon="calendar-outline" variant="outline" onPress={() => router.navigate('/uka')} />
          </View>
        </View>
      </Page>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Legg til vare"
        onPress={() => setAdding(true)}
        style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.ink} />
      </Pressable>

      {addSheet}
      <SwapSheet line={swapping} onClose={() => setSwapping(null)} />
    </View>
  );
}

function LineRow({
  line,
  atHome,
  isNext,
  showSources,
  onCheck,
  onSwap,
  onRemove,
}: {
  line: ListLine;
  atHome?: FridgeItem;
  isNext: boolean;
  showSources: boolean;
  onCheck: () => void;
  onSwap: () => void;
  onRemove?: () => void;
}) {
  // Er en bestemt vare valgt, vises varenavnet (f.eks. «Pizzasaus 200g Petti»),
  // så du finner riktig merke i hylla. Ellers bare pakkestørrelsen.
  const size = line.product
    ? line.product.name && line.product.name !== line.name
      ? line.product.name
      : sizeText(line.product.packSize, line.product.packUnit)
    : null;
  const image = line.product?.image ?? productImage(line.product?.ean);
  const hint = line.swapped
    ? `I stedet for ${line.originalName}`
    : atHome
      ? `Du har ${atHome.amount ? `${atHome.amount} ` : ''}hjemme`
      : line.pantry
      ? 'Sjekk om du har hjemme'
      : [size, showSources || line.mealCount === 0 ? line.sources.join(' + ') : null].filter(Boolean).join(' · ');

  return (
    <View style={[styles.item, !isNext && styles.itemLater]}>
      <Pressable
        accessibilityRole="checkbox"
        aria-checked={false}
        accessibilityLabel={line.name}
        onPress={onCheck}
        style={styles.itemMain}>
        <View style={[styles.checkbox, !isNext && styles.checkboxLater]} />
        {image ? (
          <View style={styles.itemImage}>
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="contain" />
          </View>
        ) : null}
        <View style={styles.itemText}>
          <Text style={[styles.itemName, !isNext && styles.itemNameLater]}>{line.name}</Text>
          {hint ? (
            <Text style={styles.itemHint} numberOfLines={1}>
              {hint}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.itemAmount, !isNext && styles.itemAmountLater]}>{line.amount}</Text>
      </Pressable>
      {onRemove ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Fjern ${line.name}`} onPress={onRemove} hitSlop={8} style={styles.itemAction}>
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={`Bytt ${line.name}`} onPress={onSwap} hitSlop={8} style={styles.itemAction}>
          <Ionicons name="swap-horizontal" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  emptyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  eyebrowLine: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
  },
  price: {
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    color: colors.ink,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.beige,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.round,
    backgroundColor: colors.ink,
  },
  progressText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkSoft,
  },
  undoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.beige,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    marginBottom: spacing.md,
  },
  undoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
  },
  undoAction: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  doneCard: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  leftovers: {
    marginTop: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  leftoversTitle: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  leftoversText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  leftoversDone: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.green,
  },
  doneButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  stops: {
    gap: spacing.md,
  },
  stop: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  stopNext: {
    backgroundColor: colors.lime,
    borderColor: colors.limeStrong,
    paddingTop: spacing.lg,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  stopLabel: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  stopLabelLater: {
    fontSize: 20,
  },
  stopCount: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.muted,
  },
  nextPill: {
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  nextPillText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.limeStrong,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: colors.limeStrong,
  },
  itemLater: {
    minHeight: 52,
    borderTopColor: colors.line,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  itemAction: {
    width: 36,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxLater: {
    width: 26,
    height: 26,
    borderColor: colors.inkSoft,
  },
  checkboxChecked: {
    width: 26,
    height: 26,
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  checkboxSkipped: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  itemText: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  itemName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.ink,
  },
  itemNameLater: {
    fontSize: 16,
  },
  itemHint: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  itemAmount: {
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    color: colors.ink,
  },
  itemAmountLater: {
    fontSize: 14,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  addCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkSoft,
  },
  basket: {
    marginTop: spacing.xl,
    backgroundColor: colors.beige,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  basketHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  basketTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  basketAction: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  basketHint: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  basketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.beigeDark,
  },
  basketName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  basketAmount: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  footer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  storeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  footerLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.green,
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});

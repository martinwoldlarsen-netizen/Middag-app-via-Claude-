import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/Sheet';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useMeals } from '@/lib/meals-store';
import { formatPrice, mealEans, usePrices } from '@/lib/prices';
import { buildLines, listPrice, storeChain, useShopping } from '@/lib/shopping';
import { useApp } from '@/lib/store';

// Rask handling fra forsiden: trykk + på middagene du vil ha, velg butikk, og få
// én liste der like varer er slått sammen (to pinsaer = én linje med pinsabunner).
export function QuickShopBar() {
  const router = useRouter();
  const { stores } = useApp();
  const { findMeal } = useMeals();
  const { activeEntries, removeEntry, setStore, state } = useShopping();
  const [open, setOpen] = useState(false);

  const chosen = activeEntries
    .map(entry => ({ entry, meal: findMeal(entry.mealId) }))
    .filter((item): item is { entry: typeof item.entry; meal: NonNullable<typeof item.meal> } => Boolean(item.meal));
  const { book } = usePrices(mealEans(chosen.map(item => item.meal)));

  if (chosen.length === 0) return null;
  const count = chosen.length;
  const label = count === 1 ? '1 middag valgt' : `${count} middager valgt`;

  const options = stores
    .map(store => {
      const chain = storeChain(store);
      const lines = buildLines(state, findMeal, chain);
      return { store, lines: lines.length, price: listPrice(lines, chain, book) };
    })
    .sort((a, b) => a.price.total - b.price.total);

  const go = (storeId: string) => {
    setStore(storeId);
    setOpen(false);
    router.push('/handleliste');
  };

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.barText}>
          <Text style={styles.barTitle}>{label}</Text>
          <Text style={styles.barSub} numberOfLines={1}>
            {chosen.map(item => item.meal.name).join(' · ')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Velg butikk for ${label}`}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.barButton, pressed && { opacity: 0.85 }]}>
          <Text style={styles.barButtonText}>Velg butikk</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow="Handle nå" title={label}>
        <View style={styles.meals}>
          {chosen.map(({ entry, meal }) => (
            <View key={entry.id} style={styles.mealRow}>
              <Text style={styles.mealName} numberOfLines={1}>
                {meal.name}
              </Text>
              <Text style={styles.mealMeta}>{entry.persons} pers</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ta ut ${meal.name}`}
                onPress={() => {
                  if (count === 1) setOpen(false);
                  removeEntry(entry.id);
                }}
                hitSlop={8}
                style={styles.remove}>
                <Ionicons name="close" size={18} color={colors.inkSoft} />
              </Pressable>
            </View>
          ))}
        </View>
        {count > 1 && (
          <View style={styles.merged}>
            <Ionicons name="git-merge-outline" size={18} color={colors.green} />
            <Text style={styles.mergedText}>Like varer slås sammen til én linje, så du bare kjøper det du trenger.</Text>
          </View>
        )}
        <Text style={styles.heading}>Hvilken butikk er du i?</Text>
        {options.map(({ store, lines, price }, index) => (
          <Pressable
            key={store.id}
            accessibilityRole="button"
            accessibilityLabel={`Handle på ${store.name}`}
            onPress={() => go(store.id)}
            style={({ pressed }) => [styles.store, pressed && { opacity: 0.85 }]}>
            <View style={styles.storeText}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeMeta}>
                {lines} varer · {formatPrice(price)}
              </Text>
            </View>
            {index === 0 && options.length > 1 && price.total < options[1].price.total && (
              <View style={styles.cheapest}>
                <Text style={styles.cheapestText}>Billigst</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    alignSelf: 'center',
    maxWidth: 640,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  barText: { flex: 1, minWidth: 0 },
  barTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.bg },
  barSub: { fontFamily: fonts.body, fontSize: 12, color: colors.limeStrong },
  barButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
  },
  barButtonText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  meals: { gap: spacing.xs, marginBottom: spacing.md },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  mealName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  mealMeta: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  remove: { padding: spacing.xs },
  merged: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.lime,
    marginBottom: spacing.md,
  },
  mergedText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  heading: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  store: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.beige,
    marginBottom: spacing.sm,
  },
  storeText: { flex: 1 },
  storeName: { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.ink },
  storeMeta: { fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  cheapest: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.round, backgroundColor: colors.limeStrong },
  cheapestText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
});

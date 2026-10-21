import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NutritionCard } from '@/components/NutritionCard';
import { BackLink, Body, Button, Eyebrow, Meta, Page, PersonStepper, Title } from '@/components/ui';
import { categoryTints, colors, defaultTint, fonts, radius, spacing } from '@/constants/theme';
import { INSPO } from '@/data/inspo';
import type { Ingredient } from '@/data/meals';
import type { Store } from '@/data/stores';
import { useLayout } from '@/lib/layout';
import { displayAmount, mealBase } from '@/lib/meals';
import { useMeals } from '@/lib/meals-store';
import { chainFor, formatPrice, isPantry, mealEans, mealPrice, pricesByStore, stalePriceNote, usePrices } from '@/lib/prices';
import { photoFor } from '@/lib/photos';
import { useShopping } from '@/lib/shopping';
import { useApp } from '@/lib/store';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { persons: defaultPersons, setPersons: setDefaultPersons, stores, ready } = useApp();
  const { findMeal, deleteMeal, meals: myMeals } = useMeals();
  const { entryFor, addMeal, removeEntry, updateEntry, setStore } = useShopping();
  const { width } = useLayout();
  const twoColumns = width >= 900;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const meal = findMeal(id);
  const { book } = usePrices(meal ? mealEans([meal]) : []);

  if (!meal) {
    return (
      <Page maxWidth={720}>
        <BackLink label="Alle middager" href="/" />
        <Title size="md" style={{ marginTop: spacing.lg }}>Fant ikke retten</Title>
        <Body style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>Den kan ha blitt fjernet fra lista.</Body>
        <Button label="Til middagene" onPress={() => router.replace('/')} style={{ alignSelf: 'flex-start' }} />
      </Page>
    );
  }

  // Står middagen i uka, gjelder personene der. Ellers brukes standardvalget.
  const entry = entryFor(meal.id);
  const persons = entry?.persons ?? defaultPersons;
  const setPersons = (next: number) => (entry ? updateEntry(entry.id, { persons: next }) : setDefaultPersons(next));

  // «Står i butikken nå»: legg middagen i uka og gå rett til handlelista.
  function startShopping(storeId: string) {
    if (!meal) return;
    addMeal(meal.id, persons);
    setStore(storeId);
    router.navigate('/handleliste');
  }

  async function remove() {
    if (!meal) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteMeal(String(meal.id));
      router.replace('/');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Kunne ikke slette');
    }
  }

  const base = mealBase(meal);
  const isInspo = INSPO.some(item => item.id === meal.id);
  const myVersion = isInspo ? myMeals.find(item => item.custom && item.basedOn === meal.id) : undefined;
  const cook = () => router.push(`/lag/${meal.id}`);
  const storePrices = pricesByStore(meal, persons, stores, book);
  const best = storePrices[0];
  const showCheapest = storePrices.length > 1 && storePrices[storePrices.length - 1].price.total - best.price.total >= 5;
  const toBuy = best?.price.toBuy ?? 0;
  const perPortion = best ? Math.round(best.price.total / persons) : 0;

  // Pakkene kommer hele, så noen ganger blir det billigere per porsjon å lage mer.
  let portionTip: string | null = null;
  // Bare når minst én vare har ekte pris, ellers bygger tipset på gjetninger.
  if (best && best.price.total > 0 && best.price.priced > 0) {
    const chain = chainFor(best.store);
    let cheapest = { persons, perPortion: best.price.total / persons };
    for (let count = 1; count <= 8; count++) {
      const total = mealPrice(meal, count, chain, book).total;
      if (total / count < cheapest.perPortion - 0.5) cheapest = { persons: count, perPortion: total / count };
    }
    const saving = perPortion - Math.round(cheapest.perPortion);
    if (cheapest.persons !== persons && saving >= 3) {
      portionTip = `Lager du for ${cheapest.persons}, blir det ${Math.round(cheapest.perPortion)} kr per porsjon i stedet for ${perPortion} kr${
        cheapest.persons > persons ? ' – resten kan bli lunsj.' : '.'
      }`;
    }
  }
  const priced = Math.max(0, ...storePrices.map(entry => entry.price.priced));

  const image = (
    <View
      style={[
        styles.image,
        { backgroundColor: categoryTints[meal.category] ?? defaultTint },
        width >= 600 && !twoColumns && { aspectRatio: 16 / 9 },
        twoColumns && styles.imageWide,
      ]}>
      <Image source={{ uri: photoFor(meal) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={meal.name} />
    </View>
  );

  const info = (
    <View style={[styles.infoCard, twoColumns && styles.infoCardWide]}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{meal.category}</Text>
      </View>
      <Title size="lg">{meal.name}</Title>
      <View style={styles.metaRow}>
        {meal.timeMinutes > 0 && (
          <View style={styles.metaChip}>
            <Meta icon="time-outline">{meal.timeMinutes} min</Meta>
          </View>
        )}
        {best && (
          <View style={styles.metaChip}>
            <Meta icon="wallet-outline">{formatPrice(best.price)}</Meta>
          </View>
        )}
        {best && (
          <View style={styles.metaChip}>
            <Meta icon="person-outline">{perPortion} kr per porsjon</Meta>
          </View>
        )}
      </View>
      {portionTip && (
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={16} color={colors.ink} />
          <Text style={styles.tipText}>{portionTip}</Text>
        </View>
      )}
      {meal.description ? <Body>{meal.description}</Body> : null}
      <View style={styles.personRow}>
        <PersonStepper value={persons} onChange={setPersons} />
        {entry ? (
          <Button label="I uka" icon="checkmark" variant="secondary" onPress={() => removeEntry(entry.id)} accessibilityLabel={`Fjern ${meal.name} fra uka`} />
        ) : (
          <Button label="Legg i uka" icon="calendar-outline" variant="primary" onPress={() => addMeal(meal.id, persons)} />
        )}
      </View>

      <View style={styles.shopSection}>
        <Eyebrow>Handle nå i</Eyebrow>
        <View style={styles.storeTiles}>
          {ready &&
            stores.map(store => {
              const entry = storePrices.find(item => item.store.id === store.id);
              const cheapest = showCheapest && entry === best;
              return (
                <Pressable
                  key={store.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Lag handleliste i ${store.name}`}
                  onPress={() => startShopping(store.id)}
                  style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => [
                    styles.storeTile,
                    (hovered || pressed) && styles.storeTileActive,
                  ]}>
                  <Ionicons name="storefront-outline" size={20} color={colors.ink} />
                  <View style={styles.storeTileName}>
                    <Text style={styles.storeTileText}>{store.name}</Text>
                    {cheapest && <Text style={styles.cheapest}>Billigst</Text>}
                  </View>
                  {entry && <Text style={styles.storeTilePrice}>{formatPrice(entry.price)}</Text>}
                  <Ionicons name="arrow-forward" size={16} color={colors.ink} />
                </Pressable>
              );
            })}
        </View>
        <Text style={styles.priceNote}>
          {priced > 0 && priced === toBuy
            ? 'Dagens priser fra butikkene, regnet i hele pakker.'
            : priced > 0
              ? `${priced} av ${toBuy} varer har dagens pris, resten er anslått.`
              : meal.ingredients.some(ingredient => ingredient.product)
              ? 'Regnet i hele pakker ut fra siste kjente priser, så det er et anslag.'
              : 'Prisene er anslag. De blir ekte når varene er koblet til butikkenes priser.'}
          {meal.ingredients.some(isPantry) ? ' Det du har hjemme er ikke med.' : ''}
          {stalePriceNote([meal], stores) ? ` ${stalePriceNote([meal], stores)}` : ''}
        </Text>
      </View>

      <View style={styles.ownActions}>
        {meal.steps.length > 0 && <Button label="Lag mat" icon="flame-outline" variant="outline" onPress={cook} />}
        {isInspo ? (
          myVersion ? (
            <Button label="Åpne din versjon" icon="bookmark" variant="secondary" onPress={() => router.push(`/rett/${myVersion.id}`)} />
          ) : (
            <Button
              label="Legg til i mine middager"
              icon="bookmark-outline"
              variant="outline"
              onPress={() => router.push({ pathname: '/ny-middag', params: { fra: String(meal.id) } })}
            />
          )
        ) : meal.custom ? (
          <>
            <Button
              label="Endre"
              icon="create-outline"
              variant="outline"
              onPress={() => router.push({ pathname: '/ny-middag', params: { id: String(meal.id) } })}
            />
            <Button
              label={confirmDelete ? 'Trykk igjen for å slette' : 'Slett'}
              icon="trash-outline"
              variant="secondary"
              onPress={remove}
            />
          </>
        ) : (
          <Button
            label="Lag din versjon"
            icon="create-outline"
            variant="outline"
            onPress={() => router.push({ pathname: '/ny-middag', params: { fra: String(meal.id) } })}
          />
        )}
      </View>
      {deleteError && <Text style={styles.error}>{deleteError}</Text>}
    </View>
  );

  const ingredients = (
    <View style={[styles.ingredientsCard, twoColumns && styles.ingredientsWide]}>
      <Title size="md">Ingredienser</Title>
      <Text style={styles.forPersons}>
        for {persons} {persons === 1 ? 'person' : 'personer'}
      </Text>
      <View style={styles.ingredientList}>
        {meal.ingredients.map((ingredient, index) => (
          <View key={`${ingredient.name}-${index}`} style={[styles.ingredientRow, index > 0 && styles.divider]}>
            <Text style={styles.ingredientAmount}>{displayAmount(ingredient, persons, base)}</Text>
            <View style={styles.ingredientText}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              {productLines(ingredient, stores).map(line => (
                <Text key={line} style={styles.ingredientProduct}>
                  {line}
                </Text>
              ))}
              {isPantry(ingredient) && <Text style={styles.ingredientProduct}>Har du hjemme?</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const steps = meal.steps.length === 0 ? (
    <View style={styles.steps} />
  ) : (
    <View style={styles.steps}>
      <View style={styles.stepsHeader}>
        <Title size="md">Slik gjør du</Title>
        <Button label="Lag mat" icon="flame-outline" variant="lime" onPress={cook} accessibilityLabel="Start kokemodus" />
      </View>
      {meal.steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Body style={styles.stepText}>{step}</Body>
        </View>
      ))}
    </View>
  );

  const nutrition = <NutritionCard meal={meal} />;

  return (
    <Page>
      <BackLink label="Alle middager" href="/" />
      {twoColumns ? (
        <>
          <View style={styles.row}>
            {info}
            {image}
          </View>
          <View style={[styles.row, styles.rowTop]}>
            <View style={styles.sideColumn}>
              {ingredients}
              {nutrition}
            </View>
            {steps}
          </View>
        </>
      ) : (
        <View style={styles.stack}>
          {image}
          {info}
          {ingredients}
          {steps}
          {nutrition}
        </View>
      )}
    </Page>
  );
}

// Hvilken vare som kjøpes hvor. Har ingrediensen egen vare i noen butikker,
// vises butikknavnet foran, f.eks. «Rema 1000: Pizzasaus 200g Petti».
function productLines(ingredient: Ingredient, stores: Store[]): string[] {
  const product = ingredient.product;
  const overrides = ingredient.storeProducts ?? {};
  if (!Object.keys(overrides).length) {
    return product && product.name !== ingredient.name ? [product.name] : [];
  }
  const lines: string[] = [];
  const usesDefault = stores.filter(store => !overrides[chainFor(store) ?? '']).map(store => store.name);
  if (product && usesDefault.length) lines.push(`${usesDefault.join(', ')}: ${product.name}`);
  const byProduct = new Map<string, string[]>();
  for (const store of stores) {
    const other = overrides[chainFor(store) ?? ''];
    if (other) byProduct.set(other.name, [...(byProduct.get(other.name) ?? []), store.name]);
  }
  for (const [name, storeNames] of byProduct) lines.push(`${storeNames.join(', ')}: ${name}`);
  return lines;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.lg,
    alignItems: 'stretch',
  },
  rowTop: {
    alignItems: 'flex-start',
    marginTop: spacing.xxxl,
  },
  stack: {
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  image: {
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  imageWide: {
    flex: 1.15,
    aspectRatio: undefined,
    minHeight: 440,
  },
  infoCard: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  infoCardWide: {
    flex: 1,
    padding: spacing.xxl,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.limeStrong,
    borderRadius: radius.round,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  tagText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.limeStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  personRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  shopSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.limeStrong,
  },
  storeTiles: {
    gap: spacing.sm,
  },
  storeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  storeTileActive: {
    borderColor: colors.ink,
  },
  storeTileName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  storeTileText: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  cheapest: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink,
    backgroundColor: colors.limeStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  storeTilePrice: {
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    color: colors.ink,
  },
  priceNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  ownActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.danger,
  },
  ingredientsCard: {
    backgroundColor: colors.beige,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  ingredientsWide: {
    padding: spacing.xxl,
  },
  sideColumn: {
    width: 380,
    gap: spacing.xl,
  },
  stepsHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  forPersons: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  ingredientList: {
    borderTopWidth: 1,
    borderTopColor: colors.beigeDark,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.beigeDark,
  },
  ingredientAmount: {
    width: 88,
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
  },
  ingredientText: {
    flex: 1,
  },
  ingredientProduct: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  ingredientName: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  steps: {
    flex: 1,
    gap: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  stepText: {
    flex: 1,
    paddingTop: 5,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { InstallCard } from '@/components/InstallCard';
import { Slider } from '@/components/Slider';
import { Body, Button, Chip, Eyebrow, Meta, Page, PersonStepper, Title } from '@/components/ui';
import { categoryTints, colors, defaultTint, fonts, radius, spacing } from '@/constants/theme';
import { INSPO } from '@/data/inspo';
import type { Meal } from '@/data/meals';
import { daysAgo, useHistory } from '@/lib/history';
import { useLayout } from '@/lib/layout';
import { useMeals } from '@/lib/meals-store';
import { mealNutrition } from '@/lib/nutrition';
import { formatPrice, mealEans, pricesByStore, usePrices, type StorePrice } from '@/lib/prices';
import { expiryText, saveMeals, useShopping } from '@/lib/shopping';
import { photoFor } from '@/lib/photos';
import { useApp } from '@/lib/store';

type SortKey = 'forslag' | 'raskest' | 'billigst' | 'protein' | 'lengst';
type Library = 'mine' | 'inspo';
// Rutenett og liste viser mange middager på skjermen, store bilder er for å se.
type CardView = 'rutenett' | 'liste' | 'store';

const VIEW_KEY = 'handleklar.mealView';
const VIEWS: { key: CardView; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'rutenett', icon: 'grid-outline', label: 'Vis som rutenett' },
  { key: 'liste', icon: 'list-outline', label: 'Vis som liste' },
  { key: 'store', icon: 'image-outline', label: 'Vis store bilder' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'forslag', label: 'Forslag' },
  { key: 'raskest', label: 'Raskest' },
  { key: 'billigst', label: 'Billigst' },
  { key: 'protein', label: 'Mest protein' },
  { key: 'lengst', label: 'Lengst siden' },
];

// Øverst på skalaen betyr «alle».
const TIME_MAX = 90;
const PRICE_MAX = 150;

export default function MealListScreen() {
  const router = useRouter();
  const { persons, setPersons, stores } = useApp();
  const { entryFor, addMeal, removeEntry, state } = useShopping();
  const { meals: myMeals } = useMeals();
  const [library, setLibrary] = useState<Library>('mine');
  const inspo = library === 'inspo';
  const allMeals = inspo ? INSPO : myMeals;
  // Inspo-retter du har lagret som dine egne, merkes «I mine».
  const saved = useMemo(() => new Set(myMeals.map(meal => meal.basedOn).filter(id => id !== undefined)), [myMeals]);
  const { contentWidth, columns, wide, width } = useLayout();
  const [view, setViewState] = useState<CardView>('rutenett');
  useEffect(() => {
    AsyncStorage.getItem(VIEW_KEY)
      .then(saved => {
        if (saved === 'rutenett' || saved === 'liste' || saved === 'store') setViewState(saved);
      })
      .catch(() => {});
  }, []);
  const setView = (next: CardView) => {
    setViewState(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {});
  };
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('forslag');
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxTime, setMaxTime] = useState(TIME_MAX);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const { book } = usePrices(mealEans(allMeals));
  const { lastEaten } = useHistory();

  // Pris i den billigste butikken, pris per porsjon og når middagen sist ble handlet.
  const enriched = useMemo(
    () =>
      allMeals.map((meal, order) => {
        const best = pricesByStore(meal, persons, stores, book)[0];
        return {
          meal,
          order,
          best,
          perPerson: best ? Math.round(best.price.total / persons) : 0,
          protein: mealNutrition(meal).protein,
          eatenAt: lastEaten(meal.id),
        };
      }),
    [allMeals, persons, stores, book, lastEaten],
  );

  const meals = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = enriched.filter(({ meal, perPerson }) => {
      if (maxTime < TIME_MAX && meal.timeMinutes > maxTime) return false;
      if (maxPrice < PRICE_MAX && perPerson > maxPrice) return false;
      if (!needle) return true;
      return (
        meal.name.toLowerCase().includes(needle) ||
        meal.category.toLowerCase().includes(needle) ||
        meal.tags.some(tag => tag.toLowerCase().includes(needle)) ||
        meal.ingredients.some(ing => ing.name.toLowerCase().includes(needle))
      );
    });
    const recent = (eatenAt: number | null) => (eatenAt && Date.now() - eatenAt < 6 * 86400000 ? 1 : 0);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'raskest':
          return (a.meal.timeMinutes || 999) - (b.meal.timeMinutes || 999);
        case 'billigst':
          return a.perPerson - b.perPerson;
        case 'protein':
          return b.protein - a.protein || a.order - b.order;
        case 'lengst':
          return (a.eatenAt ?? 0) - (b.eatenAt ?? 0) || a.order - b.order;
        default:
          // Forslag: det dere har spist den siste uka havner nederst.
          return recent(a.eatenAt) - recent(b.eatenAt) || a.order - b.order;
      }
    });
  }, [query, enriched, sort, maxTime, maxPrice]);

  const activeFilters = (maxTime < TIME_MAX ? 1 : 0) + (maxPrice < PRICE_MAX ? 1 : 0);
  // Går noe i kjøleskapet ut snart, foreslår vi en middag som bruker det opp.
  const saver = saveMeals(myMeals, Object.values(state.fridge)).find(item => item.soonest !== null && item.soonest <= 3);
  const saverItem = saver?.uses.reduce((a, b) => ((a.expires ?? '9') <= (b.expires ?? '9') ? a : b));

  // Rutenett: to i bredden på telefon og flere på større skjermer. Liste: én
  // kolonne på telefon, to på PC. Store bilder: som før.
  const viewColumns = view === 'rutenett' ? columns + 1 : view === 'liste' ? (width >= 900 ? 2 : 1) : columns;
  const gap = view === 'store' ? (wide ? spacing.xl : spacing.lg) : view === 'liste' ? spacing.xl : wide ? spacing.lg : spacing.md;
  const cardWidth = Math.floor((contentWidth - gap * (viewColumns - 1)) / viewColumns);
  // Lista er tette rader med strek mellom, uten luft over og under.
  const gridGap = view === 'liste' ? { columnGap: gap, rowGap: 0 } : { gap };

  return (
    <Page background={inspo ? colors.bgCool : colors.bg}>
      <InstallCard dismissible style={styles.install} />
      <View style={styles.topRow}>
        <View style={styles.library}>
          {(
            [
              { key: 'mine', label: 'Mine middager' },
              { key: 'inspo', label: 'Inspo' },
            ] as const
          ).map(option => (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              aria-selected={library === option.key}
              onPress={() => setLibrary(option.key)}
              style={[styles.libraryOption, library === option.key && styles.libraryOptionOn]}>
              <Text style={[styles.libraryText, library === option.key && styles.libraryTextOn]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.views}>
          {VIEWS.map(option => (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              aria-selected={view === option.key}
              onPress={() => setView(option.key)}
              hitSlop={4}
              style={[styles.viewOption, view === option.key && styles.viewOptionOn]}>
              <Ionicons name={option.icon} size={18} color={view === option.key ? colors.bg : colors.ink} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={[styles.hero, wide ? styles.heroWide : styles.heroNarrow]}>
        <View style={styles.heroText}>
          {/* På telefon holder vi toppen kort, så middagene synes med en gang. */}
          {wide && <Eyebrow>{inspo ? `Inspo · ${INSPO.length} nye retter` : 'Deres faste middager'}</Eyebrow>}
          <Title size={wide ? 'xl' : 'lg'}>{inspo ? 'Noe nytt å prøve?' : 'Hva blir det til middag?'}</Title>
          {wide && (
            <Body style={styles.heroBody}>
              {inspo
                ? 'Norske hverdagsmiddager og Oda-retter. Trykk + for å prøve én i uka, eller åpne den og legg den til i dine middager.'
                : 'Trykk + for å legge middager i uka, eller velg én og handle med en gang. Lista følger alltid butikkens rute.'}
            </Body>
          )}
        </View>
        <View style={[styles.controls, wide && styles.controlsWide]}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.inkSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={inspo ? 'Søk i Inspo' : 'Søk i middagene'}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
              accessibilityLabel="Søk i middagene"
            />
            {query.length > 0 && (
              <Pressable accessibilityLabel="Tøm søket" onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <View style={styles.controlRow}>
            <PersonStepper value={persons} onChange={setPersons} />
            <Button
              label="Ny middag"
              icon="add"
              variant="lime"
              onPress={() => router.push('/ny-middag')}
              style={!wide && styles.newButtonNarrow}
            />
          </View>
        </View>
      </View>

      {/* På telefon ligger sorteringen på én linje som kan sveipes sidelengs. */}
      <ScrollView
        horizontal={!wide}
        scrollEnabled={!wide}
        showsHorizontalScrollIndicator={false}
        style={[styles.sortScroll, !wide && styles.sortScrollNarrow]}
        contentContainerStyle={[styles.sortRow, !wide && styles.sortRowNarrow]}>
        <Pressable
          accessibilityRole="button"
          aria-expanded={filterOpen}
          onPress={() => setFilterOpen(open => !open)}
          style={[styles.filterButton, (filterOpen || activeFilters > 0) && styles.filterButtonOn]}>
          <Ionicons name="options-outline" size={16} color={colors.ink} />
          <Text style={styles.filterButtonText}>Filter{activeFilters ? ` (${activeFilters})` : ''}</Text>
        </Pressable>
        {SORTS.map(option => (
          <Chip key={option.key} label={option.label} selected={sort === option.key} onPress={() => setSort(option.key)} />
        ))}
      </ScrollView>

      {!inspo && saver && saverItem && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Sparemiddag: ${saver.meal.name}`}
          onPress={() => router.push(`/rett/${saver.meal.id}`)}
          style={styles.saver}>
          <Ionicons name="leaf-outline" size={22} color={colors.ink} />
          <View style={styles.saverText}>
            <Text style={styles.saverTitle}>Sparemiddag: {saver.meal.name}</Text>
            <Text style={styles.saverBody}>
              Bruker opp {saverItem.name.toLowerCase()}, som {expiryText(saverItem.expires)}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
      )}

      {filterOpen && (
        <View style={[styles.filterPanel, wide && styles.filterPanelWide]}>
          <View style={styles.filterSlider}>
            <Slider
              label="Maks tid"
              value={maxTime}
              min={15}
              max={TIME_MAX}
              step={5}
              format={value => (value >= TIME_MAX ? 'Alle' : `${value} min`)}
              onChange={setMaxTime}
            />
          </View>
          <View style={styles.filterSlider}>
            <Slider
              label="Maks pris per person"
              value={maxPrice}
              min={20}
              max={PRICE_MAX}
              step={5}
              format={value => (value >= PRICE_MAX ? 'Alle' : `${value} kr`)}
              onChange={setMaxPrice}
            />
          </View>
          {activeFilters > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMaxTime(TIME_MAX);
                setMaxPrice(PRICE_MAX);
              }}>
              <Text style={styles.resetFilter}>Nullstill filter</Text>
            </Pressable>
          )}
        </View>
      )}

      {meals.length === 0 ? (
        <View style={styles.empty}>
          <Title size="sm">{query ? `Ingen treff på «${query}»` : 'Ingen middager passer filteret'}</Title>
          <Body>{query ? 'Prøv et annet ord, eller tøm søket for å se alle middagene.' : 'Dra skalaene litt opp, eller nullstill filteret.'}</Body>
        </View>
      ) : (
        <View style={[styles.grid, gridGap]}>
          {meals.map(({ meal, best, perPerson, protein, eatenAt }) => (
            <MealCard
              key={meal.id}
              view={view}
              meal={meal}
              width={cardWidth}
              best={best}
              perPerson={perPerson}
              protein={sort === 'protein' ? protein : null}
              saved={inspo && saved.has(meal.id as number)}
              eatenAt={eatenAt}
              inWeek={Boolean(entryFor(meal.id))}
              onToggleWeek={() => {
                const entry = entryFor(meal.id);
                if (entry) removeEntry(entry.id);
                else addMeal(meal.id, persons);
              }}
              onPress={() => router.push(`/rett/${meal.id}`)}
            />
          ))}
        </View>
      )}
    </Page>
  );
}

type CardProps = {
  view: CardView;
  meal: Meal;
  width: number;
  best: StorePrice | undefined;
  perPerson: number;
  protein: number | null;
  saved: boolean;
  eatenAt: number | null;
  inWeek: boolean;
  onToggleWeek: () => void;
  onPress: () => void;
};

function MealCard(props: CardProps) {
  const { view, meal, width, onPress } = props;
  if (view === 'liste') return <MealRow {...props} />;
  const compact = view === 'rutenett';
  const tint = categoryTints[meal.category] ?? defaultTint;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={meal.name} onPress={onPress} style={{ width }}>
      {({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => (
        <View style={pressed && { opacity: 0.85 }}>
          <View style={[styles.cardImage, compact && styles.cardImageCompact, { backgroundColor: tint }]}>
            <Image
              source={{ uri: photoFor(meal) }}
              style={[StyleSheet.absoluteFill, hovered && styles.cardImageHover]}
              contentFit="cover"
              transition={200}
              accessibilityLabel={meal.name}
            />
            <Tags {...props} compact={compact} />
            <WeekButton {...props} compact={compact} />
          </View>
          <View style={[styles.cardBody, compact && styles.cardBodyCompact]}>
            {compact ? (
              <>
                <Text style={[styles.cardTitleCompact, hovered && styles.cardTitleHover]} numberOfLines={2}>
                  {meal.name}
                </Text>
                <MetaLine {...props} short />
              </>
            ) : (
              <>
                <MetaLine {...props} />
                <Text style={[styles.cardTitle, hovered && styles.cardTitleHover]}>{meal.name}</Text>
                {meal.description ? (
                  <Body style={styles.cardDescription} numberOfLines={2}>
                    {meal.description}
                  </Body>
                ) : null}
              </>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// Liste: lite bilde, navn og pris på én rad. Raskest å bla gjennom.
function MealRow(props: CardProps) {
  const { meal, width, onPress } = props;
  const tint = categoryTints[meal.category] ?? defaultTint;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={meal.name}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        { width },
        (pressed || hovered) && styles.rowActive,
      ]}>
      <View style={[styles.rowImage, { backgroundColor: tint }]}>
        <Image source={{ uri: photoFor(meal) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={meal.name} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {meal.name}
        </Text>
        <MetaLine {...props} short />
        <Tags {...props} compact inline />
      </View>
      <WeekButton {...props} compact inline />
    </Pressable>
  );
}

function MetaLine({ meal, best, perPerson, protein, eatenAt, short }: CardProps & { short?: boolean }) {
  if (short) {
    // Kort: tid og pris på én linje uten ikoner, så det får plass to i bredden.
    const parts = [
      meal.timeMinutes > 0 ? `${meal.timeMinutes} min` : null,
      best ? `${perPerson} kr/pers` : null,
      protein !== null ? `${protein} g protein` : null,
      eatenAt ? `Handlet ${daysAgo(eatenAt)}` : null,
    ].filter((part): part is string => Boolean(part));
    return (
      <View style={styles.metaShort}>
        {parts.map((part, index) => (
          <View key={part} style={styles.metaShortPart}>
            {index > 0 && <Text style={[styles.metaShortText, styles.metaDot]}>·</Text>}
            <Text style={styles.metaShortText}>{part}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={[styles.metaRow, short && styles.metaRowShort]}>
      {meal.timeMinutes > 0 && <Meta icon="time-outline">{meal.timeMinutes} min</Meta>}
      {best && <Meta icon="wallet-outline">{short ? `${perPerson} kr/pers` : `${formatPrice(best.price)} · ${perPerson} kr/pers`}</Meta>}
      {protein !== null && <Meta icon="barbell-outline">{protein} g protein</Meta>}
      {eatenAt && <Meta icon="checkmark-done-outline">Handlet {daysAgo(eatenAt)}</Meta>}
    </View>
  );
}

function Tags({ meal, inWeek, saved, compact, inline }: CardProps & { compact?: boolean; inline?: boolean }) {
  if (!inWeek && !meal.custom && !saved) return null;
  return (
    <View style={inline ? styles.tagsInline : [styles.tags, compact && styles.tagsCompact]}>
      {inWeek && (
        <View style={[styles.onListTag, compact && styles.tagCompact]}>
          <Ionicons name="calendar" size={compact ? 11 : 13} color={colors.ink} />
          <Text style={[styles.onListText, compact && styles.tagTextCompact]}>I uka</Text>
        </View>
      )}
      {meal.custom && (
        <View style={[styles.onListTag, styles.customTag, compact && styles.tagCompact]}>
          <Ionicons name="person" size={compact ? 10 : 12} color={colors.ink} />
          <Text style={[styles.onListText, compact && styles.tagTextCompact]}>Egen</Text>
        </View>
      )}
      {saved && (
        <View style={[styles.onListTag, styles.customTag, compact && styles.tagCompact]}>
          <Ionicons name="bookmark" size={compact ? 10 : 12} color={colors.ink} />
          <Text style={[styles.onListText, compact && styles.tagTextCompact]}>I mine</Text>
        </View>
      )}
    </View>
  );
}

function WeekButton({ meal, inWeek, onToggleWeek, compact, inline }: CardProps & { compact?: boolean; inline?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={inWeek ? `Fjern ${meal.name} fra uka` : `Legg ${meal.name} i uka`}
      onPress={onToggleWeek}
      hitSlop={compact ? 10 : 6}
      style={[
        styles.weekButton,
        compact && styles.weekButtonCompact,
        inline && styles.weekButtonInline,
        inWeek && styles.weekButtonOn,
      ]}>
      <Ionicons name={inWeek ? 'checkmark' : 'add'} size={compact ? 20 : 24} color={inWeek ? colors.limeStrong : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  install: {
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  library: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.beige,
    borderRadius: radius.round,
    padding: 4,
  },
  views: {
    flexDirection: 'row',
    backgroundColor: colors.beige,
    borderRadius: radius.round,
    padding: 4,
  },
  viewOption: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOptionOn: {
    backgroundColor: colors.ink,
  },
  libraryOption: {
    paddingHorizontal: spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.round,
  },
  libraryOptionOn: {
    backgroundColor: colors.ink,
  },
  libraryText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink,
  },
  libraryTextOn: {
    color: colors.bg,
  },
  hero: {
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroNarrow: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xxl,
  },
  heroText: {
    gap: spacing.sm,
    flexShrink: 1,
    maxWidth: 640,
  },
  heroBody: {
    marginTop: spacing.xs,
  },
  controls: {
    gap: spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  controlsWide: {
    alignItems: 'flex-end',
    minWidth: 320,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.beige,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    alignSelf: 'stretch',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: spacing.md,
    outlineStyle: 'none',
  } as object,
  newButtonNarrow: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  sortScroll: {
    marginTop: -spacing.lg,
    marginBottom: spacing.xl,
    flexGrow: 0,
  },
  sortScrollNarrow: {
    marginTop: 0,
    marginBottom: spacing.lg,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortRowNarrow: {
    flexWrap: 'nowrap',
  },
  saver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.limeStrong,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  saverText: {
    flex: 1,
    gap: 2,
  },
  saverTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  saverBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  filterButtonOn: {
    borderColor: colors.ink,
    backgroundColor: colors.lime,
  },
  filterButtonText: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.ink,
  },
  filterPanel: {
    backgroundColor: colors.beige,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
  },
  filterPanelWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  filterSlider: {
    flex: 1,
    minWidth: 240,
  },
  resetFilter: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardImage: {
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardImageCompact: {
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
  },
  cardImageHover: {
    transform: [{ scale: 1.03 }],
  },
  tags: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.limeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekButtonCompact: {
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
  },
  weekButtonInline: {
    position: 'relative',
    top: 0,
    right: 0,
    width: 38,
    height: 38,
  },
  weekButtonOn: {
    backgroundColor: colors.ink,
  },
  tagsCompact: {
    top: spacing.sm,
    left: spacing.sm,
    right: 52,
    flexWrap: 'wrap',
  },
  tagsInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  tagCompact: {
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tagTextCompact: {
    fontSize: 11,
  },
  customTag: {
    backgroundColor: colors.lavender,
  },
  onListTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.limeStrong,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  onListText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.ink,
  },
  cardBody: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  cardBodyCompact: {
    paddingTop: spacing.sm,
    paddingBottom: 0,
    gap: 4,
  },
  cardTitleCompact: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 22,
    color: colors.ink,
  },
  metaRowShort: {
    columnGap: spacing.md,
    rowGap: 2,
  },
  metaShort: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  metaShortText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  metaShortPart: {
    flexDirection: 'row',
    gap: 6,
  },
  metaDot: {
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowActive: {
    opacity: 0.8,
  },
  rowImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 22,
    color: colors.ink,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    color: colors.ink,
  },
  cardTitleHover: {
    textDecorationLine: 'underline',
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});

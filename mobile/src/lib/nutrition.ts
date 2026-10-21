import type { Ingredient, Meal } from '@/data/meals';
import { mealBase, scaleQuantity } from '@/lib/meals';
import { isPantry } from '@/lib/prices';

// Grove næringsanslag per middag, ut fra typiske verdier for vanlige råvarer.
// Det er ment som en pekepinn i hverdagen, ikke som medisinske råd.

type Food = {
  protein: number; // gram per 100 g
  carbs: number; // gram karbohydrat per 100 g
  gi?: number; // glykemisk indeks for karbohydratene
  unitGrams?: Partial<Record<string, number>>; // hvor mye én stk/boks/pose veier
  ultra?: boolean; // typisk ultraprosessert (NOVA 4)
  processedMeat?: boolean; // bearbeidet kjøtt (Helsedirektoratet: begrens)
  redMeat?: boolean;
  fish?: boolean;
  veg?: boolean; // teller som grønnsaker/frukt
};

// Første mønster som treffer navnet vinner, så de mest spesifikke står først.
const FOODS: [RegExp, Food][] = [
  [/fiskekake|fiskeboll|fiskepudding/, { protein: 9, carbs: 8, gi: 50, fish: true, ultra: true }],
  [/fiskepinne/, { protein: 12, carbs: 18, gi: 50, fish: true, ultra: true }],
  [/laks|ørret|torsk|sei\b|hyse|fisk|klippfisk|bacalao|tunfisk|makrell/, { protein: 20, carbs: 0, fish: true }],
  [/reke|scampi|skalldyr/, { protein: 20, carbs: 0, fish: true }],
  [/bacon/, { protein: 14, carbs: 0, redMeat: true, processedMeat: true }],
  [/spekeskinke|salami|serrano|parma/, { protein: 24, carbs: 0, redMeat: true, processedMeat: true }],
  [/pølse|wiener|grillpølse/, { protein: 12, carbs: 4, gi: 40, redMeat: true, processedMeat: true, ultra: true, unitGrams: { stk: 60 } }],
  [/skinke/, { protein: 18, carbs: 1, redMeat: true, processedMeat: true }],
  [/kjøttboll|kjøttkake|karbonade/, { protein: 16, carbs: 5, gi: 50, redMeat: true }],
  [/kjøttdeig|karbonadedeig|svin|biff|entrecôte|entrecote|indrefilet|ytrefilet|lam\b|lammekjøtt|storfe/, { protein: 20, carbs: 0, redMeat: true }],
  // Ferdig grillet: spiselig kjøtt uten bein, mer protein per 100 g.
  [/grillet kylling|ferdiggrillet|salatkylling/, { protein: 27, carbs: 0, unitGrams: { stk: 600 } }],
  [/kylling|kalkun/, { protein: 21, carbs: 0, unitGrams: { stk: 1300 } }],
  [/^egg$|\begg\b/, { protein: 12.5, carbs: 1, unitGrams: { stk: 60 } }],
  [/parmesan|grana/, { protein: 35, carbs: 0 }],
  [/mozzarella/, { protein: 18, carbs: 1 }],
  [/ost\b|cheddar|norvegia|feta/, { protein: 26, carbs: 1 }],
  [/rømme|crème|creme|fløte|kesam/, { protein: 2.5, carbs: 3.5, gi: 30 }],
  [/yoghurt|skyr/, { protein: 5, carbs: 5, gi: 35 }],
  [/melk/, { protein: 3.4, carbs: 4.6, gi: 30 }],
  [/smør|margarin/, { protein: 0.6, carbs: 0.5 }],
  [/taco-skjell|tacoskjell/, { protein: 6, carbs: 62, gi: 68, ultra: true, unitGrams: { stk: 11 } }],
  [/tortilla|lompe|wrap/, { protein: 8, carbs: 50, gi: 35, ultra: true, unitGrams: { stk: 60, pk: 370 } }],
  [/pitabrød|pita/, { protein: 9, carbs: 55, gi: 68, ultra: true, unitGrams: { stk: 70 } }],
  [/pinsa|pizzabunn/, { protein: 9, carbs: 50, gi: 70, ultra: true, unitGrams: { stk: 230 } }],
  [/naan|brød|baguette|rundstykk|krutong/, { protein: 9, carbs: 48, gi: 70, unitGrams: { stk: 80 } }],
  [/lasagneplate|spaghetti|pasta|penne|makaroni|tagliatelle|farfalle|fusilli|tortellini/, { protein: 12, carbs: 70, gi: 50 }],
  [/nudl|nudel/, { protein: 10, carbs: 70, gi: 55 }],
  [/risotto|ris\b|jasminris|basmati/, { protein: 7, carbs: 78, gi: 70 }],
  [/bakepotet/, { protein: 2, carbs: 17, gi: 85, unitGrams: { stk: 250 } }],
  [/potetmos|potetstappe/, { protein: 2, carbs: 15, gi: 85 }],
  [/potet/, { protein: 2, carbs: 16, gi: 80, unitGrams: { stk: 120 } }],
  [/(^|\s)mel($|\s)|hvetemel|pizzamel/, { protein: 10, carbs: 72, gi: 70 }],
  [/sukker/, { protein: 0, carbs: 100, gi: 65 }],
  [/syltetøy/, { protein: 0.5, carbs: 45, gi: 55, unitGrams: { glass: 400 } }],
  [/honning|sirup/, { protein: 0, carbs: 80, gi: 60 }],
  [/krydder|buljong|kraft/, { protein: 5, carbs: 40, gi: 50, ultra: true, unitGrams: { pose: 28, terning: 10 } }],
  [/salsa|tacosaus|pizzasaus|tomatsaus/, { protein: 1.5, carbs: 7, gi: 40, ultra: true, unitGrams: { glass: 230, boks: 340 } }],
  [/dressing|majones|bearnaise|béarnaise|ketchup/, { protein: 1, carbs: 8, gi: 50, ultra: true, unitGrams: { flaske: 300 } }],
  [/linser|kikerter|bønner/, { protein: 8, carbs: 18, gi: 30, unitGrams: { boks: 400 } }],
  [/mais/, { protein: 3, carbs: 19, gi: 52, veg: true, unitGrams: { boks: 300, stk: 200 } }],
  [/hermetiske tomater|hakkede tomater|knuste tomater|passata/, { protein: 1, carbs: 4, gi: 30, veg: true, unitGrams: { boks: 400 } }],
  [/tomatpuré/, { protein: 4, carbs: 18, gi: 35, veg: true }],
  [/tomat/, { protein: 1, carbs: 3.5, gi: 30, veg: true, unitGrams: { stk: 100 } }],
  [/hvitløk/, { protein: 6, carbs: 30, veg: true, unitGrams: { fedd: 5, stk: 50 } }],
  [/løk/, { protein: 1, carbs: 8, gi: 15, veg: true, unitGrams: { stk: 100, bunt: 100 } }],
  [/salat|ruccola|spinat/, { protein: 1.2, carbs: 2, gi: 15, veg: true, unitGrams: { hode: 400, pose: 70 } }],
  [/agurk/, { protein: 0.7, carbs: 2, gi: 15, veg: true, unitGrams: { stk: 350 } }],
  [/paprika/, { protein: 1, carbs: 5, gi: 15, veg: true, unitGrams: { stk: 150 } }],
  [/gulrot|gulrøtter/, { protein: 0.8, carbs: 7, gi: 40, veg: true, unitGrams: { stk: 80 } }],
  [/brokkoli|blomkål/, { protein: 3, carbs: 4, gi: 15, veg: true, unitGrams: { hode: 400 } }],
  [/sopp|sjampinjong/, { protein: 3, carbs: 1, veg: true }],
  [/avokado/, { protein: 2, carbs: 2, veg: true, unitGrams: { stk: 170 } }],
  [/erter|sukkererter|bønnespirer/, { protein: 5, carbs: 10, gi: 40, veg: true }],
  [/sitron|lime/, { protein: 0, carbs: 3, veg: true, unitGrams: { stk: 30 } }],
  [/dill|persille|basilikum|koriander|gressløk|urter/, { protein: 3, carbs: 5, veg: true, unitGrams: { bunt: 30 } }],
  [/olje/, { protein: 0, carbs: 0 }],
];

const DEFAULT_FOOD: Food = { protein: 2, carbs: 5, gi: 50 };

const UNIT_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  dl: 100,
  l: 1000,
  ss: 15,
  ts: 5,
  klype: 1,
  fedd: 5,
  stk: 100,
  boks: 400,
  glass: 300,
  flaske: 400,
  pose: 100,
  pk: 300,
  pakke: 300,
  hode: 400,
  bunt: 50,
  beger: 300,
  terning: 10,
  porsjon: 150,
};

function foodFor(name: string): Food {
  const lower = name.toLowerCase();
  return FOODS.find(([pattern]) => pattern.test(lower))?.[1] ?? DEFAULT_FOOD;
}

function grams(ingredient: Ingredient, quantity: number, food: Food): number {
  const unit = ingredient.unit.toLowerCase();
  if ((unit === 'pk' || unit === 'pakke') && ingredient.product?.packSize) {
    const pack = ingredient.product.packUnit?.toLowerCase();
    const perPack = pack === 'kg' || pack === 'l' ? ingredient.product.packSize * 1000 : ingredient.product.packSize;
    if (pack !== 'stk') return quantity * perPack;
  }
  const perUnit = food.unitGrams?.[unit] ?? UNIT_GRAMS[unit] ?? 100;
  return quantity * perUnit;
}

export type GlLevel = 'lav' | 'middels' | 'høy';

export type MealNutrition = {
  protein: number; // gram per porsjon
  gl: number; // glykemisk belastning per porsjon
  glLevel: GlLevel;
  veg: number; // gram grønnsaker og frukt per porsjon
  redMeat: number; // gram rødt kjøtt (rå vekt) per porsjon
  fish: boolean;
  ultra: string[]; // ingredienser som typisk er ultraprosessert
  processedMeat: string[];
  diabetes: 'god' | 'middels' | 'obs';
};

// Næring per porsjon. Basisvarer (en skje olje, salt) teller ikke.
export function mealNutrition(meal: Meal): MealNutrition {
  const base = mealBase(meal);
  let protein = 0;
  let gl = 0;
  let veg = 0;
  let redMeat = 0;
  let fish = false;
  const ultra: string[] = [];
  const processedMeat: string[] = [];

  for (const ingredient of meal.ingredients) {
    const food = foodFor(ingredient.name);
    const perPortion = grams(ingredient, scaleQuantity(ingredient.quantity, 1, base), food);
    if (isPantry(ingredient) && ingredient.unit !== 'ss') continue;
    protein += (perPortion * food.protein) / 100;
    gl += (((perPortion * food.carbs) / 100) * (food.gi ?? 50)) / 100;
    if (food.veg) veg += perPortion;
    if (food.redMeat) redMeat += perPortion;
    if (food.fish) fish = true;
    if (food.ultra) ultra.push(ingredient.name);
    if (food.processedMeat) processedMeat.push(ingredient.name);
  }

  const glLevel: GlLevel = gl < 20 ? 'lav' : gl <= 35 ? 'middels' : 'høy';
  const diabetes = glLevel === 'lav' && protein >= 20 ? 'god' : glLevel === 'høy' ? 'obs' : 'middels';
  return {
    protein: Math.round(protein),
    gl: Math.round(gl),
    glLevel,
    veg: Math.round(veg),
    redMeat: Math.round(redMeat),
    fish,
    ultra,
    processedMeat,
    diabetes,
  };
}

export type WeekTip = { key: string; text: string; tone: 'good' | 'tip' };

// Ukesbalanse etter Helsedirektoratets kostråd: fisk 2–3 ganger i uka, begrens
// rødt og bearbeidet kjøtt (maks ca. 350–500 g tilberedt kjøtt i uka), og mye grønt.
export function weekBalance(meals: Meal[]): { tips: WeekTip[]; fishCount: number; avgProtein: number } {
  const nutrition = meals.map(mealNutrition);
  const fishCount = nutrition.filter(n => n.fish).length;
  const redMeat = nutrition.reduce((sum, n) => sum + n.redMeat, 0);
  const processed = nutrition.filter(n => n.processedMeat.length > 0).length;
  const avgVeg = nutrition.length ? nutrition.reduce((sum, n) => sum + n.veg, 0) / nutrition.length : 0;
  const ultraHeavy = nutrition.filter(n => n.ultra.length >= 3).length;
  const avgProtein = nutrition.length ? Math.round(nutrition.reduce((sum, n) => sum + n.protein, 0) / nutrition.length) : 0;
  const tips: WeekTip[] = [];
  if (meals.length === 0) return { tips, fishCount, avgProtein };

  if (fishCount >= 2) tips.push({ key: 'fisk', tone: 'good', text: `${fishCount} fiskemiddager – i tråd med rådet om fisk 2–3 ganger i uka.` });
  else tips.push({ key: 'fisk', tone: 'tip', text: `${fishCount === 0 ? 'Ingen' : 'Bare én'} fiskemiddag. Helsedirektoratet anbefaler fisk til middag 2–3 ganger i uka.` });

  // 500 g tilberedt kjøtt tilsvarer omtrent 700 g rått.
  if (redMeat > 700) tips.push({ key: 'kjott', tone: 'tip', text: `Ca. ${redMeat} g rødt kjøtt per person (rå vekt). Rådet er maks ca. 500 g tilberedt i uka – bytt gjerne én middag med fisk eller kylling.` });
  else if (redMeat > 0) tips.push({ key: 'kjott', tone: 'good', text: `Ca. ${redMeat} g rødt kjøtt per person – innenfor rådet for en uke.` });

  if (processed >= 2) tips.push({ key: 'bearbeidet', tone: 'tip', text: `${processed} middager med bearbeidet kjøtt (bacon, skinke, pølser). Rådet er å begrense det.` });
  if (avgVeg < 150) tips.push({ key: 'gront', tone: 'tip', text: `Lite grønt: ca. ${Math.round(avgVeg)} g per porsjon. Legg gjerne til en salat eller grønnsaker – målet er 5 om dagen.` });
  else tips.push({ key: 'gront', tone: 'good', text: `Godt med grønt: ca. ${Math.round(avgVeg)} g per porsjon.` });
  if (ultraHeavy >= 2) tips.push({ key: 'ultra', tone: 'tip', text: `${ultraHeavy} middager har mye ultraprosessert (ferdige krydderblandinger, sauser, brød). Hjemmelaget krydder og saus er et enkelt bytte.` });
  return { tips, fishCount, avgProtein };
}

export const GL_TEXT: Record<GlLevel, string> = { lav: 'Lav', middels: 'Middels', høy: 'Høy' };

export const DIABETES_TEXT = {
  god: 'Passer godt: lite raske karbohydrater og mye protein.',
  middels: 'Greit i vanlige porsjoner. Mer grønt og litt mindre pasta, ris eller poteter senker blodsukkerstigningen.',
  obs: 'Mye raske karbohydrater. Mindre porsjon av pasta, ris, poteter eller brød, og mer grønt, gjør den bedre.',
} as const;

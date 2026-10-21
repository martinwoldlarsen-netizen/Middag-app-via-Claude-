import type { Meal } from '@/data/meals';

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

// Navnet på retten avgjør bildet, slik at nye retter får et passende bilde uten manuelt arbeid.
const NAME_PHOTOS: [RegExp, string][] = [
  [/(pizza|pinsa|margherita)/, 'photo-1574071318508-1cdbab80d002'],
  [/(taco|burrito|fajita|enchilada|quesadilla)/, 'photo-1599974579688-8dbdd335c77f'],
  [/(wrap|falafel|pita|kebab|gyros)/, 'photo-1626700051175-6818013e1d4f'],
  [/(bakt potet|bakepotet)/, 'photo-1761712826074-5f1bab2b2f32'],
  // Fisk før pasta, så «Laksepasta» får laks og ikke kjøttsaus.
  [/(laks|salmon|ørret)/, 'photo-1656389863625-59de2275fb7e'],
  [/(lasagne|lasagna)/, 'photo-1574894709920-11b28e7367e3'],
  [/(carbonara|spaghetti|bolognese|pasta|penne|tagliatelle|tortellini|sommerfuglpasta)/, 'photo-1621996346565-e3dbc646d9a9'],
  [/(fiskekake|fiskebolle|fiskeburger)/, 'photo-1652690772758-45df96e11c50'],
  [/(bacalao|klippfisk|torsk|sei|hyse|fiskepinner|fiskegrateng|fiskesuppe|fisk)/, 'photo-1535140728325-a4d3707eee61'],
  [/(reke|scampi|skalldyr)/, 'photo-1581867286869-fd02aaaef2f2'],
  [/(tikka|masala|butter chicken|curry|karri)/, 'photo-1512058564366-18510be2db19'],
  [/(kylling|chicken|satay|wok)/, 'photo-1598103442097-8b74394b95c6'],
  [/(biff|entrecôte|entrecote|steak|indrefilet|ytrefilet)/, 'photo-1600891964092-4316c288032e'],
  [/(lam|lammegryte)/, 'photo-1529042410759-befb1204b468'],
  [/(kjøttbolle|kjøttkake|karbonade|kjøttdeig|chili con|lapskaus)/, 'photo-1529042410759-befb1204b468'],
  [/(pølse|hot ?dog|grill)/, 'photo-1619881590738-a111d176d906'],
  [/(suppe|gryte|stew|blomkålsuppe)/, 'photo-1547592166-23ac45744acd'],
  [/(nudelsalat|nudler|thai)/, 'photo-1552611052-33e04de081de'],
  [/(salat|caesar|bowl)/, 'photo-1546069901-ba9599a7e63c'],
  [/(omelett|egg|frittata|eggerøre)/, 'photo-1525351484163-7529414344d8'],
  [/(pannekake|vaffel|waffle|crepe)/, 'photo-1528207776546-365bb710ee93'],
  [/(risotto|ris|nasi)/, 'photo-1512058564366-18510be2db19'],
  [/(burger|hamburger)/, 'photo-1568901346375-23c9450c58cd'],
  [/(brød|bakst|focaccia|bolle)/, 'photo-1509440159596-0249088772ff'],
];

const CATEGORY_PHOTOS: Record<string, string> = {
  Pasta: 'photo-1621996346565-e3dbc646d9a9',
  Fisk: 'photo-1467003909585-2f8a72700288',
  Kjøtt: 'photo-1600891964092-4316c288032e',
  Suppe: 'photo-1547592166-23ac45744acd',
  Salat: 'photo-1546069901-ba9599a7e63c',
  Meksikansk: 'photo-1565299624946-b28f40a0ae38',
  Asiatisk: 'photo-1512058564366-18510be2db19',
  Pizza: 'photo-1574071318508-1cdbab80d002',
};

const DEFAULT_PHOTO = unsplash('photo-1504674900247-0877df9cc836');

export function photoFor(meal: Meal): string {
  if (meal.image) return meal.image;
  const name = meal.name.toLowerCase();
  for (const [pattern, id] of NAME_PHOTOS) {
    if (pattern.test(name)) return unsplash(id);
  }
  const byCategory = CATEGORY_PHOTOS[meal.category];
  if (byCategory) return unsplash(byCategory);
  return DEFAULT_PHOTO;
}

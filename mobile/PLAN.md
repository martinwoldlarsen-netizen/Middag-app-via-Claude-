# Handleklar – plan og status

Les denne før du gjør endringer i appen. Den samler prosjektdokumentet
(`docs/middag-app-konsept.pdf`), alt eieren har sagt underveis, og eierens egne
notater. «Du» betyr eieren av appen.

Sist oppdatert: 16. oktober 2026 (innlogging og app på Hjem-skjermen).

## Kjerneidé

En handleliste som fjerner hverdagsstresset rundt middag.

Du står i butikken, aner ikke hva du skal ha og orker ikke tenke. Du åpner
appen, scroller raskt gjennom middagene, velger én og butikken du er i. Da får
du handlelista i den rekkefølgen varene ligger, så du går raskeste vei gjennom
butikken uten å snu en eneste gang. Du trykker deg gjennom lista og er ferdig.

- Rundt 20 faste middager i rotasjon. Kjernen først, større ambisjoner senere.
- Enkel og rask å bruke, men skal se pen ut. Inspirert av matprat.no.
- Butikkene er Kiwi, Coop Extra og Rema 1000 i Spydeberg.

## Slik fungerer appen i dag

- **Innlogging som i ukepenger:** appen starter med «Hei igjen 👋». Logg inn
  med e-post og passord (Google-knappen dukker opp av seg selv når Google slås
  på i Supabase), eller lag konto. Kontoen kobles til husstanden, så ukeplan,
  liste, egne middager og eierskapet til butikkene følger deg til alle
  telefoner – også appen på Hjem-skjermen, som på iPhone har eget lager.
  «Glemt passord?» sender lenke. «Bruk uten konto» virker som før. Konto og
  «Logg ut» ligger øverst under Mer.
- **App på Hjem-skjermen:** veiledning (Del → «Legg til på Hjem-skjerm») på
  innloggingen, forsiden (kan skjules) og under Mer. Appen åpner også uten nett
  (service worker), så lista virker med dårlig dekning i butikken.
- **Middager:** kort med bilde, tid, pris og pris per person. Søk, antall
  personer, sortering (Forslag, Raskest, Billigst, Mest protein, Lengst siden)
  og filter med dra-skalaer for tid og pris per person. + legger middagen i uka.
- **Mine middager / Inspo:** bryteren øverst bytter mellom husstandens middager
  og 36 Inspo-retter (norske hverdagsmiddager og Oda-retter). Inspo har litt
  kjøligere bakgrunn. En Inspo-rett kan legges rett i uka eller lagres som egen.
- **Oppskrift:** ingredienser, fremgangsmåte, pris i hver butikk («Billigst»),
  pris per porsjon, tips om antall porsjoner, og «Næring per porsjon» (protein,
  glykemisk belastning, grønt, ultraprosessert, diabetes). Næringen er grove
  anslag og ikke medisinske råd.
- **Kokemodus** (`/lag/[id]`): ett stort steg om gangen, ingredienser ved behov,
  nedtelling på steg med minutter, og skjermen holdes på.
- **Uka:** planlegg hjemme. Dag og personer per middag, samlet pris, billigste
  butikk, «Ukas balanse» etter Helsedirektoratets kostråd (med forslag til
  fiskemiddag), og «Forbedre uka»: velg Spar penger, Mer protein eller Sunnere
  og bytt middager med ett trykk. Forslagene kommer fra Claude når
  `ANTHROPIC_API_KEY` er lagt inn i Vercel, ellers fra enkle regler i appen.
- **Handleliste:** alle middagene i uka samlet til én liste i butikkens rute.
  «Neste» stopp øverst, «I kurven» nederst, angre, bytt vare, hopp over, legg
  til egne varer. Når alt er tatt, viser lista hva som blir til overs.
- **Samboer:** delt liste og ukeplan via lenke (Mer → Del med samboer). Ser
  hvem som handler nå, og kan legge til varer underveis.
- **Kjøleskap og rester:** hva dere har hjemme med utløpsdato, rester etter
  handling, og «Sparemiddag» som bruker opp det som går ut snart.
- **Historikk:** hva som er handlet og når. Middager handlet siste uka havner
  nederst i Forslag.
- **Egne middager:** «Ny middag» med varesøk fra Kassalapp, eller fritekst.
  «Lag din versjon» på en fast middag erstatter originalen.
- **Butikker:** rekkefølgen er felles for alle og kan bare endres av eieren.
  Eiertelefonen settes opp på `/eier`.
- **Priser:** fra Kassalapp per kjede, regnet i hele pakker. Gammel pris fra
  samme kjede brukes før ny pris fra en annen kjede, men merkes «ca.» med dato.
  Varer uten kobling anslås. Ting du har hjemme (skjeer, salt, olje) telles ikke.

## Status

### Ferdig (oktober 2026)

- Kjernen: middagskort, oppskrift, personvelger, handleliste i butikkens rute,
  låst rekkefølge per butikk, egne middager, priser fra Kassalapp
- Etappe 1: ukeplan, samlet handleliste, egne varer i lista, bytt vare
- Etappe 2: samboer (delt liste, «handler nå») og handlehistorikk
- Etappe 3: sortering, filter med dra-skalaer, pris per porsjon, raskere søk
- Etappe 4: kjøleskap, rester og sparemiddag
- Etappe 5: næring per porsjon, ukesbalanse, kokemodus, Inspo-bibliotek
- Etappe 6: «Forbedre uka» med AI-forslag (spar, protein, sunnere)
- Innlogging og kontoer, app på Hjem-skjermen og bruk uten nett (16. oktober)

### Gjenstår

1. **Eieren legger inn `ANTHROPIC_API_KEY` i Vercel** for ekte AI-forslag.
   Uten nøkkel brukes enkle forslag regnet ut i appen.
2. **Bytt Kassalapp-nøkkelen** (den ble limt inn i chatten) og legg den nye inn
   i Vercel som `KASSALAPP_API_KEY`.
3. **Resten av de ~20 faste middagene.** Mangler bl.a. Madelén pasta og
   linseretten fra Ida Gran.
4. **Gå gjennom butikkene i Spydeberg** og rette rekkefølgen. Eierens jobb.
5. **Kiwi-, Rema- og Coop-prisene i Kassalapp er gamle** (2022–2023). Appen
   merker dem «ca.» med dato. Ferskere priser krever en annen kilde.
6. **Varsel på låst telefon** når samboer handler finnes ikke ennå (bare banner
   i appen). Krever push-varsler.
7. **E-post fra Supabase:** gratisplanen sender bare e-post (bekreftelse, nytt
   passord) til eierens egne adresser, og lenkene går til Site URL i Supabase.
   Eieren bør slå av «Confirm email» og legge til
   `https://handleklar-omega.vercel.app/**` under Redirect URLs. Egen
   e-posttjeneste (f.eks. Resend) trengs for at andre skal få e-post.
8. **AI som anbefaler retter ut fra smak** og bytter enkeltvarer i lista (i dag
   bytter AI-en hele middager).

## Åpne spørsmål til eieren

- Hva er Madelén pasta og linseretten fra Ida Gran? (Kan legges inn som egne
  middager.)
- Hva betyr «HelloFresh-opplegg» helt konkret?

## Ønsker for hvordan vi jobber

- Eieren har bare iPhone. Ingen Mac, ingen PC.
- Forklar enkelt på norsk, og legg ved lenke til guide når eieren må gjøre noe.
- Avslutt alltid svaret med lenken til appen: https://handleklar-omega.vercel.app
- Test i nettleser (headless Chromium) på mobil-, nettbrett- og PC-størrelse
  før publisering. «Ikke gi deg før alt funker.»
- Nøkler og passord skal aldri limes inn i chatten.
- Butikkrekkefølgen skal være 100 % riktig og kan bare endres av eieren.

## Teknisk

- **Appen:** Expo SDK 57 med expo-router i `mobile/`. Kjøres som nettside
  (`npx expo export --platform web`, output `dist/`).
- **Publisering:** Vercel-prosjektet `handleklar` er ikke koblet til GitHub.
  Publiser med Vercel `create_deployment` fra en commit på branchen, target
  production. Adresse: https://handleklar-omega.vercel.app. Den gamle nettsiden
  (`frontend/`, `api/`) er et eget prosjekt og er ikke appen.
- **API:** `mobile/api/search.ts` og `mobile/api/prices.ts` henter fra
  Kassalapp med nøkkelen på serveren. Uten nøkkel svarer de
  `unavailable: 'no_key'`, og appen viser anslag.
- **AI-forslag:** `mobile/api/forslag.ts` kaller Claude (`claude-opus-5-5`,
  effort low, strukturert svar, `fallbacks: "default"`). Appen sender ferdig
  utregnet pris og næring, og svaret sjekkes mot id-ene som ble sendt. Bare
  samme adresse får kalle den, og det er en grense per IP. Uten
  `ANTHROPIC_API_KEY` svarer den `no_key`, og appen bruker `src/lib/forslag.ts`.
- **Database:** Supabase-prosjektet «Mat app» (`ocryrmuvwthsceovybqx`), eget
  skjema `handleklar` som ikke er eksponert. Gratisplanen setter prosjektet på
  pause etter en uke uten bruk (skjedde 16. oktober). `mobile/api/keepalive.ts`
  kalles hver morgen av en Vercel cron (`vercel.json`) for å holde det våkent.
  Appen bruker bare `hk_*`-funksjoner:
  - kontoer (krever innlogging): `hk_account_login` (kobler kontoen til
    husstanden og gir telefonen en egen nøkkel i `handleklar.household_keys`,
    tar med eierskapet), `hk_account_info`, `hk_account_set_name`.
    Tabellen `handleklar.accounts` kobler `auth.users` til husstand.
  - egne middager: `hk_create_household`, `hk_list_meals`, `hk_save_meal`,
    `hk_delete_meal` (husstandsnøkkel i appen, bare hashen lagres)
  - butikker: `hk_list_stores` (åpen), `hk_save_store` og `hk_hide_store`
    (krever eiernøkkel), `hk_check_owner`, `hk_owner_claim_open`,
    `hk_claim_owner` (gjør en telefon til eier én gang)
  - De gamle tabellene i `public` hører til den gamle nettsiden. Ikke rør dem.
- **Rute-systemet:** `src/lib/stops.ts` plasserer hver vare på et av 18 stopp.
  En butikk er en rekkefølge av stoppene.
- **Priser:** `src/lib/prices.ts` (hele pakker, kjede per butikk, «har hjemme»).
- **Innlogging:** `src/lib/supabase.ts` (Supabase Auth, lagres på telefonen),
  `src/lib/auth.tsx` (innlogging, kobling, logg ut), `src/components/AuthGate.tsx`,
  `LoginScreen.tsx`, `AccountCard.tsx`, `InstallCard.tsx`. `public/sw.js` er
  service workeren.
- **Delt tilstand:** `src/lib/shopping.tsx` (ukeplan, liste, kjøleskap) synkes
  som små endringer via `hk_get_list`/`hk_patch_list` i `src/lib/sync.tsx`.
- **Næring:** `src/lib/nutrition.ts` (grove anslag per råvare, ukesbalanse).
- **Inspo:** `src/data/inspo.ts` (id fra 1000 og oppover).

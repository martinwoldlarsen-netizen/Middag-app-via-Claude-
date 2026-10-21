import { STARTER_MEALS, type Meal } from '@/data/meals';

// Inspo: et ferdig bibliotek med norske hverdagsmiddager og Oda-oppskrifter, hentet
// fra den gamle nettsiden. Mengdene gjelder for fire personer. Id-ene starter på 1000
// så de aldri kolliderer med de faste middagene.
const LIBRARY: Meal[] = [
  {
    "id": 1003,
    "name": "Laksepasta",
    "emoji": "🐟",
    "description": "Rask og deilig pasta med laksefilet i fløtesaus med dill.",
    "timeMinutes": 25,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Pasta",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Pasta penne",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Laksefilet",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Matfløte",
        "quantity": 200,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Hvitløk",
        "quantity": 2,
        "unit": "fedd",
        "section": "Frukt & grønt"
      },
      {
        "name": "Frisk dill",
        "quantity": 0.5,
        "unit": "bunt",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sitron",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok pastaen al dente etter anvisning på pakken.",
      "Skjær laksefileten i terninger og finhakk hvitløken.",
      "Fres hvitløken blank i litt olje, tilsett laksen og stek til den nesten er gjennomstekt.",
      "Hell i matfløten og la det småkoke til en tykk saus.",
      "Vend inn pastaen, smak til med sitron, salt og pepper, og dryss over frisk dill."
    ]
  },
  {
    "id": 1004,
    "name": "Pizza Margherita",
    "emoji": "🍕",
    "description": "Hjemmelaget pizza med sprø bunn, tomatsaus og frisk mozzarella.",
    "timeMinutes": 40,
    "priceLevel": 1,
    "category": "Pizza",
    "tags": [
      "Vegetar",
      "Hverdags",
      "Barn"
    ],
    "ingredients": [
      {
        "name": "Pizzamel (tipo 00)",
        "quantity": 500,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Mozzarella",
        "quantity": 250,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Hermetiske tomater",
        "quantity": 1,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Frisk basilikum",
        "quantity": 1,
        "unit": "potte",
        "section": "Frukt & grønt"
      },
      {
        "name": "Gjær",
        "quantity": 1,
        "unit": "pakke",
        "section": "Bakeri"
      },
      {
        "name": "Olivenolje",
        "quantity": 3,
        "unit": "ss",
        "section": "Krydder & sauser"
      }
    ],
    "steps": [
      "Rør ut gjæren i lunkent vann, tilsett mel og olivenolje, og elt til en smidig deig. La den heve i minst 1 time.",
      "Kjør de hermetiske tomatene til en enkel saus og smak til med salt.",
      "Kjevle ut deigen tynt og legg den på et bakepapir.",
      "Fordel tomatsaus over bunnen og legg på revet mozzarella.",
      "Stek pizzaen på høyeste temperatur til bunnen er sprø og osten bobler.",
      "Topp med frisk basilikum før servering."
    ]
  },
  {
    "id": 1005,
    "name": "Kyllingsuppe",
    "emoji": "🍲",
    "description": "Varm og næringsrik kyllingsuppe med rotgrønnsaker – perfekt til høst og vinter.",
    "timeMinutes": 50,
    "priceLevel": 1,
    "category": "Suppe",
    "tags": [
      "Kylling",
      "Suppe",
      "Langtids",
      "Kos"
    ],
    "ingredients": [
      {
        "name": "Hel kylling",
        "quantity": 1,
        "unit": "stk",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Gulrot",
        "quantity": 3,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sellerirot",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Løk",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Persillerot",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Suppenudelr",
        "quantity": 200,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Frisk persille",
        "quantity": 0.5,
        "unit": "bunt",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Legg hel kylling i en stor gryte, dekk med vann og kok opp. Skum av.",
      "Tilsett grovt oppkuttet gulrot, sellerirot, persillerot og løk, og la det trekke i ca. 40 minutter.",
      "Ta ut kyllingen, plukk kjøttet av beina og skjær det i biter.",
      "Sil kraften og ha grønnsakene og kyllingkjøttet tilbake i gryta.",
      "Kok opp igjen, tilsett suppenudler og la dem koke møre.",
      "Smak til med salt og pepper og dryss over frisk persille."
    ]
  },
  {
    "id": 1006,
    "name": "Biff med potet",
    "emoji": "🥩",
    "description": "Saftig entrecôte med hjemmelaget béarnaisesaus, ovnsstekte poteter og grønn salat.",
    "timeMinutes": 30,
    "priceLevel": 3,
    "category": "Kjøtt",
    "tags": [
      "Kjøtt",
      "Helg",
      "Fest"
    ],
    "ingredients": [
      {
        "name": "Entrecôte",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Poteter",
        "quantity": 800,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Béarnaisesaus (ferdig)",
        "quantity": 1,
        "unit": "pakke",
        "section": "Krydder & sauser"
      },
      {
        "name": "Smør",
        "quantity": 50,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Ruccola",
        "quantity": 1,
        "unit": "pose",
        "section": "Frukt & grønt"
      },
      {
        "name": "Cherrytomater",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok potetene møre i lettsaltet vann.",
      "Ta biffene ut av kjøleskapet i god tid, og krydre dem med salt og pepper.",
      "Stek entrecôtene i smør et par minutter på hver side til ønsket stekegrad, og la dem hvile.",
      "Varm béarnaisesausen forsiktig.",
      "Server biffen med poteter, ruccola og cherrytomater, og sausen ved siden av."
    ]
  },
  {
    "id": 1007,
    "name": "Omelett",
    "emoji": "🍳",
    "description": "Enkel og mettende omelett med grønnsaker og ost – klar på 15 minutter.",
    "timeMinutes": 15,
    "priceLevel": 1,
    "category": "Egg",
    "tags": [
      "Vegetar",
      "Enkelt",
      "Barn"
    ],
    "ingredients": [
      {
        "name": "Egg",
        "quantity": 8,
        "unit": "stk",
        "section": "Meieri"
      },
      {
        "name": "Melk",
        "quantity": 100,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Revet ost",
        "quantity": 150,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sjampinjong",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Smør",
        "quantity": 30,
        "unit": "g",
        "section": "Meieri"
      }
    ],
    "steps": [
      "Visp sammen egg og melk, og smak til med salt og pepper.",
      "Skjær paprika og sjampinjong i små biter.",
      "Smelt smør i en panne og stek grønnsakene et par minutter.",
      "Hell eggeblandingen over og la omeletten stivne på svak varme.",
      "Strø revet ost over, brett omeletten sammen og server."
    ]
  },
  {
    "id": 1008,
    "name": "Fiskegrateng",
    "emoji": "🐠",
    "description": "Tradisjonsrik norsk fiskegrateng med hvit saus og makaroni – hjemmelagd komfort.",
    "timeMinutes": 60,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Kos",
      "Langtids"
    ],
    "ingredients": [
      {
        "name": "Torsk (frossen)",
        "quantity": 600,
        "unit": "g",
        "section": "Frys"
      },
      {
        "name": "Makaroni",
        "quantity": 300,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Melk",
        "quantity": 500,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Mel",
        "quantity": 4,
        "unit": "ss",
        "section": "Tørrmat"
      },
      {
        "name": "Smør",
        "quantity": 60,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Revet ost",
        "quantity": 150,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "stk",
        "section": "Meieri"
      }
    ],
    "steps": [
      "Kok makaronien etter anvisning på pakken og legg den i en smurt ildfast form.",
      "Tin torsken, skjær den i biter og fordel over makaronien.",
      "Lag en hvit saus av smør, mel og melk, og rør inn sammenvispet egg.",
      "Hell sausen over fisken og makaronien og strø revet ost på toppen.",
      "Gratiner i ovnen på 200 °C til gratengen er gyllen."
    ]
  },
  {
    "id": 1009,
    "name": "Tortellini med tomatsaus",
    "emoji": "🫙",
    "description": "Fersk ostepasta med enkel hjemmelaget tomatsaus og frisk basilikum.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Pasta",
    "tags": [
      "Vegetar",
      "Pasta",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Ostepasta (tortellini)",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Hermetiske tomater",
        "quantity": 1,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Hvitløk",
        "quantity": 2,
        "unit": "fedd",
        "section": "Frukt & grønt"
      },
      {
        "name": "Frisk basilikum",
        "quantity": 1,
        "unit": "potte",
        "section": "Frukt & grønt"
      },
      {
        "name": "Parmesan",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Olivenolje",
        "quantity": 2,
        "unit": "ss",
        "section": "Krydder & sauser"
      }
    ],
    "steps": [
      "Fres finhakket hvitløk blank i olivenolje.",
      "Tilsett de hermetiske tomatene og la sausen småkoke i 10 minutter.",
      "Kok tortellinien etter anvisning på pakken.",
      "Vend pastaen inn i tomatsausen.",
      "Smak til med salt og pepper, og server med frisk basilikum og revet parmesan."
    ]
  },
  {
    "id": 1010,
    "name": "Kyllingwok",
    "emoji": "🥢",
    "description": "Rask asiatisk wok med kylling, fargerike grønnsaker og søtlig soyasaus.",
    "timeMinutes": 35,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Kylling",
      "Asiatisk",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Kyllingfilet",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Wok-grønnsaker (blanding)",
        "quantity": 400,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Soyasaus",
        "quantity": 4,
        "unit": "ss",
        "section": "Krydder & sauser"
      },
      {
        "name": "Sesamolje",
        "quantity": 2,
        "unit": "ts",
        "section": "Krydder & sauser"
      },
      {
        "name": "Jasminris",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Ingefær",
        "quantity": 2,
        "unit": "cm",
        "section": "Frukt & grønt"
      },
      {
        "name": "Hvitløk",
        "quantity": 2,
        "unit": "fedd",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok jasminrisen etter anvisning på pakken.",
      "Skjær kyllingfileten i strimler og finhakk ingefær og hvitløk.",
      "Stek kyllingen i sesamolje i en varm wok til den er gjennomstekt.",
      "Tilsett ingefær, hvitløk og wok-grønnsakene, og wok raskt til grønnsakene er sprøkokte.",
      "Smak til med soyasaus og server over risen."
    ]
  },
  {
    "id": 1012,
    "name": "Kjøttboller i saus",
    "emoji": "🍖",
    "description": "Svenske-inspirerte kjøttboller i brun saus med potetmos og tyttebær.",
    "timeMinutes": 40,
    "priceLevel": 2,
    "category": "Kjøtt",
    "tags": [
      "Kjøtt",
      "Kos",
      "Barn"
    ],
    "ingredients": [
      {
        "name": "Kjøttdeig (blandet)",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Egg",
        "quantity": 1,
        "unit": "stk",
        "section": "Meieri"
      },
      {
        "name": "Strøbrød",
        "quantity": 60,
        "unit": "g",
        "section": "Bakeri"
      },
      {
        "name": "Poteter",
        "quantity": 800,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Fløte",
        "quantity": 100,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Brun saus (pose)",
        "quantity": 1,
        "unit": "pose",
        "section": "Krydder & sauser"
      },
      {
        "name": "Tyttebærsyltetøy",
        "quantity": 1,
        "unit": "glass",
        "section": "Tørrmat"
      }
    ],
    "steps": [
      "Bland kjøttdeig med egg, strøbrød, salt og pepper, og trill til boller.",
      "Brun kjøttbollene i smør i en panne.",
      "Rør ut brun saus etter anvisning på posen og tilsett litt fløte.",
      "La kjøttbollene trekke i sausen i 10 minutter.",
      "Kok potetene møre.",
      "Server med poteter, saus og tyttebærsyltetøy."
    ]
  },
  {
    "id": 1013,
    "name": "Grønnsakssuppe",
    "emoji": "🥦",
    "description": "Sunn og fargerik grønnsakssuppe – enkel å lage og full av smak.",
    "timeMinutes": 45,
    "priceLevel": 1,
    "category": "Suppe",
    "tags": [
      "Vegetar",
      "Suppe",
      "Langtids",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Gulrot",
        "quantity": 3,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Brokkoli",
        "quantity": 1,
        "unit": "hode",
        "section": "Frukt & grønt"
      },
      {
        "name": "Blomkål",
        "quantity": 0.5,
        "unit": "hode",
        "section": "Frukt & grønt"
      },
      {
        "name": "Løk",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Poteter",
        "quantity": 400,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Grønnsaksbuljong",
        "quantity": 1,
        "unit": "terning",
        "section": "Krydder & sauser"
      },
      {
        "name": "Frisk persille",
        "quantity": 0.5,
        "unit": "bunt",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Skjær gulrot, brokkoli, blomkål, løk og poteter i biter.",
      "Fres løken blank i litt smør i en gryte.",
      "Tilsett resten av grønnsakene og dekk med grønnsaksbuljong.",
      "La suppen koke til grønnsakene er møre.",
      "Smak til med salt og pepper og dryss over frisk persille."
    ]
  },
  {
    "id": 1015,
    "name": "Pølse og potetstappe",
    "emoji": "🌭",
    "description": "Norsk hverdagsklassiker med grillpølser og kremete potetstappe. Raskt og trygt!",
    "timeMinutes": 25,
    "priceLevel": 1,
    "category": "Enkelt",
    "tags": [
      "Gris",
      "Enkelt",
      "Barn",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Grillpølser",
        "quantity": 8,
        "unit": "stk",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Poteter",
        "quantity": 800,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Melk",
        "quantity": 150,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Smør",
        "quantity": 60,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Gulrot",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Skrell og kok potetene møre.",
      "Mos potetene med melk og smør til en glatt stappe, og smak til med salt.",
      "Kok eller stek grillpølsene.",
      "Kok gulrøttene møre.",
      "Server pølsene med potetstappe og gulrot."
    ]
  },
  {
    "id": 1016,
    "name": "Karbonader",
    "emoji": "🥩",
    "description": "Norske karbonader av svinekjøtt med stekt løk, kokte poteter og brun saus.",
    "timeMinutes": 35,
    "priceLevel": 2,
    "category": "Kjøtt",
    "tags": [
      "Kjøtt",
      "Gris",
      "Hverdags",
      "Kos"
    ],
    "ingredients": [
      {
        "name": "Karbonader",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Løk",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Poteter",
        "quantity": 800,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Brun saus (pose)",
        "quantity": 1,
        "unit": "pose",
        "section": "Krydder & sauser"
      },
      {
        "name": "Smør",
        "quantity": 30,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Gulrot",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Form kjøttdeigen til flate karbonader.",
      "Stek karbonadene i smør til de er gjennomstekte, og stek løken myk sammen med dem.",
      "Rør ut brun saus etter anvisning på posen.",
      "Kok potetene og gulrøttene møre.",
      "Server karbonadene med løk, saus, poteter og gulrot."
    ]
  },
  {
    "id": 1017,
    "name": "Caesar salat",
    "emoji": "🥗",
    "description": "Frisk og mettende Caesar-salat med sprøtt bacon, krutonger og klassisk dressing.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Salat",
    "tags": [
      "Kylling",
      "Salat",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Romaine salat",
        "quantity": 1,
        "unit": "hode",
        "section": "Frukt & grønt"
      },
      {
        "name": "Kyllingfilet (grillet)",
        "quantity": 400,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Bacon",
        "quantity": 150,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Caesar-dressing",
        "quantity": 1,
        "unit": "flaske",
        "section": "Krydder & sauser"
      },
      {
        "name": "Parmesan",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Krutonger",
        "quantity": 100,
        "unit": "g",
        "section": "Bakeri"
      }
    ],
    "steps": [
      "Grill eller stek kyllingfileten og skjær den i strimler.",
      "Stek baconet sprøtt og smuldre det.",
      "Riv romainesalaten i biter og legg i en bolle.",
      "Vend salaten med caesar-dressing.",
      "Topp med kylling, bacon, revet parmesan og krutonger."
    ]
  },
  {
    "id": 1018,
    "name": "Chili con carne",
    "emoji": "🌶️",
    "description": "Varm og krydret chili med kjøttdeig, kidneybønner og mais – server med ris.",
    "timeMinutes": 50,
    "priceLevel": 2,
    "category": "Meksikansk",
    "tags": [
      "Kjøtt",
      "Meksikansk",
      "Langtids",
      "Helg",
      "Fest"
    ],
    "ingredients": [
      {
        "name": "Kjøttdeig",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Kidneybønner",
        "quantity": 2,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Hermetiske tomater",
        "quantity": 2,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Chili con carne-krydder",
        "quantity": 1,
        "unit": "pose",
        "section": "Krydder & sauser"
      },
      {
        "name": "Løk",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Langkornet ris",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      }
    ],
    "steps": [
      "Finhakk løk og paprika og fres dem myke i en gryte.",
      "Tilsett kjøttdeigen og brun den godt.",
      "Rør inn chili con carne-krydder, hermetiske tomater og kidneybønner.",
      "La chilien småkoke i minst 30 minutter.",
      "Kok risen etter anvisning på pakken, og server chilien over ris."
    ]
  },
  {
    "id": 1020,
    "name": "Reker med brød",
    "emoji": "🦐",
    "description": "Ferske reker servert med nystekt brød, majones og sitron – en norsk sommerklassiker.",
    "timeMinutes": 10,
    "priceLevel": 3,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Enkelt",
      "Fest",
      "Helg"
    ],
    "ingredients": [
      {
        "name": "Ferske reker",
        "quantity": 1000,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Grovbrød",
        "quantity": 1,
        "unit": "stk",
        "section": "Bakeri"
      },
      {
        "name": "Majones",
        "quantity": 1,
        "unit": "tube",
        "section": "Krydder & sauser"
      },
      {
        "name": "Sitron",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Smør",
        "quantity": 50,
        "unit": "g",
        "section": "Meieri"
      }
    ],
    "steps": [
      "Sett frem ferske reker i et fat.",
      "Skjær grovbrød i skiver og smør på smør.",
      "Del sitronen i båter.",
      "Rør sammen en enkel rekesaus av majones og litt sitronsaft.",
      "Server rekene med brød, majones og sitron, og la alle pille selv."
    ]
  },
  {
    "id": 1021,
    "name": "Fiskesuppe",
    "emoji": "🍲",
    "description": "Kremet fiskesuppe med gulrot, purre og potet – varmende og mettende hverdagsmat.",
    "timeMinutes": 40,
    "priceLevel": 2,
    "category": "Suppe",
    "tags": [
      "Fisk",
      "Suppe",
      "Kos",
      "Langtids"
    ],
    "ingredients": [
      {
        "name": "Torskefilet",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Laksefilet",
        "quantity": 200,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Fiskekraft (terning)",
        "quantity": 2,
        "unit": "terning",
        "section": "Krydder & sauser"
      },
      {
        "name": "Purre",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Gulrot",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Poteter",
        "quantity": 300,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Matfløte",
        "quantity": 300,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Frisk dill",
        "quantity": 0.5,
        "unit": "bunt",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Skjær purre og gulrot i skiver, og skjær potetene i terninger.",
      "Kok opp fiskekraft med purre, gulrot og poteter, og la det småkoke til grønnsakene er nesten møre.",
      "Skjær torsk og laks i biter og ha dem i suppen sammen med fløten.",
      "La suppen trekke forsiktig i 5-8 minutter til fisken er gjennomstekt – ikke kok den hardt.",
      "Smak til med salt og pepper, og dryss over frisk dill før servering."
    ]
  },
  {
    "id": 1022,
    "name": "Pasta carbonara",
    "emoji": "🍝",
    "description": "Ekte italiensk pasta carbonara med sprøstekt bacon, egg og parmesan – rask og god.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Pasta",
    "tags": [
      "Gris",
      "Pasta",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Spaghetti",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Bacon",
        "quantity": 200,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Egg",
        "quantity": 4,
        "unit": "stk",
        "section": "Meieri"
      },
      {
        "name": "Parmesan",
        "quantity": 100,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Hvitløk",
        "quantity": 1,
        "unit": "fedd",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok spagettien al dente etter anvisning på pakken.",
      "Skjær baconet i terninger og stek det sprøtt i en panne sammen med finhakket hvitløk.",
      "Visp sammen egg, revet parmesan og godt med sort pepper i en bolle.",
      "Ha den nykokte, varme spagettien rett i pannen med bacon, og ta pannen av varmen.",
      "Rør raskt inn eggeblandingen slik at den blir kremet uten å stivne til eggerøre. Tilsett litt av kokevannet ved behov.",
      "Server umiddelbart med ekstra parmesan."
    ]
  },
  {
    "id": 1023,
    "name": "Kylling tikka masala",
    "emoji": "🍛",
    "description": "Krydret kyllinggryte i kremet tomatsaus, servert med ris – indisk favoritt på norske middagsbord.",
    "timeMinutes": 45,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Kylling",
      "Asiatisk",
      "Kos"
    ],
    "ingredients": [
      {
        "name": "Kyllingfilet",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Tikka masala-saus (ferdig)",
        "quantity": 1,
        "unit": "boks",
        "section": "Krydder & sauser"
      },
      {
        "name": "Hermetiske tomater",
        "quantity": 1,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Kokosmelk",
        "quantity": 1,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Løk",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Hvitløk",
        "quantity": 2,
        "unit": "fedd",
        "section": "Frukt & grønt"
      },
      {
        "name": "Ingefær",
        "quantity": 2,
        "unit": "cm",
        "section": "Frukt & grønt"
      },
      {
        "name": "Jasminris",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Naanbrød",
        "quantity": 4,
        "unit": "stk",
        "section": "Bakeri"
      }
    ],
    "steps": [
      "Skjær kyllingfileten i biter og finhakk løk, hvitløk og ingefær.",
      "Brun kyllingen i en gryte og ta den ut.",
      "Fres løk, hvitløk og ingefær myke i samme gryte.",
      "Tilsett tikka masala-saus, hermetiske tomater og kokosmelk, og kok opp.",
      "Ha kyllingen tilbake i gryta og la den trekke i sausen i 15-20 minutter.",
      "Kok jasminrisen etter anvisning på pakken og varm naanbrødet.",
      "Server kyllinggryta over ris med naanbrød ved siden av."
    ]
  },
  {
    "id": 1024,
    "name": "Lammegryte",
    "emoji": "🍖",
    "description": "Langtidskokt lammegryte med rotgrønnsaker og rosmarin – mør og fyldig søndagsmat.",
    "timeMinutes": 100,
    "priceLevel": 3,
    "category": "Kjøtt",
    "tags": [
      "Kjøtt",
      "Langtids",
      "Helg",
      "Kos"
    ],
    "ingredients": [
      {
        "name": "Lammebog i terninger",
        "quantity": 800,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Poteter",
        "quantity": 600,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Gulrot",
        "quantity": 3,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Kålrot",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Løk",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Kjøttbuljong (terning)",
        "quantity": 2,
        "unit": "terning",
        "section": "Krydder & sauser"
      },
      {
        "name": "Frisk rosmarin",
        "quantity": 1,
        "unit": "kvast",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Brun lammekjøttet godt i en gryte i flere omganger, og ta det ut.",
      "Fres løk i samme gryte til den er blank.",
      "Ha lammekjøttet tilbake i gryta, dekk med vann og buljong, og kok opp.",
      "La gryta småkoke tildekket i ca. 1,5 time til kjøttet er mørt.",
      "Skjær poteter, gulrot og kålrot i grove biter og ha dem i gryta de siste 30 minuttene.",
      "Tilsett frisk rosmarin, smak til med salt og pepper, og server varmt."
    ]
  },
  {
    "id": 1025,
    "name": "Bacalao",
    "emoji": "🐟",
    "description": "Norsk-portugisisk klassiker med klippfisk, tomater, poteter og oliven.",
    "timeMinutes": 55,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Langtids",
      "Helg"
    ],
    "ingredients": [
      {
        "name": "Utvannet klippfisk",
        "quantity": 800,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Poteter",
        "quantity": 600,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Løk",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Hermetiske tomater",
        "quantity": 2,
        "unit": "boks",
        "section": "Tørrmat"
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sorte oliven",
        "quantity": 100,
        "unit": "g",
        "section": "Krydder & sauser"
      },
      {
        "name": "Olivenolje",
        "quantity": 4,
        "unit": "ss",
        "section": "Krydder & sauser"
      },
      {
        "name": "Hvitløk",
        "quantity": 3,
        "unit": "fedd",
        "section": "Frukt & grønt"
      },
      {
        "name": "Chili",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Skjær poteter i skiver og løk i ringer.",
      "Fres løk, hvitløk og chili i olivenolje i en stor gryte eller ildfast form.",
      "Tilsett hermetiske tomater og la sausen småkoke i 10 minutter.",
      "Legg lag av potetskiver og utvannet klippfisk i sausen.",
      "La det hele trekke tildekket på svak varme i 25-30 minutter til fisken og potetene er møre.",
      "Strø over paprika og sorte oliven, og la det trekke 5 minutter til før servering."
    ]
  },
  {
    "id": 1026,
    "name": "Rask kremet kyllingpanne med parmesan og pasta",
    "emoji": "🍝",
    "description": "Rask kremet kyllingpanne med parmesan, babyspinat og pasta – ferdig på 20 minutter.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Pasta",
    "tags": [
      "Kylling",
      "Pasta",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Tagliatelle (fersk)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Kyllingfilet",
        "quantity": 400,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Babyspinat",
        "quantity": 100,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Fløte",
        "quantity": 300,
        "unit": "ml",
        "section": "Meieri"
      },
      {
        "name": "Paprikapulver",
        "quantity": 2,
        "unit": "ts",
        "section": "Krydder & sauser"
      }
    ],
    "steps": [
      "Kok pastaen etter anvisning på pakken i saltet vann.",
      "Klapp kyllingskivene tørre og krydre med salt, pepper og paprikapulver. Stek i olje på middels-høy varme i 1-2 minutter per side, og ta ut av pannen.",
      "Skru ned varmen, ha fløte og parmesan i samme panne, og la det småkoke til sausen tykner litt.",
      "Tilsett babyspinat og la det falle sammen. Ha kyllingen tilbake i pannen og smak til.",
      "Vend inn den kokte pastaen og server rett fra pannen."
    ]
  },
  {
    "id": 1027,
    "name": "Laks med basilikum og kremet brokkolipasta",
    "emoji": "🐟",
    "description": "Stekt laks med frisk basilikum og lime, servert over kremet brokkolipasta.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Pasta",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Spaghetti",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Brokkoli",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Crème fraîche",
        "quantity": 2,
        "unit": "dl",
        "section": "Meieri"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 50,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Frisk basilikum",
        "quantity": 20,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Lime",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Laksefilet",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      }
    ],
    "steps": [
      "Kok pastaen etter anvisning på pakken, og ha i brokkolibukettene de siste 30 sekundene. Sil av og spar litt kokevann.",
      "Rør sammen crème fraîche, finhakket basilikum, limeskall og parmesan i gryta. Juster konsistensen med kokevann og smak til med salt og pepper. Vend inn pasta og brokkoli.",
      "Del laksefileten i porsjoner og krydre med salt og pepper.",
      "Legg laksen med skinnsiden ned i en kald panne med olje, skru opp varmen og stek i ca. 2 minutter.",
      "Snu laksen, dryss over limeskall og basilikum, og stek ferdig.",
      "Server laksen på den kremete brokkolipastaen."
    ]
  },
  {
    "id": 1028,
    "name": "Sommerfuglpasta med erter og parmesan",
    "emoji": "🍝",
    "description": "Sommerfuglpasta med kremet ertepuré, parmesan og sprøstekt spekesalami.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Pasta",
    "tags": [
      "Gris",
      "Pasta",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Sommerfuglpasta (farfalle)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Frosne erter",
        "quantity": 300,
        "unit": "g",
        "section": "Frys"
      },
      {
        "name": "Kyllingbuljong",
        "quantity": 0.5,
        "unit": "dl",
        "section": "Krydder & sauser"
      },
      {
        "name": "Smør",
        "quantity": 1,
        "unit": "ts",
        "section": "Meieri"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Spekesalami",
        "quantity": 130,
        "unit": "g",
        "section": "Kjøtt & fisk"
      }
    ],
    "steps": [
      "Kok pastaen etter anvisning på pakken i saltet vann.",
      "Kok opp erter og kyllingbuljong i en kjele, og la det syde 1-2 minutter.",
      "Ha smør, parmesan, buljongen og halvparten av ertene i en blender og kjør til en jevn puré. Smak til med salt og pepper.",
      "Skjær salamien i strimler og stek den sprø i en panne på middels-høy varme i 2-3 minutter.",
      "Sil av pastaen og vend den med ertepuré, salami og resten av ertene. Topp med ekstra parmesan."
    ]
  },
  {
    "id": 1029,
    "name": "Rask soppcarbonara",
    "emoji": "🍝",
    "description": "Vegetarisk carbonara med ovnsstekt sopp i stedet for bacon – kremet og rask.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Pasta",
    "tags": [
      "Vegetar",
      "Pasta",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Tagliatelle (fersk)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Sjampinjong",
        "quantity": 400,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "stk",
        "section": "Meieri"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 150,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Frisk bladpersille",
        "quantity": 1,
        "unit": "håndfull",
        "section": "Frukt & grønt"
      },
      {
        "name": "Olivenolje",
        "quantity": 2,
        "unit": "ss",
        "section": "Krydder & sauser"
      }
    ],
    "steps": [
      "Sett ovnen på 215°C varmluft. Rens og skjær sjampinjongene i skiver, legg dem på en bakepapirkledd stekeplate, dryss over olivenolje og salt, og stek i ca. 15 minutter.",
      "Kok pastaen etter anvisning på pakken i saltet vann. Visp sammen egg, revet parmesan, salt og pepper i en bolle.",
      "Sil av pastaen, spar 1 dl kokevann. Ha pastaen tilbake i gryta sammen med eggeblandingen og den ovnsstekte soppen.",
      "Rør godt sammen og tynn ut med kokevann til ønsket konsistens. Smak til med salt og pepper, og dryss over frisk bladpersille."
    ]
  },
  {
    "id": 1030,
    "name": "Blomkålsuppe med krydderstekte kikerter",
    "emoji": "🍲",
    "description": "Kremet blomkålsuppe toppet med sprøstekte, krydrede kikerter.",
    "timeMinutes": 25,
    "priceLevel": 1,
    "category": "Suppe",
    "tags": [
      "Vegetar",
      "Suppe",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Blomkål",
        "quantity": 1,
        "unit": "hode",
        "section": "Frukt & grønt"
      },
      {
        "name": "Helmelk",
        "quantity": 6,
        "unit": "dl",
        "section": "Meieri"
      },
      {
        "name": "Grønnsaksbuljong",
        "quantity": 1,
        "unit": "ss",
        "section": "Krydder & sauser"
      },
      {
        "name": "Muskatnøtt (malt)",
        "quantity": 0.5,
        "unit": "ts",
        "section": "Krydder & sauser"
      },
      {
        "name": "Crème fraîche",
        "quantity": 2,
        "unit": "dl",
        "section": "Meieri"
      },
      {
        "name": "Kikerter (hermetiske)",
        "quantity": 410,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Tacokrydder",
        "quantity": 1,
        "unit": "ts",
        "section": "Krydder & sauser"
      },
      {
        "name": "Frisk persille",
        "quantity": 10,
        "unit": "g",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Del blomkålen i mindre biter (ta gjerne med de lyse bladene også).",
      "Ha blomkål, melk, buljong og vann i en gryte og la det småkoke forsiktig i ca. 5 minutter uten å koke melken hardt.",
      "Ta gryta av varmen, rør inn crème fraîche og kjør suppen glatt med stavmikser. Smak til med muskat, salt og pepper.",
      "Skyll og la kikertene renne av seg godt, og klapp dem tørre.",
      "Stek kikertene med tacokrydder i olje på middels-høy varme i 2-3 minutter.",
      "Server suppen varm med de krydderstekte kikertene og hakket persille på toppen."
    ]
  },
  {
    "id": 1031,
    "name": "Rask thai nudelsalat",
    "emoji": "🍜",
    "description": "Frisk og rask thai-inspirert nudelsalat med eple, ingefær og peanøtter.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Vegetar",
      "Asiatisk",
      "Salat",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Eggnudler",
        "quantity": 250,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Grønnsaksblanding (rå)",
        "quantity": 225,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Grønt eple",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Frisk ingefær",
        "quantity": 2,
        "unit": "ss",
        "section": "Frukt & grønt"
      },
      {
        "name": "Lime",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Ketjap manis",
        "quantity": 1,
        "unit": "dl",
        "section": "Krydder & sauser"
      },
      {
        "name": "Harissa (eller tabasco)",
        "quantity": 1,
        "unit": "ts",
        "section": "Krydder & sauser"
      },
      {
        "name": "Frisk koriander",
        "quantity": 20,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sprøstekt løk",
        "quantity": 4,
        "unit": "ss",
        "section": "Krydder & sauser"
      },
      {
        "name": "Saltede peanøtter",
        "quantity": 50,
        "unit": "g",
        "section": "Tørrmat"
      }
    ],
    "steps": [
      "Kok nudlene etter anvisning på pakken, skyll i kaldt vann og sil av.",
      "Skrell og riv ingefær og limeskall. Rør sammen med ketjap manis, harissa og limesaft til en dressing.",
      "Vend den rå grønnsaksblandingen med dressingen i en bolle.",
      "Skjær eplet i tynne staver og vend eple og nudler inn i grønnsaksblandingen.",
      "Ha salaten over i en serveringsskål, og topp med hakket koriander, peanøtter og sprøstekt løk."
    ]
  },
  {
    "id": 1032,
    "name": "Falafelwrap med avokadohummus",
    "emoji": "🌯",
    "description": "Fargerike falafelwraps med kremet avokadohummus og friske grønnsaker.",
    "timeMinutes": 20,
    "priceLevel": 3,
    "category": "Annet",
    "tags": [
      "Vegetar",
      "Barn",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Ferdig falafel",
        "quantity": 600,
        "unit": "g",
        "section": "Frys"
      },
      {
        "name": "Tortillalefser",
        "quantity": 8,
        "unit": "stk",
        "section": "Bakeri"
      },
      {
        "name": "Avokado",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Tahini",
        "quantity": 1,
        "unit": "ts",
        "section": "Krydder & sauser"
      },
      {
        "name": "Kikerter (hermetiske)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Hvitløk",
        "quantity": 2,
        "unit": "fedd",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sitron",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Olivenolje",
        "quantity": 0.5,
        "unit": "dl",
        "section": "Krydder & sauser"
      },
      {
        "name": "Ruccola",
        "quantity": 70,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Agurk",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Tomat",
        "quantity": 2,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Rødløk",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Varm tortillalefser og falafel etter anvisning på pakken. Skyll kikertene og la dem renne godt av seg.",
      "Kjør hvitløk, kikerter, avokado, sitronsaft, olivenolje og tahini glatt i en blender til hummus. Smak til med salt.",
      "Skjær agurk, tomat og rødløk i biter, og skyll rødløken grundig i kaldt vann.",
      "Fordel ruccola, falafel og avokadohummus på de varme lefsene sammen med grønnsakene.",
      "Rull sammen og server de fargerike falafelwrapsene."
    ]
  },
  {
    "id": 1033,
    "name": "Rask kremet kokoscurry med laks",
    "emoji": "🍛",
    "description": "Kremet kokoscurry med stekt laks, rød karripasta og frisk basilikum.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Fisk",
      "Asiatisk",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Basmatiris",
        "quantity": 250,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Laksefilet (uten skinn)",
        "quantity": 500,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Kokosmelk",
        "quantity": 400,
        "unit": "ml",
        "section": "Tørrmat"
      },
      {
        "name": "Rød karripasta",
        "quantity": 2,
        "unit": "ss",
        "section": "Krydder & sauser"
      },
      {
        "name": "Frisk basilikum",
        "quantity": 1,
        "unit": "håndfull",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sitron",
        "quantity": 0.25,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok risen etter anvisning på pakken.",
      "Krydre laksefileten med salt og pepper på begge sider, og stek den i olje i en panne på middels-høy varme i ca. 2 minutter per side. Ta ut av pannen.",
      "Ha karripastaen i pannen og rør rundt kort. Hell i kokosmelken, kok opp og la det småkoke i ca. 2 minutter til det tykner.",
      "Skru ned varmen, tilsett basilikum og litt sitronsaft, og rør godt sammen.",
      "Ha laksen tilbake i pannen, øs saus over, og la den trekke ferdig et par minutter før servering med ris."
    ]
  },
  {
    "id": 1034,
    "name": "Sprø lakseburger med grønnsaksslaw",
    "emoji": "🍔",
    "description": "Sprøstekte lakseburgere i brød med frisk grønnsaksslaw.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Rødkål",
        "quantity": 150,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sylteagurk",
        "quantity": 50,
        "unit": "g",
        "section": "Krydder & sauser"
      },
      {
        "name": "Crème fraîche",
        "quantity": 5,
        "unit": "ss",
        "section": "Meieri"
      },
      {
        "name": "Grønnsaksblanding (rå)",
        "quantity": 225,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Lakseburgere (rå)",
        "quantity": 4,
        "unit": "stk",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Semulegryn",
        "quantity": 4,
        "unit": "ss",
        "section": "Tørrmat"
      },
      {
        "name": "Ruccola",
        "quantity": 70,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Hamburgerbrød",
        "quantity": 4,
        "unit": "stk",
        "section": "Bakeri"
      }
    ],
    "steps": [
      "Skjær rødkål i strimler og sylteagurk i biter. Bland med crème fraîche og rå grønnsaksblanding, og smak til med salt.",
      "Krydre lakseburgerne lett med salt og pepper, og vend dem i semulegryn på begge sider.",
      "Stek burgerne i olje på middels varme i ca. 2 minutter per side – de blir ferdige av ettervarmen, så ikke stek dem for lenge.",
      "Rist hamburgerbrødene raskt i en tørr panne.",
      "Smør slaw på det nederste brødet, legg på ruccola, burger og toppen av brødet.",
      "Server med resten av grønnsaksslawen ved siden av."
    ]
  },
  {
    "id": 1035,
    "name": "Fiskepinner i wraps",
    "emoji": "🌯",
    "description": "Sprø fiskepinner i wraps med sukkererter, cherrytomater og hjemmelaget dillrømme.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Fisk",
    "tags": [
      "Fisk",
      "Barn",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Romanosalat",
        "quantity": 1,
        "unit": "hode",
        "section": "Frukt & grønt"
      },
      {
        "name": "Fiskepinner (frosne)",
        "quantity": 600,
        "unit": "g",
        "section": "Frys"
      },
      {
        "name": "Tortillalefser",
        "quantity": 8,
        "unit": "stk",
        "section": "Bakeri"
      },
      {
        "name": "Agurk",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sukkererter",
        "quantity": 150,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Cherrytomater",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Rømme",
        "quantity": 3,
        "unit": "dl",
        "section": "Meieri"
      },
      {
        "name": "Frisk dill",
        "quantity": 20,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Sukker",
        "quantity": 1,
        "unit": "ts",
        "section": "Tørrmat"
      },
      {
        "name": "Sitron",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Stek fiskepinnene og varm tortillalefsene etter anvisning på pakken.",
      "Damp sukkererter og del dem i to. Skjær agurk i staver og del cherrytomatene i kvarte. Del opp romanosalaten i blader.",
      "Rør sammen rømme, hakket dill, sukker og sitronsaft til en dilldressing. Smak til med salt og pepper.",
      "Server de varme fiskepinnene i wraps, og sett grønnsaker og dressing på bordet slik at alle kan fylle sin egen wrap."
    ]
  },
  {
    "id": 1036,
    "name": "Raske kyllinglår med potetmos, peppersaus og brokkoli",
    "emoji": "🍗",
    "description": "Ovnsstekte kyllinglår med kremet potetmos, peppersaus og dampet brokkoli.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Kjøtt",
    "tags": [
      "Kylling",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Potetmos (fersk)",
        "quantity": 500,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Kyllinglår",
        "quantity": 850,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Peppersaus (ferdig)",
        "quantity": 250,
        "unit": "ml",
        "section": "Krydder & sauser"
      },
      {
        "name": "Brokkoli",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Sett ovnen på 200°C. Legg kyllinglårene på rist med bakepapir under, og stek i ca. 15 minutter.",
      "Varm potetmos og peppersaus etter anvisning på pakken.",
      "Del brokkolien i små buketter, kok opp saltet vann og kok brokkolien i 2-3 minutter til den er mør med litt tyggemotstand.",
      "Server kyllinglårene med potetmos, peppersaus og brokkoli."
    ]
  },
  {
    "id": 1037,
    "name": "Rask tikka masala med kylling",
    "emoji": "🍛",
    "description": "Rask og kremet tikka masala med kylling, servert med ris og frisk koriander.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Kylling",
      "Asiatisk",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Ris (porsjonspose)",
        "quantity": 2,
        "unit": "stk",
        "section": "Tørrmat"
      },
      {
        "name": "Kyllingfilet",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Tikka masala-saus (ferdig)",
        "quantity": 1,
        "unit": "pose",
        "section": "Krydder & sauser"
      },
      {
        "name": "Crème fraîche",
        "quantity": 2,
        "unit": "dl",
        "section": "Meieri"
      },
      {
        "name": "Frisk koriander",
        "quantity": 20,
        "unit": "g",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok risen etter anvisning på pakken.",
      "Skjær kyllingen i passe biter og stek i panne til den er lett gjennomstekt. Tilsett tikka masala-sausen og rør godt sammen.",
      "Vend inn crème fraîche og la det småkoke til kyllingen er gjennomstekt.",
      "Dryss over frisk koriander og server med ris."
    ]
  },
  {
    "id": 1038,
    "name": "Rask sopprisotto med kylling og tomat",
    "emoji": "🍚",
    "description": "Kremet sopprisotto med stekt kylling og varme cherrytomater.",
    "timeMinutes": 20,
    "priceLevel": 2,
    "category": "Annet",
    "tags": [
      "Kylling",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Kyllingfilet",
        "quantity": 2,
        "unit": "stk",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Risottoris med sopp (ferdigblanding)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      },
      {
        "name": "Cherrytomater",
        "quantity": 200,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Smør",
        "quantity": 4,
        "unit": "ss",
        "section": "Meieri"
      }
    ],
    "steps": [
      "Lag risottoen etter anvisning på pakken.",
      "Klapp kyllingfiletene tørre og krydre med salt, pepper og paprika. Stek i smør på høy varme i noen minutter per side, skru så ned varmen og la dem bli ferdig tildekket i 7-8 minutter. Ha i cherrytomatene mot slutten.",
      "Rør smør og parmesan inn i den ferdige risottoen.",
      "Server sopprisottoen med kyllingen og de varme tomatene."
    ]
  },
  {
    "id": 1039,
    "name": "Rask butter chicken med kyllingkjøttboller",
    "emoji": "🍛",
    "description": "Rask butter chicken med møre kyllingkjøttboller, ris og naanbrød.",
    "timeMinutes": 15,
    "priceLevel": 2,
    "category": "Asiatisk",
    "tags": [
      "Kylling",
      "Asiatisk",
      "Hverdags",
      "Enkelt"
    ],
    "ingredients": [
      {
        "name": "Kyllingkjøttboller (ferske)",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Butter chicken-saus (ferdig)",
        "quantity": 1,
        "unit": "pose",
        "section": "Krydder & sauser"
      },
      {
        "name": "Ris (porsjonspose)",
        "quantity": 1,
        "unit": "stk",
        "section": "Tørrmat"
      },
      {
        "name": "Naanbrød",
        "quantity": 4,
        "unit": "stk",
        "section": "Bakeri"
      },
      {
        "name": "Frisk koriander",
        "quantity": 1,
        "unit": "håndfull",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Kok ris og varm naanbrød etter anvisning på pakken.",
      "Varm kyllingkjøttbollene i en panne med litt olje, tilsett sausen og la det trekke sammen til det er varmt gjennom.",
      "Server butter chicken med ris og naanbrød, og dryss over frisk koriander."
    ]
  },
  {
    "id": 1040,
    "name": "Lapskaus",
    "emoji": "🍲",
    "description": "Enkel og god lapskaus med pølse, poteter og rotgrønnsaker – norsk husmannskost.",
    "timeMinutes": 20,
    "priceLevel": 1,
    "category": "Suppe",
    "tags": [
      "Kjøtt",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Gulrot",
        "quantity": 4,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Kjøttpølse",
        "quantity": 450,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Kålrot",
        "quantity": 0.5,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Purre",
        "quantity": 1,
        "unit": "stk",
        "section": "Frukt & grønt"
      },
      {
        "name": "Kjøttbuljong",
        "quantity": 8,
        "unit": "dl",
        "section": "Krydder & sauser"
      },
      {
        "name": "Småpoteter med skall",
        "quantity": 500,
        "unit": "g",
        "section": "Frukt & grønt"
      }
    ],
    "steps": [
      "Vask, rens og skjær gulrot, poteter og kålrot i passe biter.",
      "Ha grønnsakene i en stor gryte med buljong, fyll på med vann til det dekker, kok opp og la det småkoke til grønnsakene er møre, ca. 15-20 minutter.",
      "Skjær pølse og purre i skiver, ha i gryta og la det trekke til pølsene er varme gjennom.",
      "Smak til med salt og pepper, og server varm."
    ]
  },
  {
    "id": 1041,
    "name": "Pasta med kjøttboller i tomatsaus",
    "emoji": "🍝",
    "description": "Rask og familievennlig pasta med kjøttboller i tomatsaus, basilikum og parmesan.",
    "timeMinutes": 20,
    "priceLevel": 1,
    "category": "Pasta",
    "tags": [
      "Kjøtt",
      "Pasta",
      "Barn",
      "Enkelt",
      "Hverdags"
    ],
    "ingredients": [
      {
        "name": "Tagliatelle (fersk)",
        "quantity": 400,
        "unit": "g",
        "section": "Tørrmat"
      },
      {
        "name": "Kjøttboller i tomatsaus (ferdig)",
        "quantity": 600,
        "unit": "g",
        "section": "Kjøtt & fisk"
      },
      {
        "name": "Frisk basilikum",
        "quantity": 20,
        "unit": "g",
        "section": "Frukt & grønt"
      },
      {
        "name": "Parmesan (revet)",
        "quantity": 80,
        "unit": "g",
        "section": "Meieri"
      }
    ],
    "steps": [
      "Kok pastaen etter anvisning på pakken i saltet vann.",
      "Varm kjøttbollene i tomatsaus forsiktig i en kjele til de er varme gjennom.",
      "Topp pastaen med kjøttboller, frisk basilikum og revet parmesan."
    ]
  }
];

// Rettene som fulgte med appen (taco, lasagne …) ligger først i Inspo.
export const INSPO: Meal[] = [...STARTER_MEALS, ...LIBRARY];

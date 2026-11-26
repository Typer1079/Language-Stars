// Word lists and sounds, carried over unchanged from the original single-file app.

export const WORD_BANKS: Record<number, string[]> = {
  "1": [
    "am",
    "an",
    "at",
    "by",
    "go",
    "he",
    "hi",
    "in",
    "is",
    "it",
    "me",
    "my",
    "no",
    "of",
    "on",
    "or",
    "so",
    "to",
    "up",
    "us",
    "we"
  ],
  "2": [
    "bat",
    "cat",
    "dog",
    "sun",
    "pig",
    "hop",
    "map",
    "pen",
    "cup",
    "red",
    "box",
    "fan",
    "jet",
    "mug",
    "van",
    "fox",
    "hen",
    "jam",
    "bed",
    "top"
  ],
  "3": [
    "star",
    "frog",
    "ship",
    "duck",
    "swim",
    "drum",
    "crab",
    "tree",
    "bird",
    "fish",
    "lamp",
    "bear",
    "lion",
    "seed",
    "wind",
    "flag",
    "snow",
    "milk"
  ],
  "4": [
    "train",
    "smile",
    "plant",
    "cloud",
    "shark",
    "tiger",
    "grape",
    "stone",
    "bread",
    "chair",
    "heart",
    "house",
    "river",
    "horse",
    "light",
    "sweet"
  ],
  "5": [
    "rocket",
    "planet",
    "dragon",
    "castle",
    "dolphin",
    "rainbow",
    "monster",
    "pirate",
    "garden",
    "butter",
    "adventure",
    "treasure"
  ]
}

export const PHONICS_SOUNDS: Record<string, string> = {
  "a": "/æ/",
  "b": "/b/",
  "c": "/k/",
  "d": "/d/",
  "e": "/ɛ/",
  "f": "/f/",
  "g": "/g/",
  "h": "/h/",
  "i": "/ɪ/",
  "j": "/dʒ/",
  "k": "/k/",
  "l": "/l/",
  "m": "/m/",
  "n": "/n/",
  "o": "/ɒ/",
  "p": "/p/",
  "q": "/kw/",
  "r": "/r/",
  "s": "/s/",
  "t": "/t/",
  "u": "/ʌ/",
  "v": "/v/",
  "w": "/w/",
  "x": "/ks/",
  "y": "/j/",
  "z": "/z/"
}

/** Words speech recognition often hears instead of short target words. */
export const HOMOPHONE_VARIANTS: Record<string, string[]> = {
  "am": [
    "am",
    "em",
    "ham",
    "um",
    "uhm",
    "ahm",
    "m",
    "arm",
    "an",
    "aim",
    "im",
    "i'm",
    "yam",
    "sam",
    "pam",
    "ma'am",
    "amp",
    "and",
    "mm"
  ],
  "an": [
    "an",
    "and",
    "in",
    "ann",
    "anne",
    "am",
    "on",
    "un",
    "en",
    "end",
    "hand",
    "ant",
    "aunt",
    "n",
    "uh",
    "ah"
  ],
  "at": [
    "at",
    "cat",
    "bat",
    "hat",
    "sat",
    "out",
    "that",
    "t"
  ],
  "by": [
    "by",
    "bye",
    "buy",
    "bi"
  ],
  "go": [
    "go",
    "gold",
    "glow"
  ],
  "he": [
    "he",
    "hee"
  ],
  "hi": [
    "hi",
    "high",
    "eye"
  ],
  "in": [
    "in",
    "inn",
    "pin",
    "en"
  ],
  "is": [
    "is",
    "his",
    "s"
  ],
  "it": [
    "it",
    "eat",
    "hit",
    "eight"
  ],
  "me": [
    "me",
    "mee",
    "mi"
  ],
  "my": [
    "my",
    "maya",
    "ma",
    "mi",
    "eye",
    "might",
    "mind",
    "why",
    "m"
  ],
  "no": [
    "no",
    "know"
  ],
  "of": [
    "of",
    "off",
    "ov"
  ],
  "on": [
    "on",
    "awn"
  ],
  "or": [
    "or",
    "ore",
    "oar"
  ],
  "so": [
    "so",
    "sew",
    "sow"
  ],
  "to": [
    "to",
    "too",
    "two"
  ],
  "up": [
    "up",
    "cup"
  ],
  "us": [
    "us",
    "bus",
    "ass",
    "uhs",
    "uz",
    "os",
    "uzs",
    "uss",
    "s",
    "up",
    "as",
    "is",
    "ask",
    "ours",
    "use"
  ],
  "we": [
    "we",
    "wee"
  ]
}

/** What the coach calls a young reader when not using their name. Kept to words a browser voice says clearly. */
export const ENCOURAGING_NICKNAMES = ['Superstar', 'Super Reader', 'Reading Hero']

/** One item in a language path (Spanish or any other). */
export interface SpanishEntry {
  en: string
  /** What the learner sees: the word itself, or its romanized form (konnichiwa). */
  es: string
  /** Native script that speech recognition writes and Iris says (こんにちは); absent when it's `es`. */
  say?: string
  phonetic: string
  phraseEs: string
  phraseEn: string
  variants: string[]
}

export const SPANISH_WORD_BANKS: Record<number, SpanishEntry[]> = {
  "1": [
    {
      "en": "hello",
      "es": "hola",
      "phonetic": "OH-lah",
      "phraseEs": "¡Hola! ¿Cómo estás?",
      "phraseEn": "Hello! How are you?",
      "variants": [
        "hola",
        "ola",
        "olla",
        "hoola"
      ]
    },
    {
      "en": "yes",
      "es": "sí",
      "phonetic": "SEE",
      "phraseEs": "Sí, me gusta mucho.",
      "phraseEn": "Yes, I like it a lot.",
      "variants": [
        "si",
        "sí",
        "see",
        "sea",
        "c"
      ]
    },
    {
      "en": "no",
      "es": "no",
      "phonetic": "NOH",
      "phraseEs": "No, gracias por hoy.",
      "phraseEn": "No, thanks for today.",
      "variants": [
        "no",
        "know",
        "oh"
      ]
    },
    {
      "en": "please",
      "es": "por favor",
      "phonetic": "por fah-VOR",
      "phraseEs": "Pásame el agua, por favor.",
      "phraseEn": "Pass me the water, please.",
      "variants": [
        "por favor",
        "porfavor",
        "for favor",
        "porfa"
      ]
    },
    {
      "en": "thanks",
      "es": "gracias",
      "phonetic": "GRAH-syahs",
      "phraseEs": "Muchas gracias por ayudar.",
      "phraseEn": "Thank you very much for helping.",
      "variants": [
        "gracias",
        "gracia",
        "grassias",
        "grasias"
      ]
    },
    {
      "en": "water",
      "es": "agua",
      "phonetic": "AH-gwah",
      "phraseEs": "Quiero un vaso de agua.",
      "phraseEn": "I want a glass of water.",
      "variants": [
        "agua",
        "awa",
        "agwa",
        "aqua"
      ]
    },
    {
      "en": "house",
      "es": "casa",
      "phonetic": "KAH-sah",
      "phraseEs": "Mi casa está cerca.",
      "phraseEn": "My house is nearby.",
      "variants": [
        "casa",
        "kasa",
        "caza",
        "causa"
      ]
    },
    {
      "en": "friend",
      "es": "amigo",
      "phonetic": "ah-MEE-goh",
      "phraseEs": "Él es mi buen amigo.",
      "phraseEn": "He is my good friend.",
      "variants": [
        "amigo",
        "amiga",
        "a amigo",
        "migo"
      ]
    },
    {
      "en": "good",
      "es": "bueno",
      "phonetic": "BWAY-noh",
      "phraseEs": "Hoy es un buen día.",
      "phraseEn": "Today is a good day.",
      "variants": [
        "bueno",
        "buena",
        "weno",
        "buen"
      ]
    },
    {
      "en": "day",
      "es": "día",
      "phonetic": "DEE-ah",
      "phraseEs": "¡Que tengas un buen día!",
      "phraseEn": "Have a good day!",
      "variants": [
        "dia",
        "día",
        "dea",
        "dee ah"
      ]
    }
  ],
  "2": [
    {
      "en": "morning",
      "es": "mañana",
      "phonetic": "mah-NYAH-nah",
      "phraseEs": "Buenos días por la mañana.",
      "phraseEn": "Good morning in the morning.",
      "variants": [
        "manana",
        "mañana",
        "manyana",
        "maniana"
      ]
    },
    {
      "en": "night",
      "es": "noche",
      "phonetic": "NOH-cheh",
      "phraseEs": "Buenas noches, hasta mañana.",
      "phraseEn": "Good night, until tomorrow.",
      "variants": [
        "noche",
        "nochey",
        "notche"
      ]
    },
    {
      "en": "food",
      "es": "comida",
      "phonetic": "koh-MEE-dah",
      "phraseEs": "La comida está deliciosa.",
      "phraseEn": "The food is delicious.",
      "variants": [
        "comida",
        "komida",
        "comeda"
      ]
    },
    {
      "en": "family",
      "es": "familia",
      "phonetic": "fah-MEE-lyah",
      "phraseEs": "Paso el domingo con mi familia.",
      "phraseEn": "I spend Sunday with my family.",
      "variants": [
        "familia",
        "familja",
        "famila"
      ]
    },
    {
      "en": "book",
      "es": "libro",
      "phonetic": "LEE-broh",
      "phraseEs": "Estoy leyendo un libro nuevo.",
      "phraseEn": "I am reading a new book.",
      "variants": [
        "libro",
        "libra",
        "lebro"
      ]
    },
    {
      "en": "city",
      "es": "ciudad",
      "phonetic": "syoo-DAHD",
      "phraseEs": "Vivimos en una ciudad grande.",
      "phraseEn": "We live in a big city.",
      "variants": [
        "ciudad",
        "siudad",
        "ciuda"
      ]
    },
    {
      "en": "work",
      "es": "trabajo",
      "phonetic": "trah-BAH-hoh",
      "phraseEs": "Empiezo mi trabajo a las nueve.",
      "phraseEn": "I start my work at nine.",
      "variants": [
        "trabajo",
        "trabaho",
        "travajo"
      ]
    },
    {
      "en": "time",
      "es": "tiempo",
      "phonetic": "TYEHM-poh",
      "phraseEs": "No tenemos mucho tiempo hoy.",
      "phraseEn": "We do not have much time today.",
      "variants": [
        "tiempo",
        "tiembo",
        "tempo"
      ]
    },
    {
      "en": "money",
      "es": "dinero",
      "phonetic": "dee-NEH-roh",
      "phraseEs": "Ahorro dinero para el viaje.",
      "phraseEn": "I save money for the trip.",
      "variants": [
        "dinero",
        "dinairo",
        "denero"
      ]
    },
    {
      "en": "street",
      "es": "calle",
      "phonetic": "KAH-yeh",
      "phraseEs": "La tienda está en esta calle.",
      "phraseEn": "The store is on this street.",
      "variants": [
        "calle",
        "kaye",
        "caye",
        "callie"
      ]
    }
  ],
  "3": [
    {
      "en": "question",
      "es": "pregunta",
      "phonetic": "preh-GOON-tah",
      "phraseEs": "Tengo una pregunta importante.",
      "phraseEn": "I have an important question.",
      "variants": [
        "pregunta",
        "preguntas",
        "preguntah"
      ]
    },
    {
      "en": "answer",
      "es": "respuesta",
      "phonetic": "rehs-PWEHS-tah",
      "phraseEs": "La respuesta es muy clara.",
      "phraseEn": "The answer is very clear.",
      "variants": [
        "respuesta",
        "respuestas",
        "respwesta"
      ]
    },
    {
      "en": "journey",
      "es": "viaje",
      "phonetic": "BYAH-heh",
      "phraseEs": "El viaje en tren fue rápido.",
      "phraseEn": "The train journey was fast.",
      "variants": [
        "viaje",
        "viahe",
        "biaje"
      ]
    },
    {
      "en": "window",
      "es": "ventana",
      "phonetic": "behn-TAH-nah",
      "phraseEs": "Abre la ventana para ventilar.",
      "phraseEn": "Open the window to let air in.",
      "variants": [
        "ventana",
        "ventanna",
        "bentana"
      ]
    },
    {
      "en": "kitchen",
      "es": "cocina",
      "phonetic": "koh-SEE-nah",
      "phraseEs": "Preparamos la cena en la cocina.",
      "phraseEn": "We prepare dinner in the kitchen.",
      "variants": [
        "cocina",
        "kosina",
        "cosina"
      ]
    },
    {
      "en": "library",
      "es": "biblioteca",
      "phonetic": "bee-blyoh-TEH-kah",
      "phraseEs": "Estudio en la biblioteca del barrio.",
      "phraseEn": "I study at the neighborhood library.",
      "variants": [
        "biblioteca",
        "biblioteka",
        "biblio teca"
      ]
    },
    {
      "en": "weather",
      "es": "clima",
      "phonetic": "KLEE-mah",
      "phraseEs": "El clima está agradable esta semana.",
      "phraseEn": "The weather is pleasant this week.",
      "variants": [
        "clima",
        "klima",
        "cleema"
      ]
    },
    {
      "en": "market",
      "es": "mercado",
      "phonetic": "mehr-KAH-doh",
      "phraseEs": "Compro fruta fresca en el mercado.",
      "phraseEn": "I buy fresh fruit at the market.",
      "variants": [
        "mercado",
        "merkado",
        "mercada"
      ]
    },
    {
      "en": "neighbor",
      "es": "vecino",
      "phonetic": "beh-SEE-noh",
      "phraseEs": "Nuestro vecino saludó esta mañana.",
      "phraseEn": "Our neighbor said hello this morning.",
      "variants": [
        "vecino",
        "vecina",
        "vesino"
      ]
    },
    {
      "en": "language",
      "es": "idioma",
      "phonetic": "ee-DYOH-mah",
      "phraseEs": "Practico este idioma todos los días.",
      "phraseEn": "I practice this language every day.",
      "variants": [
        "idioma",
        "idiomas",
        "edioma"
      ]
    }
  ],
  "4": [
    {
      "en": "important",
      "es": "importante",
      "phonetic": "eem-por-TAHN-teh",
      "phraseEs": "Es importante practicar en voz alta.",
      "phraseEn": "It is important to practice out loud.",
      "variants": [
        "importante",
        "importantes",
        "importanti"
      ]
    },
    {
      "en": "different",
      "es": "diferente",
      "phonetic": "dee-feh-REHN-teh",
      "phraseEs": "Cada opción es un poco diferente.",
      "phraseEn": "Each option is a little different.",
      "variants": [
        "diferente",
        "diferentes",
        "different"
      ]
    },
    {
      "en": "restaurant",
      "es": "restaurante",
      "phonetic": "rehs-tow-RAHN-teh",
      "phraseEs": "Reservamos mesa en el restaurante.",
      "phraseEn": "We booked a table at the restaurant.",
      "variants": [
        "restaurante",
        "restaurant",
        "restaurantes"
      ]
    },
    {
      "en": "hospital",
      "es": "hospital",
      "phonetic": "ohs-pee-TAHL",
      "phraseEs": "El hospital queda a dos cuadras.",
      "phraseEn": "The hospital is two blocks away.",
      "variants": [
        "hospital",
        "hospitel",
        "ospitall"
      ]
    },
    {
      "en": "tomorrow",
      "es": "mañana",
      "phonetic": "mah-NYAH-nah",
      "phraseEs": "Nos vemos mañana por la tarde.",
      "phraseEn": "See you tomorrow afternoon.",
      "variants": [
        "manana",
        "mañana",
        "manyana"
      ]
    },
    {
      "en": "together",
      "es": "juntos",
      "phonetic": "HOON-tohs",
      "phraseEs": "Terminamos el proyecto juntos.",
      "phraseEn": "We finished the project together.",
      "variants": [
        "juntos",
        "juntas",
        "huntos"
      ]
    },
    {
      "en": "remember",
      "es": "recordar",
      "phonetic": "reh-kor-DAHR",
      "phraseEs": "Trato de recordar cada palabra nueva.",
      "phraseEn": "I try to remember every new word.",
      "variants": [
        "recordar",
        "recordars",
        "recuerdar"
      ]
    },
    {
      "en": "understand",
      "es": "entender",
      "phonetic": "ehn-tehn-DEHR",
      "phraseEs": "Ya puedo entender más en español.",
      "phraseEn": "I can already understand more in Spanish.",
      "variants": [
        "entender",
        "entenders",
        "entendo"
      ]
    },
    {
      "en": "airplane",
      "es": "avión",
      "phonetic": "ah-BYOHN",
      "phraseEs": "Nuestro avión despega en una hora.",
      "phraseEn": "Our airplane takes off in one hour.",
      "variants": [
        "avion",
        "avión",
        "abion",
        "avionn"
      ]
    },
    {
      "en": "mountain",
      "es": "montaña",
      "phonetic": "mohn-TAH-nyah",
      "phraseEs": "Subimos hasta la cima de la montaña.",
      "phraseEn": "We climbed to the top of the mountain.",
      "variants": [
        "montana",
        "montaña",
        "montanya"
      ]
    }
  ],
  "5": [
    {
      "en": "opportunity",
      "es": "oportunidad",
      "phonetic": "oh-por-too-nee-DAHD",
      "phraseEs": "Aprovecho cada oportunidad para hablar.",
      "phraseEn": "I take advantage of every opportunity to speak.",
      "variants": [
        "oportunidad",
        "oportunidades",
        "oportuni dad"
      ]
    },
    {
      "en": "experience",
      "es": "experiencia",
      "phonetic": "ehks-peh-RYEHN-syah",
      "phraseEs": "Fue una experiencia inolvidable.",
      "phraseEn": "It was an unforgettable experience.",
      "variants": [
        "experiencia",
        "experiencias",
        "esperiencia"
      ]
    },
    {
      "en": "environment",
      "es": "ambiente",
      "phonetic": "ahm-BYEHN-teh",
      "phraseEs": "Cuidamos el ambiente en nuestra comunidad.",
      "phraseEn": "We care for the environment in our community.",
      "variants": [
        "ambiente",
        "ambientes",
        "ambiyente"
      ]
    },
    {
      "en": "conversation",
      "es": "conversación",
      "phonetic": "kohn-behr-sah-SYOHN",
      "phraseEs": "Tuvimos una conversación muy fluida.",
      "phraseEn": "We had a very fluent conversation.",
      "variants": [
        "conversacion",
        "conversación",
        "conversasion"
      ]
    },
    {
      "en": "knowledge",
      "es": "conocimiento",
      "phonetic": "koh-noh-see-MYEHN-toh",
      "phraseEs": "Compartir conocimiento ayuda a todos.",
      "phraseEn": "Sharing knowledge helps everyone.",
      "variants": [
        "conocimiento",
        "conocimientos",
        "conosimiento"
      ]
    },
    {
      "en": "decision",
      "es": "decisión",
      "phonetic": "deh-see-SYOHN",
      "phraseEs": "Tomamos una decisión bien pensada.",
      "phraseEn": "We made a well-thought-out decision.",
      "variants": [
        "decision",
        "decisión",
        "desision"
      ]
    },
    {
      "en": "direction",
      "es": "dirección",
      "phonetic": "dee-rehk-SYOHN",
      "phraseEs": "Caminamos en la dirección correcta.",
      "phraseEn": "We are walking in the right direction.",
      "variants": [
        "direccion",
        "dirección",
        "direcsion"
      ]
    },
    {
      "en": "celebration",
      "es": "celebración",
      "phonetic": "seh-leh-brah-SYOHN",
      "phraseEs": "La celebración reunió a toda la gente.",
      "phraseEn": "The celebration brought everyone together.",
      "variants": [
        "celebracion",
        "celebración",
        "celebrasion"
      ]
    },
    {
      "en": "challenge",
      "es": "desafío",
      "phonetic": "deh-sah-FEE-oh",
      "phraseEs": "Aprender otro idioma es un desafío divertido.",
      "phraseEn": "Learning another language is a fun challenge.",
      "variants": [
        "desafio",
        "desafío",
        "desaffio"
      ]
    },
    {
      "en": "independence",
      "es": "independencia",
      "phonetic": "een-deh-pehn-DEHN-syah",
      "phraseEs": "Ganar fluidez da mayor independencia.",
      "phraseEn": "Gaining fluency gives greater independence.",
      "variants": [
        "independencia",
        "independencias",
        "independensia"
      ]
    }
  ],
  "6": [
    {
      "en": "accomplishment",
      "es": "logro",
      "phonetic": "LOH-groh",
      "phraseEs": "Completar este nivel es un gran logro.",
      "phraseEn": "Completing this level is a great accomplishment.",
      "variants": [
        "logro",
        "logros",
        "lohgro"
      ]
    },
    {
      "en": "determination",
      "es": "determinación",
      "phonetic": "deh-tehr-mee-nah-SYOHN",
      "phraseEs": "Con determinación se superan las dudas.",
      "phraseEn": "With determination, doubts are overcome.",
      "variants": [
        "determinacion",
        "determinación",
        "determinasion"
      ]
    },
    {
      "en": "perspective",
      "es": "perspectiva",
      "phonetic": "pehrs-pehk-TEE-bah",
      "phraseEs": "Hablar otro idioma amplía tu perspectiva.",
      "phraseEn": "Speaking another language broadens your perspective.",
      "variants": [
        "perspectiva",
        "perspectivas",
        "perspektiva"
      ]
    },
    {
      "en": "understanding",
      "es": "comprensión",
      "phonetic": "kohm-prehn-SYOHN",
      "phraseEs": "La comprensión mutua fortalece los lazos.",
      "phraseEn": "Mutual understanding strengthens bonds.",
      "variants": [
        "comprension",
        "comprensión",
        "comprension"
      ]
    },
    {
      "en": "improvement",
      "es": "mejora",
      "phonetic": "meh-HOH-rah",
      "phraseEs": "Se nota una mejora constante cada semana.",
      "phraseEn": "A steady improvement is noticeable every week.",
      "variants": [
        "mejora",
        "mejoras",
        "mehora"
      ]
    }
  ]
}
export type LanguageEntry = SpanishEntry

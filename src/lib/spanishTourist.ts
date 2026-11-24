import type { SpanishEntry } from './wordBanks'

/**
 * Spanish Levels 1-6: what a traveler needs first, easiest and most useful first.
 * Phonetic hints are written for English speakers (stressed syllable in capitals).
 */
const e = (en: string, es: string, phonetic: string, phraseEs = '', phraseEn = '', variants: string[] = []): SpanishEntry =>
  ({ en, es, phonetic, phraseEs, phraseEn, variants })

export const TOURIST_LEVELS: Record<number, SpanishEntry[]> = {
  // 1. Hello, please and thank you
  1: [
    e('hello', 'hola', 'OH-lah', '¡Hola! ¿Qué tal?', 'Hi! How are you?'),
    e('thank you', 'gracias', 'GRAH-see-ahs', 'Muchas gracias.', 'Thank you very much.'),
    e('please', 'por favor', 'por fah-VOR', 'Agua, por favor.', 'Water, please.'),
    e('yes', 'sí', 'see', 'Sí, gracias.', 'Yes, thank you.', ['si']),
    e('no', 'no', 'noh', 'No, gracias.', 'No, thank you.'),
    e('goodbye', 'adiós', 'ah-dee-OHS', '¡Adiós! Hasta luego.', 'Goodbye! See you later.', ['adios']),
    e('good morning', 'buenos días', 'BWAY-nohs DEE-ahs', 'Buenos días, señora.', "Good morning, ma'am."),
    e('good night', 'buenas noches', 'BWAY-nahs NOH-chehs', 'Buenas noches a todos.', 'Good night, everyone.'),
    e('excuse me', 'perdón', 'pehr-DOHN', 'Perdón, ¿dónde está el baño?', 'Excuse me, where is the bathroom?', ['perdon', 'disculpe']),
    e("I'm sorry", 'lo siento', 'loh see-EHN-toh', 'Lo siento, no entiendo.', "I'm sorry, I don't understand."),
  ],
  // 2. Getting help
  2: [
    e("you're welcome", 'de nada', 'deh NAH-dah', 'Gracias. —De nada.', "Thanks. —You're welcome."),
    e("I don't understand", 'no entiendo', 'noh ehn-tee-EHN-doh', 'Perdón, no entiendo.', "Sorry, I don't understand."),
    e('do you speak English?', '¿habla inglés?', 'AH-blah een-GLEHS', 'Disculpe, ¿habla inglés?', 'Excuse me, do you speak English?', ['habla ingles']),
    e('where is …?', '¿dónde está?', 'DOHN-deh ehs-TAH', '¿Dónde está el hotel?', 'Where is the hotel?', ['donde esta']),
    e('the bathroom', 'el baño', 'ehl BAH-nyoh', '¿Dónde está el baño?', 'Where is the bathroom?', ['el bano', 'baño']),
    e('water', 'agua', 'AH-gwah', 'Una botella de agua, por favor.', 'A bottle of water, please.'),
    e('how much is it?', '¿cuánto cuesta?', 'KWAHN-toh KWEHS-tah', '¿Cuánto cuesta esto?', 'How much is this?', ['cuanto cuesta']),
    e('help!', '¡ayuda!', 'ah-YOO-dah', '¡Ayuda, por favor!', 'Help, please!', ['ayuda']),
    e('my name is …', 'me llamo', 'meh YAH-moh', 'Me llamo Olivia.', 'My name is Olivia.'),
    e('nice to meet you', 'mucho gusto', 'MOO-choh GOOS-toh', 'Mucho gusto, Carlos.', 'Nice to meet you, Carlos.'),
  ],
  // 3. Numbers and money
  3: [
    e('one', 'uno', 'OO-noh', 'Un café, por favor.', 'One coffee, please.'),
    e('two', 'dos', 'dohs', 'Dos boletos, por favor.', 'Two tickets, please.'),
    e('three', 'tres', 'trehs', 'Tres noches en el hotel.', 'Three nights at the hotel.'),
    e('four', 'cuatro', 'KWAH-troh', 'Una mesa para cuatro.', 'A table for four.'),
    e('five', 'cinco', 'SEEN-koh', 'Son cinco euros.', "It's five euros."),
    e('six', 'seis', 'says', 'El tren sale a las seis.', 'The train leaves at six.'),
    e('seven', 'siete', 'see-EH-teh', 'Siete días de vacaciones.', 'Seven days of vacation.'),
    e('eight', 'ocho', 'OH-choh', 'La habitación ocho.', 'Room eight.'),
    e('nine', 'nueve', 'NWEH-veh', 'El museo abre a las nueve.', 'The museum opens at nine.'),
    e('ten', 'diez', 'dee-EHS', 'Son diez dólares.', "It's ten dollars."),
  ],
  // 4. Eating out
  4: [
    e('the menu', 'el menú', 'ehl meh-NOO', 'El menú, por favor.', 'The menu, please.', ['el menu', 'la carta']),
    e('a table for two', 'una mesa para dos', 'OO-nah MEH-sah PAH-rah dohs', 'Una mesa para dos, por favor.', 'A table for two, please.'),
    e('the check, please', 'la cuenta, por favor', 'lah KWEHN-tah por fah-VOR', 'Perdón, la cuenta, por favor.', 'Excuse me, the check, please.'),
    e('I would like …', 'quisiera', 'kee-see-EH-rah', 'Quisiera un café.', 'I would like a coffee.'),
    e('coffee', 'café', 'kah-FEH', 'Un café con leche, por favor.', 'A coffee with milk, please.', ['cafe']),
    e('beer', 'cerveza', 'sehr-VEH-sah', 'Una cerveza fría, por favor.', 'A cold beer, please.'),
    e('chicken', 'pollo', 'POH-yoh', 'Quisiera el pollo.', "I'd like the chicken."),
    e('fish', 'pescado', 'pehs-KAH-doh', 'El pescado está muy rico.', 'The fish is very tasty.'),
    e('bread', 'pan', 'pahn', 'Más pan, por favor.', 'More bread, please.'),
    e("it's delicious", 'está delicioso', 'ehs-TAH deh-lee-see-OH-soh', '¡La comida está deliciosa!', 'The food is delicious!', ['esta delicioso']),
  ],
  // 5. Getting around
  5: [
    e('the hotel', 'el hotel', 'ehl oh-TEHL', 'Voy al hotel.', "I'm going to the hotel."),
    e('the airport', 'el aeropuerto', 'ehl ah-eh-roh-PWEHR-toh', 'Al aeropuerto, por favor.', 'To the airport, please.'),
    e('a taxi', 'un taxi', 'oon TAHK-see', 'Necesito un taxi.', 'I need a taxi.'),
    e('the train station', 'la estación de tren', 'lah ehs-tah-see-OHN deh trehn', '¿Dónde está la estación de tren?', 'Where is the train station?', ['la estacion de tren']),
    e('the beach', 'la playa', 'lah PLAH-yah', 'Vamos a la playa.', "Let's go to the beach."),
    e('left', 'izquierda', 'ees-kee-EHR-dah', 'Gire a la izquierda.', 'Turn left.', ['a la izquierda']),
    e('right', 'derecha', 'deh-REH-chah', 'Está a la derecha.', "It's on the right.", ['a la derecha']),
    e('straight ahead', 'todo recto', 'TOH-doh REHK-toh', 'Siga todo recto.', 'Keep going straight ahead.', ['todo derecho', 'derecho']),
    e('near', 'cerca', 'SEHR-kah', '¿Está cerca?', 'Is it near?'),
    e('far', 'lejos', 'LEH-hohs', 'No está lejos.', "It's not far."),
  ],
  // 6. Shopping, times and emergencies
  6: [
    e('the pharmacy', 'la farmacia', 'lah far-MAH-see-ah', '¿Hay una farmacia cerca?', 'Is there a pharmacy nearby?'),
    e('the hospital', 'el hospital', 'ehl ohs-pee-TAHL', 'Necesito ir al hospital.', 'I need to go to the hospital.'),
    e('the police', 'la policía', 'lah poh-lee-SEE-ah', 'Llame a la policía.', 'Call the police.', ['la policia']),
    e('open', 'abierto', 'ah-bee-EHR-toh', '¿Está abierto hoy?', 'Is it open today?'),
    e('closed', 'cerrado', 'seh-RRAH-doh', 'La tienda está cerrada.', 'The store is closed.'),
    e('the ticket', 'el boleto', 'ehl boh-LEH-toh', 'Un boleto para Madrid.', 'A ticket to Madrid.', ['el billete', 'el tiquete']),
    e('credit card', 'tarjeta de crédito', 'tar-HEH-tah deh KREH-dee-toh', '¿Puedo pagar con tarjeta de crédito?', 'Can I pay by credit card?', ['tarjeta de credito']),
    e('cash', 'efectivo', 'eh-fehk-TEE-voh', 'Solo tengo efectivo.', 'I only have cash.'),
    e('today', 'hoy', 'oy', '¿Qué hacemos hoy?', 'What are we doing today?'),
    e('tomorrow', 'mañana', 'mah-NYAH-nah', 'Hasta mañana.', 'See you tomorrow.', ['manana']),
  ],
}

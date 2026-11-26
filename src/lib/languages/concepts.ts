/**
 * The English side of every new language path: 30 levels of 10 items, from travel basics to
 * everyday sentences. Each language file translates these in the same order (see parse.ts).
 * "{lang}" is replaced with the language's name ("I'm learning French").
 */
export interface LevelTheme {
  stage: string
  grade: string
  what: string
  items: string[]
}

export const LANGUAGE_LEVEL_COUNT = 30

export const CONCEPTS: LevelTheme[] = [
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Hello and thank you', items: ['hello', 'thank you', 'please', 'yes', 'no', 'goodbye', 'good morning', 'good night', 'excuse me', "I'm sorry"] },
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Getting help', items: ["you're welcome", "I don't understand", 'do you speak English?', 'where is the bathroom?', 'water', 'how much is it?', 'help!', 'my name is …', 'nice to meet you', 'how are you?'] },
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Numbers 1–10', items: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] },
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Food and drink', items: ['food', 'bread', 'rice', 'coffee', 'tea', 'milk', 'fruit', 'apple', 'chicken', 'fish'] },
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Getting around', items: ['left', 'right', 'straight ahead', 'here', 'there', 'hotel', 'airport', 'train station', 'ticket', 'taxi'] },
  { stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Emergencies', items: ['doctor', 'hospital', 'police', 'pharmacy', "I'm sick", "I'm lost", 'stop!', 'wait', 'slowly, please', 'again, please'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'Family and friends', items: ['mother', 'father', 'child', 'baby', 'grandmother', 'grandfather', 'family', 'friend', 'boy', 'girl'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'Colors', items: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'orange (color)', 'purple', 'pink', 'brown'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'Animals', items: ['dog', 'cat', 'bird', 'horse', 'cow', 'pig', 'rabbit', 'mouse', 'bear', 'lion'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'The body', items: ['head', 'eye', 'ear', 'nose', 'mouth', 'hand', 'foot', 'arm', 'leg', 'hair'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'At home', items: ['house', 'door', 'window', 'table', 'chair', 'bed', 'kitchen', 'room', 'key', 'book'] },
  { stage: 'Everyday words', grade: 'Beginner (A1)', what: 'At school', items: ['school', 'teacher', 'student', 'pen', 'pencil', 'paper', 'bag', 'computer', 'class', 'homework'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Bigger numbers', items: ['eleven', 'twelve', 'fifteen', 'twenty', 'thirty', 'forty', 'fifty', 'one hundred', 'one thousand', 'zero'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Days of the week', items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'today', 'tomorrow', 'yesterday'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Time', items: ['morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'now', 'later'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Nature and weather', items: ['sun', 'moon', 'star', 'rain', 'snow', 'wind', "it's hot", "it's cold", 'tree', 'flower'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Clothes', items: ['shirt', 'pants', 'shoes', 'hat', 'dress', 'jacket', 'socks', 'glasses', 'clothes', 'umbrella'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Meals', items: ['breakfast', 'lunch', 'dinner', 'egg', 'cheese', 'soup', 'sugar', 'salt', 'meat', 'vegetables'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Places in town', items: ['city', 'store', 'restaurant', 'park', 'beach', 'bank', 'museum', 'library', 'market', 'street'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Describing words', items: ['big', 'small', 'good', 'bad', 'new', 'old', 'happy', 'sad', 'fast', 'slow'] },
  { stage: 'More words', grade: 'Beginner (A1)', what: 'Action words', items: ['to eat', 'to drink', 'to go', 'to come', 'to see', 'to speak', 'to read', 'to write', 'to sleep', 'to play'] },
  { stage: 'Useful phrases', grade: 'Beginner (A1–A2)', what: 'How I feel', items: ["I'm hungry", "I'm thirsty", "I'm tired", "I'm happy", "I'm cold", "I'm hot", 'I like it', "I don't like it", 'I love you', "I'm ready"] },
  { stage: 'Useful phrases', grade: 'Beginner (A1–A2)', what: 'Questions', items: ['what?', 'who?', 'where?', 'when?', 'why?', 'how?', 'which one?', 'how many?', 'what is this?', 'what time is it?'] },
  { stage: 'Useful phrases', grade: 'Beginner (A1–A2)', what: 'At a restaurant', items: ['the menu, please', 'the check, please', 'a table for two, please', 'I want water', "it's delicious", "I'm full", 'one more, please', 'no ice, please', "I'll have this one", 'cheers!'] },
  { stage: 'Useful phrases', grade: 'Beginner (A1–A2)', what: 'Shopping', items: ['money', 'price', 'cheap', 'expensive', 'open', 'closed', 'credit card', 'cash', 'receipt', "it's too expensive"] },
  { stage: 'Useful phrases', grade: 'Elementary (A2)', what: 'Directions', items: ['where is the bus stop?', 'when does the train leave?', 'I want to go to the airport', 'how far is it?', 'turn left', 'turn right', 'go straight', "it's near", "it's far", 'stop here, please'] },
  { stage: 'Sentences', grade: 'Elementary (A2)', what: 'Meeting people', items: ['where are you from?', "I'm from the United States", 'I speak a little', "what's your name?", 'how old are you?', "I'm ten years old", 'see you tomorrow', 'have a nice day', 'good luck', 'congratulations'] },
  { stage: 'Sentences', grade: 'Elementary (A2)', what: 'My day', items: ['I wake up early', 'I eat breakfast', 'I go to school', 'I go to work', 'I study', 'I play with my friends', 'I read a book', 'I go to bed', 'I brush my teeth', 'I take a shower'] },
  { stage: 'Sentences', grade: 'Elementary (A2)', what: 'Describing things', items: ['the dog is big', 'the cat is small', 'the house is white', 'the water is cold', 'the food is good', 'the book is new', 'my mother is happy', 'the weather is nice', 'the sky is blue', 'the store is closed'] },
  { stage: 'Sentences', grade: 'Elementary (A2)', what: 'Longer sentences', items: ['I would like a cup of coffee', 'can you help me, please?', "I'm learning {lang}", "I don't speak {lang} very well", 'can you speak more slowly?', 'how do you say this in {lang}?', "I'm going home", "we're going to the beach tomorrow", 'I have two children', 'thank you very much for your help'] },
]

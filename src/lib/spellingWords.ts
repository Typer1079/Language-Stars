/**
 * Spelling bee word list, easiest to hardest: first-grade words up to Scripps National Spelling
 * Bee championship words. Each line: word | part of speech | definition | sentence | language of origin.
 * Spellers may ask for any of these, as the National Spelling Bee rules allow.
 */
const RAW = `
cat|noun|a small furry pet that purrs|The cat curled up on the warm rug.|Old English
dog|noun|a pet animal that barks|Our dog wags its tail when we come home.|Old English
sun|noun|the star that gives Earth light and heat|The sun rose over the hills.|Old English
hat|noun|something you wear on your head|He wore a red hat to the parade.|Old English
bed|noun|furniture you sleep on|I make my bed every morning.|Old English
pig|noun|a farm animal with a curly tail|The pig rolled in the cool mud.|Middle English
run|verb|to move fast on your feet|We run around the track at recess.|Old English
big|adjective|large in size|An elephant is a big animal.|Middle English
red|adjective|the color of a ripe strawberry|She picked a red apple.|Old English
top|noun|the highest part of something|The bird sat on top of the tree.|Old English
cup|noun|a small container you drink from|Pour the milk into a cup.|Latin
map|noun|a drawing that shows where places are|We used a map to find the park.|Latin
pen|noun|a tool for writing with ink|Sign your name with a pen.|Latin
box|noun|a container with flat sides|The toys go back in the box.|Latin
fox|noun|a wild animal with a bushy tail|A fox ran across the field.|Old English
hen|noun|a female chicken|The hen laid two eggs.|Old English
jam|noun|a sweet spread made from fruit|I like grape jam on toast.|English
leg|noun|the part of the body you stand on|The table has four legs, but one leg is short.|Old Norse
mud|noun|wet, sticky dirt|My boots were covered in mud.|Middle Low German
net|noun|material with holes, used to catch things|The goalie stopped the ball before it hit the net.|Old English
bus|noun|a large vehicle that carries many people|We ride the bus to school.|Latin
fan|noun|a machine that moves air to cool you|Turn on the fan when it is hot.|Latin
kid|noun|a child; also a young goat|Every kid in class got a sticker.|Old Norse
log|noun|a thick piece of a cut tree|A frog sat on the log.|Middle English
nap|noun|a short sleep during the day|The baby took a nap after lunch.|Old English
sit|verb|to rest on a seat|Please sit on the bench.|Old English
wet|adjective|covered with water|The grass was wet with dew.|Old English
yes|adverb|a word that means you agree|Yes, I would like more soup.|Old English
zip|verb|to close with a zipper|Zip your coat before you go outside.|English
hop|verb|to jump on one foot or with small jumps|The bunny can hop across the yard.|Old English
ten|noun|the number after nine|I counted ten ducks in the pond.|Old English
six|noun|the number after five|An insect has six legs.|Old English
van|noun|a covered vehicle for carrying things or people|The van was full of boxes.|Persian
web|noun|a net spun by a spider|The spider fixed its web.|Old English
bug|noun|a small insect|A bug landed on my arm.|English
cub|noun|a young bear, lion or fox|The bear cub followed its mother.|English
dig|verb|to make a hole in the ground|Dogs like to dig in the sand.|Middle English
fix|verb|to repair something|Dad will fix the broken chair.|Latin
hug|verb|to hold someone close in your arms|I hug my grandma when she visits.|Old Norse
lid|noun|a cover for a box or jar|Put the lid back on the jar.|Old English
not|adverb|a word that makes something negative|It is not time for bed yet.|Old English
pot|noun|a deep pan for cooking|Soup bubbled in the pot.|Old English
rug|noun|a small carpet|The puppy slept on the rug.|Old Norse
sad|adjective|unhappy|He felt sad when the game ended.|Old English
tub|noun|a large open container, often for baths|The baby splashed in the tub.|Middle Dutch
win|verb|to come first in a game or race|Our team hopes to win the match.|Old English
yak|noun|a long-haired ox from the mountains of Asia|A yak can carry heavy loads.|Tibetan
zoo|noun|a park where wild animals are kept|We saw zebras at the zoo.|Greek
ship|noun|a large boat|The ship sailed across the ocean.|Old English
fish|noun|an animal that lives and swims in water|A fish swam under the dock.|Old English
chin|noun|the part of the face below the mouth|He rested his chin on his hand.|Old English
much|adjective|a large amount|There is too much noise in here.|Old English
that|pronoun|a word that points to something|That is my backpack.|Old English
this|pronoun|a word that points to something near|This is my favorite book.|Old English
bath|noun|a wash in a tub of water|The puppy needs a bath.|Old English
ring|noun|a circle of metal worn on a finger|She wore a silver ring.|Old English
king|noun|a man who rules a country|The king wore a golden crown.|Old English
song|noun|music with words that you sing|We learned a new song today.|Old English
cake|noun|a sweet baked dessert|Mom baked a cake for my birthday.|Old Norse
game|noun|something you play for fun, with rules|Let's play a board game.|Old English
lake|noun|a large body of water surrounded by land|We swam in the lake.|Latin
bike|noun|a bicycle|I ride my bike to the park.|Greek
kite|noun|a toy that flies in the wind on a string|The kite soared above the beach.|Old English
time|noun|what clocks measure|What time does the movie start?|Old English
home|noun|the place where you live|We stayed home on Sunday.|Old English
bone|noun|a hard part of the skeleton|The dog buried a bone.|Old English
rope|noun|a thick, strong cord|We climbed the rope in gym class.|Old English
nose|noun|the part of the face you smell with|A clown has a red nose.|Old English
feet|noun|more than one foot|My feet are cold.|Old English
tree|noun|a tall plant with a trunk and branches|An owl lives in that tree.|Old English
sheep|noun|a farm animal with a woolly coat|The sheep grazed on the hill.|Old English
green|adjective|the color of grass|She painted the door green.|Old English
boat|noun|a small vessel for traveling on water|We rowed the boat to shore.|Old English
coat|noun|a warm jacket|Wear your coat; it's cold outside.|French
road|noun|a wide path for cars|The road winds through the forest.|Old English
rain|noun|water falling from clouds|The rain watered the garden.|Old English
tail|noun|the part at the back end of an animal|The cat flicked its tail.|Old English
paint|noun|colored liquid for covering surfaces|We used blue paint on the fence.|Latin
play|verb|to have fun with a game or toy|The children play outside after lunch.|Old English
day|noun|the time when it is light outside|It was a sunny day.|Old English
car|noun|a vehicle with four wheels and an engine|Our car needs gas.|Latin
farm|noun|land used for growing crops or raising animals|Cows live on the farm.|French
park|noun|a public place with grass and trees|We had a picnic in the park.|French
corn|noun|a tall plant with yellow kernels|We ate corn on the cob.|Old English
fork|noun|a tool with points for picking up food|Use a fork to eat your salad.|Latin
girl|noun|a female child|The girl won the spelling contest.|Middle English
turn|verb|to move around or change direction|Turn left at the corner.|Latin
shirt|noun|clothing for the upper body|He wore a striped shirt.|Old English
star|noun|a point of light in the night sky|I made a wish on a star.|Old English
frog|noun|a jumping animal that lives near water|The frog caught a fly.|Old English
duck|noun|a water bird with a flat beak|A duck paddled across the pond.|Old English
drum|noun|an instrument you hit to make a beat|He plays the drum in the band.|Dutch
crab|noun|a sea animal with claws that walks sideways|A crab hid under a rock.|Old English
lamp|noun|a light that sits on a table or floor|Turn on the lamp to read.|Greek
milk|noun|a white drink that comes from cows|I drink milk with breakfast.|Old English
snow|noun|frozen white flakes that fall from clouds|We built a fort in the snow.|Old English
train|noun|a line of railroad cars pulled by an engine|The train stopped at the station.|French
smile|noun|a happy look made with your mouth|Her smile lit up the room.|Middle English
cloud|noun|a white or gray mass floating in the sky|A cloud covered the sun.|Old English
because|conjunction|for the reason that|We stayed inside because it rained.|Middle English
friend|noun|a person you like and trust|My friend shared her lunch with me.|Old English
school|noun|a place where children learn|We walk to school together.|Greek
people|noun|men, women and children|Many people came to the fair.|Latin
little|adjective|small|A little mouse ran under the door.|Old English
every|adjective|each one of a group|Every student got a book.|Old English
before|preposition|earlier than|Wash your hands before dinner.|Old English
should|verb|ought to|You should wear a helmet.|Old English
would|verb|used to talk about what might happen|I would like to visit Japan.|Old English
could|verb|was able to|She could swim when she was four.|Old English
laugh|verb|to make sounds that show something is funny|The joke made us laugh.|Old English
enough|adjective|as much as needed|We have enough chairs for everyone.|Old English
through|preposition|from one side to the other|The train went through the tunnel.|Old English
thought|noun|an idea in your mind|I had a happy thought.|Old English
answer|noun|a reply to a question|She knew the answer right away.|Old English
color|noun|red, blue, yellow and so on|Blue is my favorite color.|Latin
money|noun|coins and bills used to buy things|I saved money for a new bike.|Latin
family|noun|parents, children and other relatives|My family eats dinner together.|Latin
animal|noun|a living thing that can move and eat|A giraffe is a tall animal.|Latin
number|noun|a word or symbol for how many|Seven is my lucky number.|Latin
picture|noun|a drawing, painting or photo|She drew a picture of her cat.|Latin
together|adverb|with each other|We built the puzzle together.|Old English
beautiful|adjective|very pretty|The sunset was beautiful.|French
careful|adjective|paying attention to avoid mistakes|Be careful with the scissors.|Old English
really|adverb|truly; very|That was a really good movie.|Latin
finally|adverb|at last|The bus finally arrived.|Latin
pretty|adjective|pleasant to look at|She wore a pretty dress.|Old English
garden|noun|a place where flowers or vegetables grow|Tomatoes grow in our garden.|French
window|noun|an opening in a wall with glass|Open the window for fresh air.|Old Norse
yellow|adjective|the color of a lemon|A yellow bus pulled up.|Old English
rabbit|noun|a small animal with long ears|The rabbit nibbled a carrot.|Middle English
kitten|noun|a young cat|The kitten chased a ball of yarn.|French
basket|noun|a container made of woven strips|She carried apples in a basket.|French
pencil|noun|a writing tool with graphite inside|Sharpen your pencil before the test.|Latin
button|noun|a small disk that fastens clothes|A button fell off my coat.|French
winter|noun|the coldest season of the year|It snows in winter.|Old English
summer|noun|the warmest season of the year|We go to the beach in summer.|Old English
doctor|noun|a person who treats sick people|The doctor checked my ears.|Latin
flower|noun|the colorful part of a plant|A bee landed on the flower.|French
pillow|noun|a soft cushion for your head|I fluffed my pillow before bed.|Latin
water|noun|the clear liquid in rivers and rain|Drink plenty of water.|Old English
paper|noun|thin material for writing or drawing|Write your name on the paper.|Greek
banana|noun|a long curved yellow fruit|I packed a banana for lunch.|Wolof
elephant|noun|a huge gray animal with a trunk|The elephant sprayed water with its trunk.|Greek
umbrella|noun|a folding cover that keeps off rain|Take an umbrella in case it rains.|Italian
dinosaur|noun|a huge reptile that lived long ago|The museum has a dinosaur skeleton.|Greek
butterfly|noun|an insect with large colorful wings|A butterfly landed on the fence.|Old English
kangaroo|noun|an Australian animal that hops|A kangaroo carries its baby in a pouch.|Guugu Yimithirr
tomato|noun|a round red fruit used in salads and sauces|Slice a tomato for the sandwich.|Nahuatl
potato|noun|a vegetable that grows underground|We baked a potato for dinner.|Taino
adventure|noun|an exciting or unusual experience|Camping was a great adventure.|Latin
treasure|noun|gold, jewels or other valuable things|The pirates buried their treasure.|Greek
castle|noun|a large strong building with towers|The castle had a moat.|Latin
dolphin|noun|a smart sea mammal|A dolphin jumped beside the boat.|Greek
rainbow|noun|an arc of colors in the sky|A rainbow appeared after the storm.|Old English
monster|noun|a scary imaginary creature|The story had a friendly monster.|Latin
pirate|noun|a person who robs ships at sea|The pirate wore an eye patch.|Greek
sandwich|noun|food between two slices of bread|I made a cheese sandwich.|English
library|noun|a place where books are kept to borrow|We borrowed books from the library.|Latin
vegetable|noun|a plant or part of a plant used as food|Broccoli is a green vegetable.|Latin
chocolate|noun|a sweet brown food made from cacao|We drank hot chocolate.|Nahuatl
surprise|noun|something unexpected|The party was a surprise.|French
calendar|noun|a chart of the days, weeks and months|Circle the date on the calendar.|Latin
February|noun|the second month of the year|Valentine's Day is in February.|Latin
Wednesday|noun|the day after Tuesday|We have art class on Wednesday.|Old English
favorite|adjective|liked best|Pizza is my favorite food.|Italian
different|adjective|not the same|The twins wore different shirts.|Latin
important|adjective|having great value or meaning|It is important to tell the truth.|Latin
question|noun|something you ask|Raise your hand to ask a question.|Latin
scissors|noun|a cutting tool with two blades|Cut along the line with scissors.|Latin
guitar|noun|a stringed musical instrument|He strummed his guitar.|Spanish
island|noun|land with water all around it|We took a ferry to the island.|Old English
whistle|noun|a small device that makes a high sound|The coach blew the whistle.|Old English
neighbor|noun|a person who lives next to you|Our neighbor waters our plants.|Old English
weird|adjective|very strange|We heard a weird noise in the attic.|Old English
receive|verb|to get something given or sent|Did you receive my letter?|Latin
believe|verb|to think something is true|I believe you can do it.|Old English
piece|noun|a part of something|May I have a piece of pie?|French
science|noun|the study of the natural world|We grew crystals in science class.|Latin
minute|noun|sixty seconds|Wait a minute, please.|Latin
lightning|noun|a flash of light during a storm|Lightning lit up the sky.|Old English
thousand|noun|ten hundred|The stadium holds a thousand people.|Old English
machine|noun|equipment with moving parts that does work|The machine makes ice cream.|Greek
ocean|noun|a huge body of salt water|Whales swim in the ocean.|Greek
special|adjective|better or different from usual|Today is a special day.|Latin
certain|adjective|sure|I am certain I locked the door.|Latin
bicycle|noun|a two-wheeled vehicle you pedal|She rode her bicycle to the store.|Greek
giraffe|noun|the tallest animal, with a very long neck|A giraffe ate leaves from the treetop.|Arabic
penguin|noun|a black-and-white bird that swims but cannot fly|The penguin slid on its belly.|Welsh
triangle|noun|a shape with three sides|Draw a triangle on the board.|Latin
mountain|noun|a very high hill|We hiked up the mountain.|Latin
country|noun|a nation; also land outside cities|Canada is a large country.|Latin
weather|noun|what it is like outside: sun, rain, wind|The weather was perfect for a picnic.|Old English
although|conjunction|even though|Although it rained, we had fun.|Middle English
measure|verb|to find the size or amount of something|Measure the table with a ruler.|Latin
doubt|noun|a feeling of not being sure|There is no doubt she will win.|Latin
climb|verb|to go up using hands and feet|We like to climb the rock wall.|Old English
honest|adjective|truthful|He gave an honest answer.|Latin
wrinkle|noun|a small fold or line in skin or cloth|Iron out the wrinkle in your shirt.|Old English
knuckle|noun|a joint in your finger|She knocked with her knuckle.|Middle Low German
brilliant|adjective|very bright or very clever|That was a brilliant idea.|French
cylinder|noun|a solid shape like a can|A soup can is a cylinder.|Greek
hygiene|noun|keeping clean to stay healthy|Brushing teeth is good hygiene.|Greek
jealous|adjective|wanting what someone else has|He felt jealous of his sister's new bike.|Greek
mischief|noun|playful bad behavior|The puppy got into mischief.|French
nuisance|noun|something annoying|The buzzing fly was a nuisance.|Latin
pharmacy|noun|a store that sells medicine|Pick up the medicine at the pharmacy.|Greek
rhythm|noun|a regular pattern of beats|Clap to the rhythm of the song.|Greek
vacuum|noun|a machine that sucks up dirt|Run the vacuum over the carpet.|Latin
villain|noun|the bad character in a story|The villain stole the jewels.|Latin
yacht|noun|a large boat for pleasure trips|They sailed the yacht around the bay.|Dutch
anxious|adjective|worried or nervous|She was anxious before the test.|Latin
boulevard|noun|a wide city street, often with trees|Shops line the boulevard.|French
cafeteria|noun|a restaurant where you serve yourself|We ate lunch in the cafeteria.|Spanish
dialogue|noun|a conversation, especially in a story|The play has funny dialogue.|Greek
exaggerate|verb|to make something seem bigger than it is|Don't exaggerate the size of the fish.|Latin
fluorescent|adjective|very bright, glowing|She wore a fluorescent vest.|Latin
guarantee|noun|a promise that something will happen|The toaster comes with a guarantee.|French
hydrant|noun|a pipe on the street for getting water|The firefighters opened the hydrant.|Greek
itinerary|noun|a plan for a trip|Our itinerary includes three cities.|Latin
kerosene|noun|an oil burned in lamps and heaters|The old lamp burns kerosene.|Greek
lieutenant|noun|an officer in the armed forces|The lieutenant gave the order.|French
marathon|noun|a running race of about 26 miles|She trained for months to run a marathon.|Greek
nautical|adjective|about ships and sailing|The museum has nautical maps.|Greek
orchestra|noun|a large group of musicians|The orchestra played a symphony.|Greek
pneumonia|noun|an illness that affects the lungs|Grandpa was treated for pneumonia.|Greek
quarantine|noun|keeping sick people or animals apart|The new puppy stayed in quarantine.|Italian
restaurant|noun|a place where you buy and eat meals|We ate at a Mexican restaurant.|French
souvenir|noun|something kept to remember a place|I bought a souvenir at the museum.|French
tsunami|noun|a huge ocean wave caused by an earthquake|The town had a tsunami warning.|Japanese
unique|adjective|the only one of its kind|Every snowflake is unique.|Latin
vocabulary|noun|the words a person knows|Reading builds your vocabulary.|Latin
wrestle|verb|to struggle with someone, trying to pin them|The puppies like to wrestle.|Old English
xylophone|noun|an instrument with wooden bars you hit|He played a tune on the xylophone.|Greek
zucchini|noun|a long green summer squash|We grilled zucchini for dinner.|Italian
ambulance|noun|a vehicle that takes sick people to the hospital|The ambulance raced down the street.|French
avalanche|noun|a large fall of snow down a mountain|The skiers escaped the avalanche.|French
biscuit|noun|a small baked bread or cracker|She served a warm biscuit with honey.|French
colonel|noun|a high-ranking army officer|The colonel inspected the troops.|Italian
dungeon|noun|a dark prison under a castle|The knight was locked in the dungeon.|French
emperor|noun|the ruler of an empire|The emperor lived in a grand palace.|Latin
frequent|adjective|happening often|We make frequent trips to the library.|Latin
gorgeous|adjective|very beautiful|The view from the top was gorgeous.|French
hurricane|noun|a very strong storm with high winds|The hurricane knocked down trees.|Taino
icicle|noun|a hanging stick of ice|An icicle hung from the roof.|Old English
journey|noun|a long trip|The journey across the desert took days.|French
kayak|noun|a small narrow boat you paddle|We paddled a kayak down the river.|Inuit
luxury|noun|something expensive and not necessary|A hot tub is a luxury.|Latin
mosquito|noun|a small flying insect that bites|A mosquito bit my arm.|Spanish
accommodate|verb|to provide room for|The hotel can accommodate two hundred guests.|Latin
acquaintance|noun|a person you know a little|She is an acquaintance from camp.|French
bureaucracy|noun|a system of government with many rules and offices|The bureaucracy slowed the project.|French
camouflage|noun|colors or patterns that help something blend in|The lizard's camouflage hid it on the bark.|French
conscientious|adjective|careful to do what is right|A conscientious student checks her work.|Latin
connoisseur|noun|an expert judge of fine things|The connoisseur tasted the cheese.|French
dilemma|noun|a hard choice between two options|She faced a dilemma about which team to join.|Greek
embarrass|verb|to make someone feel awkward|Please don't embarrass me in front of my friends.|French
entrepreneur|noun|a person who starts a business|The young entrepreneur opened a bakery.|French
fascinate|verb|to hold someone's interest strongly|Volcanoes fascinate my brother.|Latin
handkerchief|noun|a small cloth for wiping your nose|He waved a white handkerchief.|English
idiosyncrasy|noun|an odd habit or way of behaving|Humming while he works is his idiosyncrasy.|Greek
jeopardy|noun|danger|The storm put the crops in jeopardy.|French
kaleidoscope|noun|a tube with mirrors that makes colorful patterns|I turned the kaleidoscope to see new shapes.|Greek
liaison|noun|a person who helps groups communicate|She is the school's liaison to parents.|French
maneuver|noun|a skillful movement|The pilot made a sharp maneuver.|French
millennium|noun|a period of one thousand years|The city was founded over a millennium ago.|Latin
mnemonic|noun|a trick that helps you remember|A mnemonic helped me learn the planets.|Greek
noticeable|adjective|easy to see or notice|There was a noticeable change in the weather.|Latin
occurrence|noun|something that happens|Snow is a rare occurrence here.|Latin
parallel|adjective|side by side and never meeting|Railroad tracks are parallel lines.|Greek
playwright|noun|a person who writes plays|The playwright watched opening night.|English
questionnaire|noun|a written set of questions|Please fill out the questionnaire.|French
rendezvous|noun|a planned meeting|The friends set a rendezvous at noon.|French
rhinoceros|noun|a large animal with one or two horns on its nose|A rhinoceros has very thick skin.|Greek
sabotage|noun|damage done on purpose to stop something|The broken bridge was an act of sabotage.|French
sergeant|noun|a military officer of middle rank|The sergeant led the march.|French
surveillance|noun|close watching of a person or place|The bank is under video surveillance.|French
tyranny|noun|cruel and unfair rule|The people rose up against tyranny.|Greek
vengeance|noun|punishment given in return for a wrong|The hero did not seek vengeance.|French
zealous|adjective|full of energy and enthusiasm|The zealous fans cheered all game.|Greek
aficionado|noun|a person who knows a lot about and loves something|He is a jazz aficionado.|Spanish
beleaguer|verb|to trouble or surround with problems|Rain continued to beleaguer the campers.|Dutch
catastrophe|noun|a terrible disaster|The flood was a catastrophe for the town.|Greek
deterrent|noun|something that discourages an action|The fence is a deterrent to deer.|Latin
egregious|adjective|shockingly bad|That was an egregious mistake.|Latin
fuchsia|noun|a bright purplish-pink color|She painted her room fuchsia.|German
gazebo|noun|a small open garden building|The band played in the gazebo.|English
harass|verb|to bother someone again and again|Don't harass the ducks.|French
indict|verb|to formally charge with a crime|The jury voted to indict the suspect.|Latin
khaki|noun|a dull yellowish-brown color or cloth|He wore khaki pants.|Urdu
labyrinth|noun|a maze|We got lost in the hedge labyrinth.|Greek
mayonnaise|noun|a thick creamy sauce made with eggs and oil|Spread mayonnaise on the bread.|French
nauseous|adjective|feeling sick to the stomach|The boat ride made me nauseous.|Greek
onomatopoeia|noun|a word that sounds like what it means|Buzz is an example of onomatopoeia.|Greek
pharaoh|noun|a ruler of ancient Egypt|The pharaoh was buried in a pyramid.|Egyptian
quinoa|noun|a small seed cooked like a grain|We ate quinoa with vegetables.|Quechua
reconnaissance|noun|exploring to gather information|The scouts went on reconnaissance.|French
acquiesce|verb|to agree without protest|The coach acquiesced to the players' request.|Latin
bourgeois|adjective|typical of the middle class|The novel mocks bourgeois manners.|French
chauffeur|noun|a person paid to drive a car|The chauffeur opened the door.|French
dachshund|noun|a small dog with a long body and short legs|Our dachshund chases squirrels.|German
ecstasy|noun|great joy|The fans were in ecstasy after the win.|Greek
facsimile|noun|an exact copy|The museum displayed a facsimile of the map.|Latin
gauche|adjective|awkward in social situations|It seemed gauche to ask her age.|French
hemorrhage|noun|heavy bleeding|The doctor stopped the hemorrhage.|Greek
impromptu|adjective|done without planning|He gave an impromptu speech.|Latin
juxtaposition|noun|placing things side by side for contrast|The painting's juxtaposition of light and dark is striking.|Latin
kitsch|noun|art that is tacky or overly sentimental|The shop sells kitsch souvenirs.|German
larynx|noun|the voice box in the throat|Your larynx helps you speak.|Greek
malfeasance|noun|wrongdoing by an official|The mayor was accused of malfeasance.|French
nonchalant|adjective|calm and unconcerned|She was nonchalant about the big game.|French
obsequious|adjective|too eager to please or obey|The obsequious waiter bowed again and again.|Latin
pseudonym|noun|a false name used by a writer|Mark Twain is a pseudonym.|Greek
quintessential|adjective|the most perfect example of something|Apple pie is the quintessential American dessert.|Latin
rhapsody|noun|an emotional piece of music or writing|The orchestra played a rhapsody.|Greek
sacrilegious|adjective|disrespectful toward something sacred|Graffiti on the temple was sacrilegious.|Latin
sarcophagus|noun|a stone coffin|The mummy lay inside a sarcophagus.|Greek
solemn|adjective|serious and formal|It was a solemn ceremony.|Latin
staccato|adjective|played with short, separate notes|Play these notes staccato.|Italian
taciturn|adjective|quiet; saying little|The taciturn farmer nodded but said nothing.|Latin
ukulele|noun|a small four-stringed guitar|She strummed a ukulele on the beach.|Hawaiian
vicissitude|noun|an unexpected change in circumstances|They survived the vicissitudes of war.|Latin
wanderlust|noun|a strong desire to travel|Her wanderlust took her to forty countries.|German
xenophobia|noun|fear or dislike of foreigners|The speech warned against xenophobia.|Greek
apparatus|noun|equipment for a particular job|The divers checked their breathing apparatus.|Latin
cantankerous|adjective|grumpy and hard to get along with|The cantankerous old goat butted the fence.|English
debacle|noun|a sudden complete failure|The party was a debacle when the cake fell.|French
effervescent|adjective|bubbly; full of life|Her effervescent laugh filled the room.|Latin
flamboyant|adjective|showy and colorful|The singer wore a flamboyant costume.|French
gesundheit|interjection|said to someone who sneezes|"Gesundheit," said Dad when I sneezed.|German
hieroglyphics|noun|writing that uses pictures as symbols|We studied Egyptian hieroglyphics.|Greek
insouciant|adjective|carefree and unconcerned|He gave an insouciant shrug.|French
jambalaya|noun|a spicy rice dish from Louisiana|We cooked jambalaya with shrimp.|Louisiana French
kindergarten|noun|a class for young children before first grade|My sister started kindergarten.|German
lackadaisical|adjective|lazy and without enthusiasm|His lackadaisical effort cost the team.|English
melancholy|noun|a deep, lasting sadness|The song filled him with melancholy.|Greek
nemesis|noun|a rival who is hard to beat|The tall goalie was our nemesis.|Greek
ostentatious|adjective|showy, meant to impress|The mansion had an ostentatious gold gate.|Latin
paraphernalia|noun|the equipment needed for an activity|His fishing paraphernalia filled the trunk.|Greek
quagmire|noun|a bog; also a difficult situation|The project became a quagmire.|English
renaissance|noun|a rebirth or revival|The town is enjoying a renaissance.|French
sauerkraut|noun|chopped pickled cabbage|We had sausages with sauerkraut.|German
tchotchke|noun|a small trinket or knickknack|Her shelf is full of tchotchkes.|Yiddish
unanimous|adjective|agreed on by everyone|The vote was unanimous.|Latin
verisimilitude|noun|the appearance of being true or real|The film's details add verisimilitude.|Latin
whimsical|adjective|playfully odd or fanciful|The book has whimsical drawings.|English
abecedarian|noun|a person learning the alphabet; a beginner|As an abecedarian, he practiced his letters daily.|Latin
baccalaureate|noun|a bachelor's degree; a graduation service|She earned her baccalaureate in biology.|Latin
cappuccino|noun|espresso coffee with frothed milk|Mom ordered a cappuccino.|Italian
dirigible|noun|an airship that can be steered|The dirigible floated over the city.|Latin
efflorescence|noun|a flowering or blossoming|The spring brought an efflorescence of tulips.|Latin
gesticulate|verb|to make gestures while speaking|He tends to gesticulate when excited.|Latin
hagiography|noun|a biography that praises too much|The book was more hagiography than history.|Greek
iconoclast|noun|a person who attacks traditional beliefs|The artist was an iconoclast.|Greek
jacquard|noun|a fabric with a woven pattern|The pillow was covered in jacquard.|French
kohlrabi|noun|a cabbage with a round, turnip-like stem|We roasted kohlrabi for dinner.|German
lagniappe|noun|a small extra gift given with a purchase|The baker added a cookie as lagniappe.|Louisiana French
mellifluous|adjective|sweet and smooth to hear|She has a mellifluous voice.|Latin
necromancy|noun|magic said to talk with the dead|The wizard was accused of necromancy.|Greek
oligarchy|noun|rule by a small group|The nation was run by an oligarchy.|Greek
pachyderm|noun|a thick-skinned animal such as an elephant|The pachyderm sprayed dust on its back.|Greek
quiescent|adjective|quiet and inactive|The volcano has been quiescent for years.|Latin
repartee|noun|quick, witty replies|The comedians traded clever repartee.|French
schadenfreude|noun|pleasure at someone else's bad luck|He felt a twinge of schadenfreude.|German
sesquipedalian|adjective|using long words|The professor's sesquipedalian lecture confused us.|Latin
triskaidekaphobia|noun|fear of the number thirteen|The hotel skipped floor thirteen because of triskaidekaphobia.|Greek
vichyssoise|noun|a cold soup of potatoes and leeks|We had chilled vichyssoise.|French
weltanschauung|noun|a particular view of the world|His weltanschauung shaped his politics.|German
xeriscape|noun|landscaping that needs little water|The desert home has a xeriscape yard.|Greek
yttrium|noun|a rare metallic chemical element|Yttrium is used in some lasers.|Swedish
zephyr|noun|a soft, gentle breeze|A zephyr cooled the porch.|Greek
anemone|noun|a flower; also a sea creature|A sea anemone waved its tentacles.|Greek
bivouac|noun|a temporary camp without tents|The climbers made a bivouac on the ledge.|French
cacophony|noun|a harsh mix of loud sounds|The tuning orchestra made a cacophony.|Greek
dodecahedron|noun|a solid shape with twelve faces|The die was shaped like a dodecahedron.|Greek
epiphany|noun|a sudden moment of understanding|She had an epiphany about the math problem.|Greek
fiduciary|noun|a person trusted to manage someone's money|The bank acted as fiduciary.|Latin
gargoyle|noun|a carved stone creature on a building|A gargoyle sat on the cathedral roof.|French
haberdashery|noun|a shop selling men's clothing|He bought a tie at the haberdashery.|French
incandescent|adjective|glowing with heat|The incandescent bulb grew hot.|Latin
jicama|noun|a crunchy root vegetable|We ate jicama with lime.|Nahuatl
kibbutz|noun|a shared community farm in Israel|They lived on a kibbutz.|Hebrew
lugubrious|adjective|sad and gloomy|The dog gave a lugubrious howl.|Latin
mausoleum|noun|a large tomb building|The king was buried in a marble mausoleum.|Greek
obstreperous|adjective|noisy and hard to control|The obstreperous crowd shouted.|Latin
palimpsest|noun|a page written over earlier writing|The old scroll was a palimpsest.|Greek
quixotic|adjective|idealistic but impractical|His quixotic plan was to row across the Atlantic.|Spanish
rhododendron|noun|a shrub with large clusters of flowers|The rhododendron bloomed in May.|Greek
sarsaparilla|noun|a drink flavored with a root|Cowboys ordered sarsaparilla.|Spanish
tintinnabulation|noun|the ringing of bells|We heard the tintinnabulation of sleigh bells.|Latin
ululate|verb|to howl or wail|The wolves began to ululate.|Latin
vermicelli|noun|very thin pasta|Add vermicelli to the soup.|Italian
wainscot|noun|wooden paneling on the lower part of a wall|The dining room has oak wainscot.|Middle Dutch
chrysanthemum|noun|a garden flower with many petals|She planted a yellow chrysanthemum.|Greek
pterodactyl|noun|a flying reptile from the age of dinosaurs|A pterodactyl skeleton hung from the ceiling.|Greek
phlegmatic|adjective|calm and hard to excite|The phlegmatic cat ignored the dog.|Greek
eleemosynary|adjective|related to charity|The group does eleemosynary work.|Greek
zugzwang|noun|in chess, a position where any move hurts you|Her opponent fell into zugzwang.|German
ytterbium|noun|a soft silvery chemical element|Ytterbium is used in atomic clocks.|Swedish
bouillabaisse|noun|a fish stew from southern France|The chef served bouillabaisse.|Provencal
chiaroscuro|noun|strong contrast of light and dark in art|The painter used chiaroscuro.|Italian
dysphemism|noun|a harsh word used in place of a mild one|Calling a car a heap is a dysphemism.|Greek
eudaemonic|adjective|producing happiness|Volunteering can be eudaemonic.|Greek
fenestration|noun|the arrangement of windows in a building|The architect planned the fenestration.|Latin
glossolalia|noun|speech in an unknown or made-up language|The poem imitates glossolalia.|Greek
hemidemisemiquaver|noun|a sixty-fourth note in music|The score had a hemidemisemiquaver.|Greek and Latin
isthmus|noun|a narrow strip of land joining two larger areas|Panama sits on an isthmus.|Greek
knish|noun|a dough pocket filled with potato or meat|We bought a potato knish.|Yiddish
logogriph|noun|a word puzzle|The newspaper printed a logogriph.|Greek
maelstrom|noun|a powerful whirlpool; a confused situation|The ship was caught in a maelstrom.|Dutch
nyctophobia|noun|fear of the dark|Her nightlight helps with nyctophobia.|Greek
pusillanimous|adjective|lacking courage|The pusillanimous knight ran away.|Latin
quattrocento|noun|the 1400s in Italian art|The museum shows quattrocento paintings.|Italian
rijsttafel|noun|an Indonesian rice meal with many side dishes|We shared a rijsttafel in Amsterdam.|Dutch
smorgasbord|noun|a buffet with many dishes|The party had a smorgasbord of snacks.|Swedish
terpsichorean|adjective|related to dancing|The ballet was a terpsichorean delight.|Greek
ursine|adjective|like or related to bears|The mascot had an ursine face.|Latin
verdigris|noun|a green coating on old copper|Verdigris covered the statue.|French
weimaraner|noun|a large gray hunting dog|The weimaraner ran along the beach.|German
xiphoid|adjective|shaped like a sword|The xiphoid process is a bone at the bottom of the breastbone.|Greek
yarmulke|noun|a small round cap worn by Jewish men|He wore a yarmulke to the service.|Yiddish
zabaglione|noun|an Italian dessert of whipped egg yolks and wine|The chef whisked zabaglione.|Italian
accoutrement|noun|an extra item of equipment or dress|A hat was his favorite accoutrement.|French
boustrophedon|noun|writing that alternates direction line by line|The ancient stone used boustrophedon.|Greek
daguerreotype|noun|an early kind of photograph|We found a daguerreotype in the attic.|French
ebullience|noun|cheerful enthusiasm|Her ebullience was contagious.|Latin
flibbertigibbet|noun|a silly, flighty person|He called his cousin a flibbertigibbet.|English
gubernatorial|adjective|related to a governor|The gubernatorial race was close.|Latin
heliotrope|noun|a plant that turns toward the sun|Heliotrope has purple flowers.|Greek
inchoate|adjective|just begun; not fully formed|The plan was still inchoate.|Latin
jardiniere|noun|a decorative pot for plants|A fern grew in the jardiniere.|French
kakistocracy|noun|government by the worst people|The novel describes a kakistocracy.|Greek
lachrymose|adjective|tearful|The movie's lachrymose ending made us cry.|Latin
mirepoix|noun|diced onion, carrot and celery for cooking|Start the soup with a mirepoix.|French
nescience|noun|lack of knowledge|His nescience about cars was obvious.|Latin
orrery|noun|a model of the solar system|The orrery showed the planets in motion.|English
prestidigitation|noun|sleight of hand; magic tricks|The magician's prestidigitation amazed us.|French
quidnunc|noun|a nosy person who loves gossip|The quidnunc knew everyone's business.|Latin
rapprochement|noun|a renewal of friendly relations|The two countries reached a rapprochement.|French
sobriquet|noun|a nickname|The Big Apple is a sobriquet for New York.|French
thaumaturgy|noun|the working of wonders or magic|The tale is full of thaumaturgy.|Greek
unguent|noun|a soothing ointment|She rubbed unguent on the burn.|Latin
vituperation|noun|bitter, abusive language|The debate turned into vituperation.|Latin
wunderkind|noun|a child prodigy|The young pianist was a wunderkind.|German
fibranne|noun|a fabric made of spun rayon|The dress was made of fibranne.|French
antipyretic|noun|a medicine that reduces fever|The nurse gave her an antipyretic.|Greek
lyceum|noun|a hall for lectures and concerts|The poet spoke at the lyceum.|Greek
kamikaze|noun|a pilot on a suicide mission; reckless|The bird made a kamikaze dive.|Japanese
antediluvian|adjective|extremely old-fashioned|His antediluvian phone has buttons.|Latin
xanthosis|noun|a yellowing of the skin|Too many carrots can cause xanthosis.|Greek
vivisepulture|noun|the act of burying someone alive|The legend described vivisepulture.|Latin
euonym|noun|a name well suited to the person or thing|Speedy is a euonym for a fast runner.|Greek
chiaroscurist|noun|an artist who uses strong light and shadow|Caravaggio was a famous chiaroscurist.|Italian
logorrhea|noun|excessive talkativeness|The speaker's logorrhea made the meeting long.|Greek
demarche|noun|a formal diplomatic move or protest|The ambassador delivered a demarche.|French
succedaneum|noun|a substitute|Margarine was a succedaneum for butter.|Latin
prospicience|noun|the act of looking forward; foresight|Her prospicience helped the team plan.|Latin
pococurante|adjective|caring little; indifferent|His pococurante attitude annoyed the teacher.|Italian
autochthonous|adjective|native to a place|The island has autochthonous plants.|Greek
appoggiatura|noun|a grace note in music|The singer added an appoggiatura.|Italian
Ursprache|noun|a parent language that others came from|Linguists try to rebuild the Ursprache.|German
serrefine|noun|a small clamp used in surgery|The surgeon used a serrefine.|French
guerdon|noun|a reward|Victory was the knight's guerdon.|French
Laodicean|adjective|lukewarm or indifferent, especially about religion|He was Laodicean about politics.|Greek
stromuhr|noun|a device that measures blood flow|The stromuhr measured flow in the artery.|German
cymotrichous|adjective|having wavy hair|The portrait shows a cymotrichous poet.|Greek
guetapens|noun|an ambush or trap|The spies walked into a guetapens.|French
knaidel|noun|a dumpling of matzo meal|Grandma floated a knaidel in the soup.|Yiddish
stichomythia|noun|dialogue in alternating single lines|The play's stichomythia sped up the argument.|Greek
feuilleton|noun|a part of a newspaper with light writing|She wrote a weekly feuilleton.|French
scherenschnitte|noun|the art of paper cutting|Her scherenschnitte showed a forest scene.|German
nunatak|noun|a mountain peak sticking up through ice|The climbers rested on a nunatak.|Inuit
Feldenkrais|noun|a method of exercise for body awareness|She practices Feldenkrais to relieve back pain.|Hebrew
gesellschaft|noun|a society based on impersonal relationships|The city is a gesellschaft of strangers.|German
marocain|noun|a ribbed crepe fabric|The gown was made of marocain.|French
koinonia|noun|Christian fellowship or community|The church emphasized koinonia.|Greek
auslaut|noun|the sound at the end of a word or syllable|In German, the auslaut is often voiceless.|German
erysipelas|noun|a skin infection with red patches|The doctor treated the erysipelas.|Greek
bougainvillea|noun|a vine with bright papery flowers|Bougainvillea covered the wall.|French
aiguillette|noun|a decorative cord on a military uniform|The officer wore a gold aiguillette.|French
pendeloque|noun|a pear-shaped gem cut|Her earring was a pendeloque diamond.|French
palama|noun|the webbing on a bird's foot|A duck's palama helps it swim.|Greek
odylic|adjective|related to a supposed force behind hypnotism|He wrote about odylic force.|Greek
cernuous|adjective|drooping or nodding, like some flowers|The cernuous flower bent toward the ground.|Latin
murraya|noun|a tropical tree with fragrant flowers|A murraya grew beside the porch.|Latin
moorhen|noun|a water bird of the rail family|A moorhen swam among the reeds.|English
psammophile|noun|a plant or animal that thrives in sand|The beach grass is a psammophile.|Greek
abseil|verb|to rappel down a rope|The climbers abseil down the cliff.|German
`

export interface SpellEntry {
  word: string
  pos: string
  definition: string
  sentence: string
  origin: string
}

export const SPELLING_WORDS: SpellEntry[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [word, pos, definition, sentence, origin] = line.split('|')
    return { word, pos, definition, sentence, origin }
  })

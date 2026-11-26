import { parseLanguage } from './parse'

/** Tagalog (Filipino). Everyday Filipino uses English loanwords too, so common ones are accepted. */
export const TAGALOG_LEVELS = parseLanguage('Tagalog', `
# 1
kumusta ; kamusta ; hello
salamat ; salamat po
pakiusap ; paki ; please po
oo ; opo
hindi ; hindi po
paalam ; babay ; bye
magandang umaga ; magandang umaga po
magandang gabi ; magandang gabi po
mawalang-galang na ; mawalang galang na po ; excuse me po ; makikiraan po
pasensya na ; patawad ; sorry ; paumanhin
# 2
walang anuman ; walang anuman po ; you're welcome
hindi ko maintindihan ; hindi ko naiintindihan
marunong ka bang mag-Ingles? ; marunong ka bang mag-english ; nagsasalita ka ba ng Ingles
nasaan ang banyo? ; saan ang banyo ; nasaan ang CR ; saan ang CR
tubig
magkano ito? ; magkano ; magkano po
tulong! ; tulungan ninyo ako ; saklolo
ang pangalan ko ay ; ako si
ikinagagalak kitang makilala ; nice to meet you ; ikinagagalak ko kayong makilala
kumusta ka? ; kamusta ka ; kumusta po kayo
# 3
isa ; 1
dalawa ; 2
tatlo ; 3
apat ; 4
lima ; 5
anim ; 6
pito ; 7
walo ; 8
siyam ; 9
sampu ; 10
# 4
pagkain
tinapay
kanin ; bigas
kape
tsaa
gatas
prutas
mansanas
manok
isda
# 5
kaliwa ; sa kaliwa
kanan ; sa kanan
diretso ; deretso ; tuloy-tuloy
dito
doon ; diyan
hotel ; otel
paliparan ; airport
istasyon ng tren ; train station
tiket ; ticket
taksi ; taxi
# 6
doktor ; duktor
ospital
pulis
botika ; parmasya ; pharmacy
may sakit ako ; maysakit ako
naliligaw ako ; nawawala ako
tigil! ; hinto ; stop
sandali ; teka ; hintay
dahan-dahan lang po ; dahan dahan ; dahan-dahan
ulitin po ; isa pa po ; pakiulit
# 7
nanay ; ina ; mama
tatay ; ama ; papa
bata ; anak
sanggol ; baby
lola
lolo
pamilya
kaibigan
batang lalaki ; lalaki
batang babae ; babae
# 8
pula
asul ; bughaw
berde ; luntian
dilaw
itim
puti
kahel ; orange
lila ; ube ; violet
rosas ; pink
kayumanggi ; brown
# 9
aso
pusa
ibon
kabayo
baka
baboy
kuneho
daga
oso
leon
# 10
ulo
mata
tainga ; tenga
ilong
bibig
kamay
paa
braso
binti
buhok
# 11
bahay
pinto ; pintuan
bintana
mesa ; lamesa
upuan ; silya
kama
kusina
kuwarto ; kwarto ; silid
susi
libro ; aklat
# 12
paaralan ; eskuwelahan ; eskwela
guro ; titser ; teacher
estudyante ; mag-aaral
bolpen ; ballpen ; panulat
lapis
papel
bag ; bayong
kompyuter ; computer
klase
takdang-aralin ; takdang aralin ; assignment
# 13
labing-isa ; labing isa ; 11
labindalawa ; labing dalawa ; 12
labinlima ; labing lima ; 15
dalawampu ; 20
tatlumpu ; 30
apatnapu ; 40
limampu ; 50
isang daan ; sandaan ; 100
isang libo ; sanlibo ; 1000
sero ; wala ; zero ; 0
# 14
Lunes
Martes
Miyerkules ; Miyerkoles
Huwebes
Biyernes
Sabado
Linggo
ngayon ; ngayong araw
bukas
kahapon
# 15
umaga
hapon
gabi ; dapithapon
gabi ; hatinggabi
araw
linggo
buwan
taon
ngayon
mamaya
# 16
araw
buwan
bituin
ulan
niyebe ; snow
hangin
mainit
malamig
puno
bulaklak
# 17
kamiseta ; damit ; t-shirt
pantalon
sapatos
sombrero ; sumbrero
bestida ; damit pambabae ; dress
dyaket ; jacket
medyas
salamin ; salamin sa mata
damit
payong
# 18
almusal
tanghalian
hapunan
itlog
keso
sopas ; sabaw
asukal
asin
karne
gulay
# 19
lungsod ; siyudad ; lunsod
tindahan
restawran ; restaurant ; kainan
parke
dalampasigan ; beach ; tabing-dagat
bangko
museo
aklatan ; silid-aklatan ; library
palengke ; pamilihan
kalye ; daan
# 20
malaki
maliit
mabuti ; maganda
masama ; pangit
bago
luma ; matanda
masaya ; maligaya
malungkot
mabilis
mabagal
# 21
kumain
uminom
pumunta
dumating ; pumarito
makita ; tumingin ; manood
magsalita
magbasa ; bumasa
sumulat ; magsulat
matulog
maglaro
# 22
gutom ako ; nagugutom ako
nauuhaw ako ; uhaw ako
pagod ako
masaya ako
nilalamig ako ; giniginaw ako
naiinitan ako ; mainit ako
gusto ko ito ; gusto ko
ayoko nito ; hindi ko gusto ito ; ayoko
mahal kita
handa na ako
# 23
ano?
sino?
saan? ; nasaan
kailan?
bakit?
paano?
alin?
ilan?
ano ito?
anong oras na?
# 24
ang menu, pakiusap ; pahingi ng menu ; menu po
ang bill, pakiusap ; bill po ; ang tseke
mesa para sa dalawa, pakiusap ; mesa para sa dalawa
gusto ko ng tubig ; pahingi ng tubig
masarap ; ang sarap
busog na ako ; busog ako
isa pa, pakiusap ; isa pa po
walang yelo, pakiusap ; walang yelo
ito na lang ang akin ; ito ang gusto ko ; ito po
tagay! ; mabuhay ; cheers
# 25
pera
presyo
mura
mahal
bukas
sarado
credit card ; kard
cash ; pera ; salapi
resibo
masyadong mahal ; ang mahal
# 26
nasaan ang hintuan ng bus? ; saan ang sakayan ng bus ; nasaan ang bus stop
kailan aalis ang tren? ; anong oras aalis ang tren
gusto kong pumunta sa paliparan ; gusto kong pumunta sa airport
gaano kalayo? ; malayo ba ; gaano kalayo ito
kumaliwa ka ; kaliwa
kumanan ka ; kanan
dumiretso ka ; diretso lang
malapit lang ; malapit
malayo
dito na lang po ; para po ; dito po
# 27
taga-saan ka? ; taga saan ka ; saan ka galing
taga-Estados Unidos ako ; taga America ako ; taga Amerika ako
marunong ako nang kaunti ; konti lang ; kaunti lang
ano ang pangalan mo? ; anong pangalan mo
ilang taon ka na? ; ilang taon ka na
sampung taong gulang ako ; sampung taon na ako ; 10 taon na ako
kita tayo bukas ; hanggang bukas ; bukas ulit
magandang araw sa iyo ; magandang araw
good luck ; suwertehin ka sana ; sana swertehin ka
binabati kita ; congratulations ; maligayang bati
# 28
maaga akong gumigising ; gumigising ako nang maaga
kumakain ako ng almusal ; nag-aalmusal ako
pumapasok ako sa paaralan ; pumupunta ako sa paaralan ; pumapasok ako sa eskwela
pumapasok ako sa trabaho ; pumupunta ako sa trabaho
nag-aaral ako
nakikipaglaro ako sa mga kaibigan ko ; naglalaro ako kasama ang mga kaibigan ko
nagbabasa ako ng libro ; nagbabasa ako ng aklat
matutulog na ako ; natutulog ako
nagsisipilyo ako
naliligo ako
# 29
malaki ang aso
maliit ang pusa
puti ang bahay
malamig ang tubig
masarap ang pagkain
bago ang libro
masaya ang nanay ko
maganda ang panahon
asul ang langit
sarado ang tindahan
# 30
gusto ko ng isang tasang kape ; gusto ko ng kape
puwede mo ba akong tulungan? ; pwede mo ba akong tulungan ; tulungan mo ako please
nag-aaral ako ng Tagalog ; nag-aaral ako ng Filipino
hindi ako masyadong marunong mag-Tagalog ; hindi ako magaling mag-Tagalog
puwede bang magsalita ka nang mas mabagal? ; pakibagalan po ; dahan-dahan lang po
paano sabihin ito sa Tagalog? ; paano ito sabihin sa Tagalog ; ano ito sa Tagalog
uuwi na ako ; pauwi na ako
pupunta kami sa beach bukas ; pupunta kami sa dagat bukas ; magbe-beach kami bukas
may dalawa akong anak ; dalawa ang anak ko
maraming salamat sa tulong mo ; maraming salamat po sa tulong ninyo
`)

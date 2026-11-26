import { parseLanguage } from './parse'

export const FRENCH_LEVELS = parseLanguage('French', `
# 1
bonjour ; salut
merci
s'il vous plaît ; s'il te plaît
oui
non
au revoir
bonjour ; bon matin
bonne nuit
excusez-moi ; pardon
je suis désolé ; désolé ; je suis désolée ; désolée
# 2
de rien ; je vous en prie
je ne comprends pas ; je comprends pas
parlez-vous anglais ? ; vous parlez anglais ; tu parles anglais
où sont les toilettes ? ; où est la salle de bain
de l'eau ; l'eau ; eau
c'est combien ? ; combien ça coûte ; combien
au secours ! ; à l'aide
je m'appelle
enchanté ; enchantée
comment allez-vous ? ; comment ça va ; ça va
# 3
un ; 1
deux ; 2
trois ; 3
quatre ; 4
cinq ; 5
six ; 6
sept ; 7
huit ; 8
neuf ; 9
dix ; 10
# 4
la nourriture ; nourriture
le pain ; pain
le riz ; riz
le café ; café
le thé ; thé
le lait ; lait
les fruits ; le fruit ; fruit ; fruits
une pomme ; la pomme ; pomme
le poulet ; poulet
le poisson ; poisson
# 5
à gauche ; gauche
à droite ; droite
tout droit
ici
là-bas ; là
l'hôtel ; hôtel
l'aéroport ; aéroport
la gare ; gare
le billet ; billet ; un billet
le taxi ; taxi
# 6
le médecin ; médecin ; le docteur ; docteur
l'hôpital ; hôpital
la police ; police
la pharmacie ; pharmacie
je suis malade
je suis perdu ; je suis perdue
arrêtez ! ; stop ; arrête
attendez ; attends
lentement, s'il vous plaît ; plus lentement ; lentement
encore, s'il vous plaît ; encore une fois ; répétez s'il vous plaît
# 7
la mère ; mère ; maman
le père ; père ; papa
l'enfant ; enfant
le bébé ; bébé
la grand-mère ; grand-mère ; mamie
le grand-père ; grand-père ; papi
la famille ; famille
l'ami ; ami ; l'amie ; amie ; un ami ; une amie
le garçon ; garçon
la fille ; fille
# 8
rouge
bleu ; bleue
vert ; verte
jaune
noir ; noire
blanc ; blanche
orange
violet ; violette
rose
marron ; brun
# 9
le chien ; chien
le chat ; chat
l'oiseau ; oiseau
le cheval ; cheval
la vache ; vache
le cochon ; cochon
le lapin ; lapin
la souris ; souris
l'ours ; ours
le lion ; lion
# 10
la tête ; tête
l'œil ; oeil ; œil ; les yeux
l'oreille ; oreille
le nez ; nez
la bouche ; bouche
la main ; main
le pied ; pied
le bras ; bras
la jambe ; jambe
les cheveux ; cheveux
# 11
la maison ; maison
la porte ; porte
la fenêtre ; fenêtre
la table ; table
la chaise ; chaise
le lit ; lit
la cuisine ; cuisine
la chambre ; chambre ; la pièce
la clé ; clé ; clef
le livre ; livre
# 12
l'école ; école
le professeur ; professeur ; la maîtresse ; le maître ; prof
l'élève ; élève ; l'étudiant ; étudiant
le stylo ; stylo
le crayon ; crayon
le papier ; papier
le sac ; sac ; le cartable
l'ordinateur ; ordinateur
la classe ; classe ; le cours
les devoirs ; devoirs
# 13
onze ; 11
douze ; 12
quinze ; 15
vingt ; 20
trente ; 30
quarante ; 40
cinquante ; 50
cent ; 100
mille ; 1000 ; 1 000
zéro ; 0
# 14
lundi
mardi
mercredi
jeudi
vendredi
samedi
dimanche
aujourd'hui
demain
hier
# 15
le matin ; matin
l'après-midi ; après-midi
le soir ; soir
la nuit ; nuit
le jour ; jour ; la journée
la semaine ; semaine
le mois ; mois
l'année ; année ; l'an ; an
maintenant
plus tard
# 16
le soleil ; soleil
la lune ; lune
l'étoile ; étoile
la pluie ; pluie
la neige ; neige
le vent ; vent
il fait chaud
il fait froid
l'arbre ; arbre
la fleur ; fleur
# 17
la chemise ; chemise
le pantalon ; pantalon
les chaussures ; chaussures
le chapeau ; chapeau
la robe ; robe
la veste ; veste ; le blouson
les chaussettes ; chaussettes
les lunettes ; lunettes
les vêtements ; vêtements
le parapluie ; parapluie
# 18
le petit déjeuner ; petit déjeuner ; petit-déjeuner
le déjeuner ; déjeuner
le dîner ; dîner ; diner
l'œuf ; oeuf ; œuf ; un œuf
le fromage ; fromage
la soupe ; soupe
le sucre ; sucre
le sel ; sel
la viande ; viande
les légumes ; légumes
# 19
la ville ; ville
le magasin ; magasin
le restaurant ; restaurant
le parc ; parc
la plage ; plage
la banque ; banque
le musée ; musée
la bibliothèque ; bibliothèque
le marché ; marché
la rue ; rue
# 20
grand ; grande
petit ; petite
bon ; bonne ; bien
mauvais ; mauvaise
nouveau ; nouvelle ; neuf
vieux ; vieille
content ; heureux ; contente ; heureuse
triste
rapide ; vite
lent ; lente
# 21
manger
boire
aller
venir
voir
parler
lire
écrire
dormir
jouer
# 22
j'ai faim
j'ai soif
je suis fatigué ; je suis fatiguée
je suis content ; je suis heureux ; je suis contente ; je suis heureuse
j'ai froid
j'ai chaud
j'aime ça ; ça me plaît ; j'aime bien
je n'aime pas ça ; j'aime pas ça ; ça ne me plaît pas
je t'aime
je suis prêt ; je suis prête
# 23
quoi ? ; qu'est-ce que
qui ?
où ?
quand ?
pourquoi ?
comment ?
lequel ? ; laquelle
combien ?
qu'est-ce que c'est ? ; c'est quoi
quelle heure est-il ? ; il est quelle heure
# 24
le menu, s'il vous plaît ; la carte, s'il vous plaît ; la carte
l'addition, s'il vous plaît ; l'addition
une table pour deux, s'il vous plaît ; une table pour deux
je voudrais de l'eau ; je veux de l'eau ; de l'eau s'il vous plaît
c'est délicieux ; c'est très bon
j'ai bien mangé ; je n'ai plus faim ; je suis rassasié
encore un, s'il vous plaît ; un autre s'il vous plaît ; encore une
sans glaçons, s'il vous plaît ; sans glace ; sans glaçons
je vais prendre celui-ci ; je prends celui-ci ; je prends ça
santé ! ; à votre santé ; tchin-tchin
# 25
l'argent ; argent
le prix ; prix
pas cher ; bon marché
cher ; chère
ouvert ; ouverte
fermé ; fermée
la carte bancaire ; carte bancaire ; carte de crédit ; la carte bleue
en espèces ; espèces ; le liquide ; liquide
le reçu ; reçu ; le ticket de caisse
c'est trop cher
# 26
où est l'arrêt de bus ? ; où est l'arrêt de bus
quand part le train ? ; à quelle heure part le train
je veux aller à l'aéroport ; je voudrais aller à l'aéroport
c'est loin ? ; c'est à quelle distance
tournez à gauche ; tourne à gauche
tournez à droite ; tourne à droite
allez tout droit ; va tout droit ; continuez tout droit
c'est près ; c'est tout près ; c'est proche
c'est loin
arrêtez-vous ici, s'il vous plaît ; arrêtez ici s'il vous plaît
# 27
d'où venez-vous ? ; tu viens d'où ; d'où viens-tu
je viens des États-Unis ; je suis des États-Unis ; je suis américain ; je suis américaine
je parle un peu ; je parle un peu français
comment vous appelez-vous ? ; comment tu t'appelles ; tu t'appelles comment
quel âge as-tu ? ; quel âge avez-vous ; tu as quel âge
j'ai dix ans ; j'ai 10 ans
à demain
bonne journée
bonne chance
félicitations
# 28
je me lève tôt
je prends le petit déjeuner ; je prends mon petit déjeuner
je vais à l'école
je vais au travail
j'étudie
je joue avec mes amis ; je joue avec mes copains
je lis un livre
je vais me coucher ; je me couche
je me brosse les dents
je prends une douche
# 29
le chien est grand ; le chien est gros
le chat est petit
la maison est blanche
l'eau est froide
la nourriture est bonne ; c'est bon
le livre est neuf ; le livre est nouveau
ma mère est contente ; ma mère est heureuse
il fait beau ; le temps est beau
le ciel est bleu
le magasin est fermé
# 30
je voudrais une tasse de café ; je voudrais un café
pouvez-vous m'aider, s'il vous plaît ? ; vous pouvez m'aider ; tu peux m'aider
j'apprends le français
je ne parle pas très bien français ; je parle pas très bien français
pouvez-vous parler plus lentement ? ; parlez plus lentement ; vous pouvez parler plus lentement
comment dit-on ça en français ? ; comment on dit ça en français
je rentre à la maison ; je rentre chez moi ; je vais à la maison
on va à la plage demain ; nous allons à la plage demain
j'ai deux enfants ; j'ai 2 enfants
merci beaucoup pour votre aide ; merci beaucoup pour ton aide
`)

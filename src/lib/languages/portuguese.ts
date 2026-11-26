import { parseLanguage } from './parse'

/** European Portuguese (Portugal). */
export const PORTUGUESE_LEVELS = parseLanguage('Portuguese', `
# 1
olá ; ola
obrigado ; obrigada
por favor
sim
não ; nao
adeus ; tchau
bom dia
boa noite
com licença ; desculpe
desculpe ; peço desculpa ; lamento ; desculpa
# 2
de nada
não percebo ; não entendo ; nao percebo
fala inglês? ; fala inglês ; fala ingles
onde é a casa de banho? ; onde fica a casa de banho ; casa de banho
água ; agua
quanto custa? ; quanto é
socorro! ; ajuda
chamo-me ; o meu nome é ; meu nome é
muito prazer ; prazer
como está? ; como estás ; tudo bem
# 3
um ; uma ; 1
dois ; duas ; 2
três ; 3
quatro ; 4
cinco ; 5
seis ; 6
sete ; 7
oito ; 8
nove ; 9
dez ; 10
# 4
a comida ; comida
o pão ; pão ; pao
o arroz ; arroz
o café ; café ; uma bica
o chá ; chá
o leite ; leite
a fruta ; fruta
a maçã ; maçã ; maca
o frango ; frango
o peixe ; peixe
# 5
à esquerda ; esquerda
à direita ; direita
em frente ; sempre em frente
aqui
ali ; lá
o hotel ; hotel
o aeroporto ; aeroporto
a estação de comboios ; estação de comboios ; a estação ; estação
o bilhete ; bilhete
o táxi ; táxi ; taxi
# 6
o médico ; médico ; o doutor
o hospital ; hospital
a polícia ; polícia ; policia
a farmácia ; farmácia ; farmacia
estou doente
estou perdido ; estou perdida
pare! ; pára ; para
espere ; espera
devagar, por favor ; mais devagar ; devagar
outra vez, por favor ; outra vez ; pode repetir
# 7
a mãe ; mãe ; mae
o pai ; pai
a criança ; criança ; o filho ; a filha
o bebé ; bebé ; bebe
a avó ; avó
o avô ; avô
a família ; família ; familia
o amigo ; amigo ; a amiga ; amiga
o rapaz ; rapaz ; o menino ; menino
a rapariga ; rapariga ; a menina ; menina
# 8
vermelho ; vermelha
azul
verde
amarelo ; amarela
preto ; preta
branco ; branca
cor de laranja ; laranja
roxo ; roxa
cor-de-rosa ; rosa
castanho ; castanha
# 9
o cão ; cão ; cao
o gato ; gato
o pássaro ; pássaro ; passaro ; a ave
o cavalo ; cavalo
a vaca ; vaca
o porco ; porco
o coelho ; coelho
o rato ; rato
o urso ; urso
o leão ; leão ; leao
# 10
a cabeça ; cabeça ; cabeca
o olho ; olho
a orelha ; orelha
o nariz ; nariz
a boca ; boca
a mão ; mão ; mao
o pé ; pé
o braço ; braço ; braco
a perna ; perna
o cabelo ; cabelo
# 11
a casa ; casa
a porta ; porta
a janela ; janela
a mesa ; mesa
a cadeira ; cadeira
a cama ; cama
a cozinha ; cozinha
o quarto ; quarto ; a sala
a chave ; chave
o livro ; livro
# 12
a escola ; escola
o professor ; professor ; a professora ; professora
o aluno ; aluno ; a aluna ; aluna ; estudante
a caneta ; caneta
o lápis ; lápis ; lapis
o papel ; papel
a mochila ; mochila ; o saco ; a mala
o computador ; computador
a aula ; aula ; a turma
os trabalhos de casa ; trabalhos de casa ; o trabalho de casa
# 13
onze ; 11
doze ; 12
quinze ; 15
vinte ; 20
trinta ; 30
quarenta ; 40
cinquenta ; 50
cem ; 100
mil ; 1000
zero ; 0
# 14
segunda-feira ; segunda
terça-feira ; terça
quarta-feira ; quarta
quinta-feira ; quinta
sexta-feira ; sexta
sábado ; sabado
domingo
hoje
amanhã ; amanha
ontem
# 15
a manhã ; manhã ; de manhã
a tarde ; tarde ; à tarde
o fim da tarde ; à noitinha ; o serão
a noite ; noite
o dia ; dia
a semana ; semana
o mês ; mês ; mes
o ano ; ano
agora
mais tarde ; depois
# 16
o sol ; sol
a lua ; lua
a estrela ; estrela
a chuva ; chuva
a neve ; neve
o vento ; vento
está calor ; faz calor
está frio ; faz frio
a árvore ; árvore ; arvore
a flor ; flor
# 17
a camisa ; camisa
as calças ; calças ; calcas
os sapatos ; sapatos
o chapéu ; chapéu ; chapeu
o vestido ; vestido
o casaco ; casaco
as meias ; meias
os óculos ; óculos ; oculos
a roupa ; roupa
o guarda-chuva ; guarda-chuva
# 18
o pequeno-almoço ; pequeno-almoço ; pequeno almoço
o almoço ; almoço ; almoco
o jantar ; jantar
o ovo ; ovo
o queijo ; queijo
a sopa ; sopa
o açúcar ; açúcar ; acucar
o sal ; sal
a carne ; carne
os legumes ; legumes ; vegetais
# 19
a cidade ; cidade
a loja ; loja
o restaurante ; restaurante
o parque ; parque ; o jardim
a praia ; praia
o banco ; banco
o museu ; museu
a biblioteca ; biblioteca
o mercado ; mercado
a rua ; rua
# 20
grande
pequeno ; pequena
bom ; boa
mau ; má ; ruim
novo ; nova
velho ; velha
feliz ; contente
triste
rápido ; rápida ; rapido
lento ; lenta ; devagar
# 21
comer
beber
ir
vir
ver
falar
ler
escrever
dormir
brincar ; jogar
# 22
tenho fome
tenho sede
estou cansado ; estou cansada
estou feliz ; estou contente
tenho frio
tenho calor
gosto ; gosto disto ; eu gosto
não gosto ; não gosto disto ; nao gosto
amo-te ; eu amo-te ; adoro-te
estou pronto ; estou pronta
# 23
o quê? ; o que ; que
quem?
onde?
quando?
porquê? ; porque ; por que
como?
qual?
quantos? ; quantas
o que é isto? ; o que é isso
que horas são? ; que horas são
# 24
a ementa, por favor ; o menu, por favor ; a ementa
a conta, por favor ; a conta
uma mesa para dois, por favor ; mesa para dois
quero água ; queria água ; quero agua
está delicioso ; está muito bom ; delicioso
estou cheio ; estou cheia ; estou satisfeito
mais um, por favor ; mais uma, por favor ; outro, por favor
sem gelo, por favor ; sem gelo
vou querer este ; quero este ; este, por favor
saúde! ; saude
# 25
o dinheiro ; dinheiro
o preço ; preço ; preco
barato ; barata
caro ; cara
aberto ; aberta
fechado ; fechada
o cartão de crédito ; cartão de crédito ; cartão ; o multibanco
em dinheiro ; dinheiro vivo ; numerário
o recibo ; recibo ; a fatura ; a factura
é muito caro ; está muito caro ; é caro demais
# 26
onde é a paragem do autocarro? ; onde fica a paragem do autocarro ; paragem de autocarro
quando parte o comboio? ; a que horas parte o comboio ; quando sai o comboio
quero ir para o aeroporto ; quero ir ao aeroporto ; queria ir para o aeroporto
fica longe? ; é longe ; a que distância fica
vire à esquerda ; vira à esquerda
vire à direita ; vira à direita
siga em frente ; vá em frente ; sempre em frente
fica perto ; é perto ; está perto
fica longe ; é longe
pare aqui, por favor ; pode parar aqui
# 27
de onde é? ; de onde és ; de onde é que é
sou dos Estados Unidos ; sou americano ; sou americana
falo um pouco ; falo um pouco de português
como se chama? ; como te chamas ; qual é o seu nome
quantos anos tem? ; quantos anos tens
tenho dez anos ; tenho 10 anos
até amanhã ; ate amanha
tenha um bom dia ; bom dia para si ; tem um bom dia
boa sorte
parabéns ; parabens
# 28
acordo cedo ; levanto-me cedo
tomo o pequeno-almoço ; tomo o pequeno almoço
vou para a escola ; vou à escola
vou para o trabalho ; vou trabalhar
estudo ; eu estudo
brinco com os meus amigos ; jogo com os meus amigos ; brinco com os amigos
leio um livro
vou para a cama ; vou dormir ; deito-me
lavo os dentes ; escovo os dentes
tomo banho ; tomo duche
# 29
o cão é grande
o gato é pequeno
a casa é branca
a água está fria ; a água é fria
a comida é boa ; a comida está boa
o livro é novo
a minha mãe está feliz ; a minha mãe está contente
está bom tempo ; o tempo está bom
o céu é azul ; o céu está azul
a loja está fechada
# 30
queria uma chávena de café ; queria um café ; quero um café
pode ajudar-me, por favor? ; pode ajudar-me ; podes ajudar-me
estou a aprender português ; estou a aprender portugues
não falo português muito bem ; não falo muito bem português
pode falar mais devagar? ; fale mais devagar ; pode falar mais devagar
como se diz isto em português? ; como se diz isto em portugues
vou para casa
amanhã vamos à praia ; vamos à praia amanhã
tenho dois filhos ; tenho 2 filhos
muito obrigado pela sua ajuda ; muito obrigada pela sua ajuda ; muito obrigado pela ajuda
`)

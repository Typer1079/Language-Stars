import { parseLanguage } from './parse'

/** Korean. Shown in English letters (Revised Romanization); matched against Hangul. */
export const KOREAN_LEVELS = parseLanguage('Korean', `
# 1
안녕하세요 | annyeonghaseyo ; 안녕
감사합니다 | gamsahamnida ; 고맙습니다 ; 고마워요 ; 고마워
주세요 | juseyo ; 부탁합니다 ; 부탁해요
네 | ne ; 예 ; 응
아니요 | aniyo ; 아니오 ; 아니
안녕히 가세요 | annyeonghi gaseyo ; 안녕히 계세요 ; 잘 가 ; 안녕
좋은 아침이에요 | joeun achimieyo ; 좋은 아침 ; 좋은 아침입니다
안녕히 주무세요 | annyeonghi jumuseyo ; 잘 자 ; 잘 자요
실례합니다 | sillyehamnida ; 저기요
죄송합니다 | joesonghamnida ; 미안해요 ; 미안합니다 ; 미안해
# 2
천만에요 | cheonmaneyo ; 별말씀을요
이해가 안 돼요 | ihaega an dwaeyo ; 모르겠어요 ; 이해 못 했어요
영어 할 수 있어요? | yeongeo hal su isseoyo ; 영어 하세요 ; 영어 할 줄 아세요
화장실이 어디예요? | hwajangsiri eodiyeyo ; 화장실 어디예요 ; 화장실이 어디에 있어요
물 | mul
얼마예요? | eolmayeyo ; 얼마에요 ; 얼마
도와주세요 | dowajuseyo ; 살려주세요 ; 도와줘
제 이름은 | je ireumeun ; 저는
만나서 반가워요 | mannaseo bangawoyo ; 만나서 반갑습니다 ; 반가워요
어떻게 지내세요? | eotteoke jinaeseyo ; 잘 지내요 ; 잘 지내세요
# 3
하나 | hana ; 일 ; 1
둘 | dul ; 이 ; 2
셋 | set ; 삼 ; 3
넷 | net ; 사 ; 4
다섯 | daseot ; 오 ; 5
여섯 | yeoseot ; 육 ; 6
일곱 | ilgop ; 칠 ; 7
여덟 | yeodeol ; 팔 ; 8
아홉 | ahop ; 구 ; 9
열 | yeol ; 십 ; 10
# 4
음식 | eumsik
빵 | ppang
밥 | bap ; 쌀
커피 | keopi
차 | cha
우유 | uyu
과일 | gwail
사과 | sagwa
닭고기 | dakgogi ; 치킨
생선 | saengseon ; 물고기
# 5
왼쪽 | oenjjok
오른쪽 | oreunjjok
똑바로 | ttokbaro ; 직진 ; 쭉
여기 | yeogi
저기 | jeogi ; 거기
호텔 | hotel
공항 | gonghang
기차역 | gichayeok ; 역
표 | pyo ; 티켓
택시 | taeksi
# 6
의사 | uisa ; 의사 선생님
병원 | byeongwon
경찰 | gyeongchal ; 경찰서
약국 | yakguk
아파요 | apayo ; 아파요 ; 몸이 아파요
길을 잃었어요 | gireul ilheosseoyo ; 길 잃었어요
멈춰요 | meomchwoyo ; 멈춰 ; 그만 ; 서
기다려요 | gidaryeoyo ; 기다려 ; 잠깐만요 ; 기다려 주세요
천천히 말해 주세요 | cheoncheonhi malhae juseyo ; 천천히 해 주세요 ; 천천히
다시 말해 주세요 | dasi malhae juseyo ; 한 번 더 ; 다시 한번
# 7
어머니 | eomeoni ; 엄마
아버지 | abeoji ; 아빠
아이 | ai ; 어린이 ; 애
아기 | agi
할머니 | halmeoni
할아버지 | harabeoji
가족 | gajok
친구 | chingu
남자아이 | namjaai ; 소년 ; 남자 아이
여자아이 | yeojaai ; 소녀 ; 여자 아이
# 8
빨간색 | ppalgansaek ; 빨강 ; 빨간
파란색 | paransaek ; 파랑 ; 파란
초록색 | choroksaek ; 초록 ; 녹색
노란색 | noransaek ; 노랑 ; 노란
검은색 | geomeunsaek ; 검정 ; 까만색
흰색 | huinsaek ; 하얀색 ; 하양
주황색 | juhwangsaek ; 오렌지색 ; 주황
보라색 | borasaek ; 보라
분홍색 | bunhongsaek ; 핑크 ; 분홍
갈색 | galsaek
# 9
개 | gae ; 강아지
고양이 | goyangi
새 | sae
말 | mal
소 | so
돼지 | dwaeji
토끼 | tokki
쥐 | jwi
곰 | gom
사자 | saja
# 10
머리 | meori
눈 | nun
귀 | gwi
코 | ko
입 | ip
손 | son
발 | bal
팔 | pal
다리 | dari
머리카락 | meorikarak ; 머리
# 11
집 | jip
문 | mun
창문 | changmun
탁자 | takja ; 테이블 ; 식탁
의자 | uija
침대 | chimdae
부엌 | bueok ; 주방
방 | bang
열쇠 | yeolsoe ; 키
책 | chaek
# 12
학교 | hakgyo
선생님 | seonsaengnim
학생 | haksaeng
펜 | pen ; 볼펜
연필 | yeonpil
종이 | jongi
가방 | gabang
컴퓨터 | keompyuteo
수업 | sueop ; 반
숙제 | sukje
# 13
열하나 | yeolhana ; 십일 ; 11
열둘 | yeoldul ; 십이 ; 12
열다섯 | yeoldaseot ; 십오 ; 15
스물 | seumul ; 이십 ; 20
서른 | seoreun ; 삼십 ; 30
마흔 | maheun ; 사십 ; 40
쉰 | swin ; 오십 ; 50
백 | baek ; 100
천 | cheon ; 1000
영 | yeong ; 공 ; 제로 ; 0
# 14
월요일 | woryoil
화요일 | hwayoil
수요일 | suyoil
목요일 | mogyoil
금요일 | geumyoil
토요일 | toyoil
일요일 | iryoil
오늘 | oneul
내일 | naeil
어제 | eoje
# 15
아침 | achim
오후 | ohu
저녁 | jeonyeok
밤 | bam
낮 | nat ; 하루 ; 날
주 | ju ; 일주일
달 | dal ; 월 ; 한 달
해 | hae ; 년 ; 일 년
지금 | jigeum
나중에 | najunge ; 이따가
# 16
해 | hae ; 태양
달 | dal
별 | byeol
비 | bi
눈 | nun
바람 | baram
더워요 | deowoyo ; 덥다 ; 더워
추워요 | chuwoyo ; 춥다 ; 추워
나무 | namu
꽃 | kkot
# 17
셔츠 | syeocheu
바지 | baji
신발 | sinbal ; 구두
모자 | moja
원피스 | wonpiseu ; 드레스
재킷 | jaekit ; 자켓 ; 외투
양말 | yangmal
안경 | angyeong
옷 | ot
우산 | usan
# 18
아침밥 | achimbap ; 아침 식사 ; 아침
점심 | jeomsim ; 점심 식사
저녁밥 | jeonyeokbap ; 저녁 식사 ; 저녁
계란 | gyeran ; 달걀
치즈 | chijeu
수프 | supeu ; 국 ; 스프
설탕 | seoltang
소금 | sogeum
고기 | gogi
채소 | chaeso ; 야채
# 19
도시 | dosi
가게 | gage ; 상점
식당 | sikdang ; 레스토랑
공원 | gongwon
해변 | haebyeon ; 바닷가
은행 | eunhaeng
박물관 | bangmulgwan
도서관 | doseogwan
시장 | sijang
거리 | geori ; 길
# 20
커요 | keoyo ; 크다 ; 큰
작아요 | jagayo ; 작다 ; 작은
좋아요 | joayo ; 좋다 ; 좋은
나빠요 | nappayo ; 나쁘다 ; 나쁜
새로워요 | saerowoyo ; 새롭다 ; 새
오래됐어요 | oraedwaesseoyo ; 낡다 ; 오래된 ; 낡은
행복해요 | haengbokhaeyo ; 행복하다 ; 기뻐요
슬퍼요 | seulpeoyo ; 슬프다
빨라요 | ppallayo ; 빠르다 ; 빠른
느려요 | neuryeoyo ; 느리다 ; 느린
# 21
먹다 | meokda ; 먹어요
마시다 | masida ; 마셔요
가다 | gada ; 가요
오다 | oda ; 와요
보다 | boda ; 봐요
말하다 | malhada ; 말해요
읽다 | ikda ; 읽어요
쓰다 | sseuda ; 써요
자다 | jada ; 자요
놀다 | nolda ; 놀아요
# 22
배고파요 | baegopayo ; 배고파
목말라요 | mongmallayo ; 목말라
피곤해요 | pigonhaeyo ; 피곤해
행복해요 | haengbokhaeyo ; 기뻐요 ; 행복해
추워요 | chuwoyo ; 추워
더워요 | deowoyo ; 더워
좋아해요 | joahaeyo ; 좋아요 ; 마음에 들어요
안 좋아해요 | an joahaeyo ; 싫어요 ; 마음에 안 들어요
사랑해요 | saranghaeyo ; 사랑해
준비됐어요 | junbidwaesseoyo ; 준비됐어 ; 준비 완료
# 23
뭐예요? | mwoyeyo ; 뭐 ; 무엇
누구예요? | nuguyeyo ; 누구
어디예요? | eodiyeyo ; 어디
언제예요? | eonjeyeyo ; 언제
왜요? | waeyo ; 왜
어떻게요? | eotteokeyo ; 어떻게
어느 거요? | eoneu geoyo ; 어느 것 ; 어떤 거
몇 개예요? | myeot gaeyeyo ; 몇 개 ; 얼마나
이게 뭐예요? | ige mwoyeyo ; 이것은 무엇입니까 ; 이거 뭐예요
지금 몇 시예요? | jigeum myeot siyeyo ; 몇 시예요 ; 몇 시
# 24
메뉴 주세요 | menyu juseyo ; 메뉴판 주세요
계산서 주세요 | gyesanseo juseyo ; 계산해 주세요 ; 계산이요
두 명이요 | du myeongiyo ; 두 사람이요 ; 두 명 자리 주세요
물 주세요 | mul juseyo ; 물 좀 주세요
맛있어요 | masisseoyo ; 맛있다 ; 정말 맛있어요
배불러요 | baebulleoyo ; 배불러
하나 더 주세요 | hana deo juseyo ; 하나 더
얼음 빼 주세요 | eoreum ppae juseyo ; 얼음 없이 주세요 ; 얼음 없이
이걸로 할게요 | igeollo halgeyo ; 이거 주세요 ; 이걸로 주세요
건배 | geonbae
# 25
돈 | don
가격 | gagyeok ; 값
싸요 | ssayo ; 싸다 ; 저렴해요
비싸요 | bissayo ; 비싸다
열었어요 | yeoreosseoyo ; 영업 중 ; 열려 있어요
닫았어요 | dadasseoyo ; 영업 종료 ; 닫혀 있어요
신용카드 | sinyongkadeu ; 카드
현금 | hyeongeum
영수증 | yeongsujeung
너무 비싸요 | neomu bissayo ; 너무 비싸
# 26
버스 정류장이 어디예요? | beoseu jeongnyujangi eodiyeyo ; 버스 정류장 어디예요
기차가 언제 떠나요? | gichaga eonje tteonayo ; 기차 언제 출발해요 ; 기차가 몇 시에 떠나요
공항에 가고 싶어요 | gonghange gago sipeoyo ; 공항 가 주세요 ; 공항으로 가고 싶어요
얼마나 멀어요? | eolmana meoreoyo ; 멀어요 ; 얼마나 걸려요
왼쪽으로 가세요 | oenjjogeuro gaseyo ; 좌회전 ; 왼쪽으로 도세요
오른쪽으로 가세요 | oreunjjogeuro gaseyo ; 우회전 ; 오른쪽으로 도세요
똑바로 가세요 | ttokbaro gaseyo ; 직진하세요 ; 쭉 가세요
가까워요 | gakkawoyo ; 가깝다 ; 가까워
멀어요 | meoreoyo ; 멀다 ; 멀어
여기서 세워 주세요 | yeogiseo sewo juseyo ; 여기서 내려 주세요 ; 여기 세워 주세요
# 27
어디에서 왔어요? | eodieseo wasseoyo ; 어디서 왔어요 ; 어느 나라 사람이에요
미국에서 왔어요 | migugeseo wasseoyo ; 미국 사람이에요 ; 미국에서 왔습니다
조금 할 수 있어요 | jogeum hal su isseoyo ; 조금 해요 ; 한국어 조금 해요
이름이 뭐예요? | ireumi mwoyeyo ; 성함이 어떻게 되세요 ; 이름이 뭐야
몇 살이에요? | myeot sarieyo ; 나이가 어떻게 되세요 ; 몇 살이야
열 살이에요 | yeol sarieyo ; 10살이에요 ; 열 살
내일 봐요 | naeil bwayo ; 내일 만나요 ; 내일 봐
좋은 하루 보내세요 | joeun haru bonaeseyo ; 좋은 하루 되세요
행운을 빌어요 | haenguneul bireoyo ; 화이팅 ; 파이팅
축하해요 | chukahaeyo ; 축하합니다 ; 축하해
# 28
일찍 일어나요 | iljjik ireonayo ; 일찍 일어납니다
아침을 먹어요 | achimeul meogeoyo ; 아침 먹어요 ; 아침밥을 먹어요
학교에 가요 | hakgyoe gayo ; 학교 가요
회사에 가요 | hoesae gayo ; 일하러 가요 ; 출근해요
공부해요 | gongbuhaeyo ; 공부합니다
친구들하고 놀아요 | chingudeulhago norayo ; 친구들이랑 놀아요 ; 친구랑 놀아요
책을 읽어요 | chaegeul ilgeoyo ; 책 읽어요
자러 가요 | jareo gayo ; 잠자리에 들어요 ; 자요
이를 닦아요 | ireul dakkayo ; 양치해요 ; 양치질해요
샤워해요 | syawohaeyo ; 샤워를 해요
# 29
개가 커요 | gaega keoyo ; 개는 커요 ; 강아지가 커요
고양이가 작아요 | goyangiga jagayo ; 고양이는 작아요
집이 하얘요 | jibi hayaeyo ; 집은 하얀색이에요 ; 집이 하얗다
물이 차가워요 | muri chagawoyo ; 물이 차가워 ; 물은 차가워요
음식이 맛있어요 | eumsigi masisseoyo ; 음식이 좋아요
책이 새것이에요 | chaegi saegeosieyo ; 새 책이에요 ; 책이 새 거예요
엄마가 행복해요 | eommaga haengbokhaeyo ; 어머니가 행복해요 ; 우리 엄마는 행복해요
날씨가 좋아요 | nalssiga joayo ; 날씨 좋아요
하늘이 파래요 | haneuri paraeyo ; 하늘이 파랗다 ; 하늘은 파래요
가게가 닫았어요 | gagega dadasseoyo ; 가게가 문을 닫았어요 ; 가게 닫았어요
# 30
커피 한 잔 주세요 | keopi han jan juseyo ; 커피 한 잔 마시고 싶어요
좀 도와주시겠어요? | jom dowajusigesseoyo ; 도와주세요 ; 좀 도와주세요
한국어를 배우고 있어요 | hangugeoreul baeugo isseoyo ; 한국어 배우고 있어요
한국어를 잘 못해요 | hangugeoreul jal motaeyo ; 한국어 잘 못해요
좀 더 천천히 말해 주세요 | jom deo cheoncheonhi malhae juseyo ; 천천히 말해 주세요
이거 한국어로 뭐라고 해요? | igeo hangugeoro mworago haeyo ; 한국어로 뭐예요
집에 가요 | jibe gayo ; 집에 갈게요 ; 집에 가요
내일 해변에 가요 | naeil haebyeone gayo ; 내일 바다에 가요 ; 우리 내일 바다에 가요
아이가 두 명 있어요 | aiga du myeong isseoyo ; 아이가 둘 있어요
도와주셔서 정말 감사합니다 | dowajusyeoseo jeongmal gamsahamnida ; 도와줘서 고마워요
`)

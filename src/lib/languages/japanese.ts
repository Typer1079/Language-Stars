import { parseLanguage } from './parse'

/**
 * Japanese. Shown in English letters (Hepburn, long vowels written ou / ii / ee); matched against
 * what speech recognition writes (kanji and kana), with kana and other common spellings accepted.
 */
export const JAPANESE_LEVELS = parseLanguage('Japanese', `
# 1
こんにちは | konnichiwa ; こんにちわ ; 今日は
ありがとう | arigatou ; ありがとうございます ; 有難う
お願いします | onegaishimasu ; おねがいします ; ください
はい | hai ; ええ
いいえ | iie ; いや
さようなら | sayounara ; さよなら ; じゃあね ; バイバイ
おはようございます | ohayou gozaimasu ; おはよう
おやすみなさい | oyasuminasai ; おやすみ ; お休みなさい
すみません | sumimasen ; すいません
ごめんなさい | gomennasai ; ごめん ; 御免なさい
# 2
どういたしまして | dou itashimashite
わかりません | wakarimasen ; 分かりません ; 分からない ; わからない
英語を話せますか | eigo o hanasemasu ka ; 英語話せますか ; えいごをはなせますか ; 英語できますか
トイレはどこですか | toire wa doko desu ka ; トイレどこですか ; といれはどこですか
水 | mizu ; みず ; お水 ; おみず
いくらですか | ikura desu ka ; いくら
助けて | tasukete ; たすけて
私の名前は | watashi no namae wa ; わたしのなまえは ; 私は
はじめまして | hajimemashite ; 初めまして
お元気ですか | ogenki desu ka ; おげんきですか ; 元気ですか
# 3
一 | ichi ; いち ; 1
二 | ni ; に ; 2
三 | san ; さん ; 3
四 | yon ; よん ; し ; 4
五 | go ; ご ; 5
六 | roku ; ろく ; 6
七 | nana ; なな ; しち ; 7
八 | hachi ; はち ; 8
九 | kyuu ; きゅう ; く ; 9
十 | juu ; じゅう ; 10
# 4
食べ物 | tabemono ; たべもの
パン | pan
ご飯 | gohan ; ごはん ; ご飯 ; 米 ; ライス
コーヒー | koohii ; 珈琲
お茶 | ocha ; おちゃ ; 茶
牛乳 | gyuunyuu ; ぎゅうにゅう ; ミルク
果物 | kudamono ; くだもの ; フルーツ
りんご | ringo ; リンゴ ; 林檎
鶏肉 | toriniku ; とりにく ; チキン
魚 | sakana ; さかな
# 5
左 | hidari ; ひだり
右 | migi ; みぎ
まっすぐ | massugu ; 真っ直ぐ ; 真っすぐ
ここ | koko ; 此処
あそこ | asoko ; そこ
ホテル | hoteru
空港 | kuukou ; くうこう
駅 | eki ; えき
切符 | kippu ; きっぷ ; チケット
タクシー | takushii
# 6
医者 | isha ; いしゃ ; お医者さん
病院 | byouin ; びょういん
警察 | keisatsu ; けいさつ
薬局 | yakkyoku ; やっきょく ; 薬屋
病気です | byouki desu ; びょうきです ; 具合が悪いです
道に迷いました | michi ni mayoimashita ; みちにまよいました ; 迷子です ; 迷いました
止まれ | tomare ; 止まって ; とまって ; ストップ
待って | matte ; まって ; 待ってください
ゆっくりお願いします | yukkuri onegaishimasu ; ゆっくり ; ゆっくりおねがいします
もう一度お願いします | mou ichido onegaishimasu ; もう一度 ; もういちど
# 7
お母さん | okaasan ; おかあさん ; 母 ; はは
お父さん | otousan ; おとうさん ; 父 ; ちち
子供 | kodomo ; こども ; 子ども
赤ちゃん | akachan ; あかちゃん
おばあさん | obaasan ; おばあちゃん ; 祖母
おじいさん | ojiisan ; おじいちゃん ; 祖父
家族 | kazoku ; かぞく
友達 | tomodachi ; ともだち ; 友だち
男の子 | otoko no ko ; おとこのこ
女の子 | onna no ko ; おんなのこ
# 8
赤 | aka ; あか ; 赤い
青 | ao ; あお ; 青い
緑 | midori ; みどり
黄色 | kiiro ; きいろ ; 黄色い
黒 | kuro ; くろ ; 黒い
白 | shiro ; しろ ; 白い
オレンジ色 | orenji iro ; オレンジ ; だいだい色
紫 | murasaki ; むらさき
ピンク | pinku ; 桃色
茶色 | chairo ; ちゃいろ
# 9
犬 | inu ; いぬ
猫 | neko ; ねこ
鳥 | tori ; とり
馬 | uma ; うま
牛 | ushi ; うし
豚 | buta ; ぶた
うさぎ | usagi ; ウサギ ; 兎
ねずみ | nezumi ; ネズミ ; 鼠
熊 | kuma ; くま ; クマ
ライオン | raion
# 10
頭 | atama ; あたま
目 | me ; め
耳 | mimi ; みみ
鼻 | hana ; はな
口 | kuchi ; くち
手 | te ; て
足 | ashi ; あし
腕 | ude ; うで
脚 | ashi ; あし ; 足
髪 | kami ; かみ ; 髪の毛
# 11
家 | ie ; いえ ; うち
ドア | doa ; 扉 ; 戸
窓 | mado ; まど
テーブル | teeburu ; 机
椅子 | isu ; いす ; イス
ベッド | beddo
台所 | daidokoro ; だいどころ ; キッチン
部屋 | heya ; へや
鍵 | kagi ; かぎ ; カギ
本 | hon ; ほん
# 12
学校 | gakkou ; がっこう
先生 | sensei ; せんせい
学生 | gakusei ; がくせい ; 生徒
ペン | pen
鉛筆 | enpitsu ; えんぴつ
紙 | kami ; かみ
かばん | kaban ; カバン ; 鞄
コンピューター | konpyuutaa ; パソコン ; コンピュータ
授業 | jugyou ; じゅぎょう ; クラス
宿題 | shukudai ; しゅくだい
# 13
十一 | juuichi ; じゅういち ; 11
十二 | juuni ; じゅうに ; 12
十五 | juugo ; じゅうご ; 15
二十 | nijuu ; にじゅう ; 20
三十 | sanjuu ; さんじゅう ; 30
四十 | yonjuu ; よんじゅう ; 40
五十 | gojuu ; ごじゅう ; 50
百 | hyaku ; ひゃく ; 100
千 | sen ; せん ; 1000
ゼロ | zero ; 零 ; れい ; 0
# 14
月曜日 | getsuyoubi ; げつようび
火曜日 | kayoubi ; かようび
水曜日 | suiyoubi ; すいようび
木曜日 | mokuyoubi ; もくようび
金曜日 | kin'youbi ; きんようび
土曜日 | doyoubi ; どようび
日曜日 | nichiyoubi ; にちようび
今日 | kyou ; きょう
明日 | ashita ; あした
昨日 | kinou ; きのう
# 15
朝 | asa ; あさ
午後 | gogo ; ごご
夕方 | yuugata ; ゆうがた
夜 | yoru ; よる
日 | hi ; ひ ; 一日
週 | shuu ; しゅう ; 一週間
月 | tsuki ; つき ; 一か月
年 | toshi ; とし ; 一年
今 | ima ; いま
後で | ato de ; あとで
# 16
太陽 | taiyou ; たいよう ; お日様
月 | tsuki ; つき
星 | hoshi ; ほし
雨 | ame ; あめ
雪 | yuki ; ゆき
風 | kaze ; かぜ
暑い | atsui ; あつい
寒い | samui ; さむい
木 | ki ; き
花 | hana ; はな
# 17
シャツ | shatsu
ズボン | zubon ; パンツ
靴 | kutsu ; くつ
帽子 | boushi ; ぼうし
ワンピース | wanpiisu ; ドレス
ジャケット | jaketto ; 上着
靴下 | kutsushita ; くつした
眼鏡 | megane ; めがね ; メガネ
服 | fuku ; ふく
傘 | kasa ; かさ
# 18
朝ご飯 | asagohan ; あさごはん ; 朝ごはん ; 朝食
昼ご飯 | hirugohan ; ひるごはん ; 昼ごはん ; お昼
晩ご飯 | bangohan ; ばんごはん ; 晩ごはん ; 夕食 ; 夕ご飯
卵 | tamago ; たまご ; 玉子
チーズ | chiizu
スープ | suupu
砂糖 | satou ; さとう
塩 | shio ; しお
肉 | niku ; にく
野菜 | yasai ; やさい
# 19
町 | machi ; まち ; 市 ; 都市
店 | mise ; みせ ; お店
レストラン | resutoran
公園 | kouen ; こうえん
ビーチ | biichi ; 海岸 ; 浜辺
銀行 | ginkou ; ぎんこう
博物館 | hakubutsukan ; はくぶつかん ; 美術館
図書館 | toshokan ; としょかん
市場 | ichiba ; いちば
通り | toori ; とおり ; 道
# 20
大きい | ookii ; おおきい
小さい | chiisai ; ちいさい
いい | ii ; 良い ; よい
悪い | warui ; わるい
新しい | atarashii ; あたらしい
古い | furui ; ふるい
嬉しい | ureshii ; うれしい ; 楽しい
悲しい | kanashii ; かなしい
速い | hayai ; はやい ; 早い
遅い | osoi ; おそい
# 21
食べる | taberu ; たべる
飲む | nomu ; のむ
行く | iku ; いく
来る | kuru ; くる
見る | miru ; みる
話す | hanasu ; はなす
読む | yomu ; よむ
書く | kaku ; かく
寝る | neru ; ねる
遊ぶ | asobu ; あそぶ
# 22
お腹が空きました | onaka ga sukimashita ; おなかがすきました ; お腹すいた ; おなかすいた
喉が渇きました | nodo ga kawakimashita ; のどがかわきました ; 喉渇いた
疲れました | tsukaremashita ; つかれました ; 疲れた
嬉しいです | ureshii desu ; うれしいです ; 幸せです
寒いです | samui desu ; さむいです
暑いです | atsui desu ; あついです
好きです | suki desu ; すきです ; 好き
好きじゃないです | suki ja nai desu ; 好きではありません ; 好きじゃない
愛してる | aishiteru ; あいしてる ; 大好き ; 愛しています
準備ができました | junbi ga dekimashita ; 準備できた ; 準備オッケー
# 23
何 | nani ; なに ; なん
誰 | dare ; だれ
どこ | doko ; 何処
いつ | itsu
なぜ | naze ; どうして ; なんで
どうやって | dou yatte ; どう
どれ | dore ; どちら
いくつ | ikutsu ; 何個 ; 幾つ
これは何ですか | kore wa nan desu ka ; これなに ; これは何
今何時ですか | ima nanji desu ka ; 何時ですか ; いまなんじですか
# 24
メニューをお願いします | menyuu o onegaishimasu ; メニューください ; メニューお願いします
お会計お願いします | okaikei onegaishimasu ; お勘定お願いします ; お会計
二人です | futari desu ; ふたりです ; 二人
お水をください | omizu o kudasai ; 水をください ; 水ください
美味しいです | oishii desu ; おいしいです ; 美味しい ; おいしい
お腹いっぱいです | onaka ippai desu ; おなかいっぱい ; お腹いっぱい
もう一つお願いします | mou hitotsu onegaishimasu ; もうひとつ ; もう一つ
氷なしでお願いします | koori nashi de onegaishimasu ; 氷なし ; こおりなし
これにします | kore ni shimasu ; これください ; これをお願いします
乾杯 | kanpai ; かんぱい
# 25
お金 | okane ; おかね
値段 | nedan ; ねだん
安い | yasui ; やすい
高い | takai ; たかい
開いています | aite imasu ; 営業中 ; オープン ; 開いてる
閉まっています | shimatte imasu ; 閉店 ; 閉まってる
クレジットカード | kurejitto kaado ; カード
現金 | genkin ; げんきん
レシート | reshiito ; 領収書
高すぎます | takasugimasu ; たかすぎます ; 高すぎる
# 26
バス停はどこですか | basutei wa doko desu ka ; バス停どこですか ; ばすていはどこですか
電車はいつ出ますか | densha wa itsu demasu ka ; 電車は何時に出ますか
空港に行きたいです | kuukou ni ikitai desu ; 空港へ行きたいです ; 空港に行きたい
どのくらい遠いですか | dono kurai tooi desu ka ; 遠いですか ; どれくらい遠いですか
左に曲がってください | hidari ni magatte kudasai ; 左に曲がって ; 左折
右に曲がってください | migi ni magatte kudasai ; 右に曲がって ; 右折
まっすぐ行ってください | massugu itte kudasai ; まっすぐ行って ; 真っ直ぐ行ってください
近いです | chikai desu ; ちかいです ; 近い
遠いです | tooi desu ; とおいです ; 遠い
ここで止めてください | koko de tomete kudasai ; ここで止めて ; ここでお願いします
# 27
どこから来ましたか | doko kara kimashita ka ; どちらからですか ; 出身はどこですか
アメリカから来ました | amerika kara kimashita ; アメリカ出身です ; アメリカ人です
少し話せます | sukoshi hanasemasu ; すこしはなせます ; 少しだけ話せます
お名前は何ですか | onamae wa nan desu ka ; 名前は何ですか ; お名前は
何歳ですか | nansai desu ka ; なんさいですか ; おいくつですか
十歳です | jussai desu ; じゅっさいです ; 10歳です
また明日 | mata ashita ; またあした
良い一日を | yoi ichinichi o ; いい一日を
頑張って | ganbatte ; がんばって ; 幸運を祈ります
おめでとうございます | omedetou gozaimasu ; おめでとう
# 28
早く起きます | hayaku okimasu ; はやくおきます ; 早起きします
朝ご飯を食べます | asagohan o tabemasu ; 朝ごはんを食べます ; あさごはんをたべます
学校に行きます | gakkou ni ikimasu ; 学校へ行きます ; がっこうにいきます
仕事に行きます | shigoto ni ikimasu ; 会社に行きます ; しごとにいきます
勉強します | benkyou shimasu ; べんきょうします
友達と遊びます | tomodachi to asobimasu ; ともだちとあそびます
本を読みます | hon o yomimasu ; ほんをよみます
寝ます | nemasu ; ねます ; 寝に行きます
歯を磨きます | ha o migakimasu ; はをみがきます
シャワーを浴びます | shawaa o abimasu ; シャワーをあびます
# 29
犬は大きいです | inu wa ookii desu ; 犬は大きい ; いぬはおおきいです
猫は小さいです | neko wa chiisai desu ; 猫は小さい ; ねこはちいさいです
家は白いです | ie wa shiroi desu ; 家は白い ; いえはしろいです
水は冷たいです | mizu wa tsumetai desu ; 水は冷たい ; みずはつめたいです
食べ物は美味しいです | tabemono wa oishii desu ; 食べ物はおいしいです
本は新しいです | hon wa atarashii desu ; 本は新しい ; ほんはあたらしいです
母は嬉しいです | haha wa ureshii desu ; 母はうれしいです ; お母さんは嬉しいです
いい天気です | ii tenki desu ; いいてんきです ; 天気がいいです
空は青いです | sora wa aoi desu ; 空は青い ; そらはあおいです
店は閉まっています | mise wa shimatte imasu ; お店は閉まっています
# 30
コーヒーを一杯ください | koohii o ippai kudasai ; コーヒーをください ; コーヒー一杯ください
手伝ってもらえますか | tetsudatte moraemasu ka ; 手伝ってください ; 助けてください
日本語を勉強しています | nihongo o benkyou shite imasu ; にほんごをべんきょうしています
日本語はあまり上手じゃないです | nihongo wa amari jouzu ja nai desu ; 日本語があまり話せません ; 日本語はあまり話せません
もっとゆっくり話してください | motto yukkuri hanashite kudasai ; ゆっくり話してください
これは日本語で何と言いますか | kore wa nihongo de nan to iimasu ka ; これは日本語で何ですか
家に帰ります | ie ni kaerimasu ; うちに帰ります ; いえにかえります
明日ビーチに行きます | ashita biichi ni ikimasu ; 明日海に行きます ; あしたうみにいきます
子供が二人います | kodomo ga futari imasu ; 子どもが二人います ; こどもがふたりいます
手伝ってくれてありがとうございます | tetsudatte kurete arigatou gozaimasu ; 助けてくれてありがとう ; ありがとうございました
`)

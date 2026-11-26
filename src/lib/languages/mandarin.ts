import { parseLanguage } from './parse'

/** Mandarin Chinese (Simplified, Mainland). Shown in pinyin; matched against Chinese characters. */
export const MANDARIN_LEVELS = parseLanguage('Mandarin', `
# 1
你好 | nǐ hǎo ; 您好
谢谢 | xièxie ; 谢谢你 ; 多谢
请 | qǐng ; 麻烦你
是 | shì ; 对 ; 是的 ; 嗯
不 | bù ; 不是 ; 不要 ; 没有
再见 | zàijiàn ; 拜拜
早上好 | zǎoshang hǎo ; 早安 ; 早
晚安 | wǎn'ān
不好意思 | bù hǎoyìsi ; 打扰一下 ; 请问
对不起 | duìbuqǐ ; 抱歉
# 2
不客气 | bú kèqi ; 不用谢 ; 没关系
我不明白 | wǒ bù míngbai ; 我不懂 ; 我听不懂
你会说英语吗 | nǐ huì shuō yīngyǔ ma ; 你说英语吗 ; 会说英语吗
洗手间在哪里 | xǐshǒujiān zài nǎlǐ ; 厕所在哪里 ; 洗手间在哪儿 ; 厕所在哪儿
水 | shuǐ
多少钱 | duōshao qián ; 这个多少钱
救命 | jiùmìng ; 帮帮我
我叫 | wǒ jiào ; 我的名字是
很高兴认识你 | hěn gāoxìng rènshi nǐ ; 认识你很高兴 ; 很高兴见到你
你好吗 | nǐ hǎo ma ; 你怎么样 ; 最近好吗
# 3
一 | yī ; 1
二 | èr ; 两 ; 2
三 | sān ; 3
四 | sì ; 4
五 | wǔ ; 5
六 | liù ; 6
七 | qī ; 7
八 | bā ; 8
九 | jiǔ ; 9
十 | shí ; 10
# 4
食物 | shíwù ; 吃的 ; 饭
面包 | miànbāo
米饭 | mǐfàn ; 米
咖啡 | kāfēi
茶 | chá
牛奶 | niúnǎi
水果 | shuǐguǒ
苹果 | píngguǒ
鸡肉 | jīròu ; 鸡
鱼 | yú
# 5
左 | zuǒ ; 左边
右 | yòu ; 右边
一直走 | yìzhí zǒu ; 直走 ; 往前走
这里 | zhèlǐ ; 这儿
那里 | nàlǐ ; 那儿
酒店 | jiǔdiàn ; 宾馆 ; 饭店
机场 | jīchǎng
火车站 | huǒchē zhàn
票 | piào ; 车票
出租车 | chūzūchē ; 的士 ; 打车
# 6
医生 | yīshēng ; 大夫
医院 | yīyuàn
警察 | jǐngchá
药店 | yàodiàn ; 药房
我生病了 | wǒ shēngbìng le ; 我病了 ; 我不舒服
我迷路了 | wǒ mílù le
停 | tíng ; 停下 ; 站住
等一下 | děng yíxià ; 等等 ; 稍等
请慢一点 | qǐng màn yìdiǎn ; 慢一点 ; 请说慢一点
请再说一遍 | qǐng zài shuō yí biàn ; 再说一遍 ; 再来一次
# 7
妈妈 | māma ; 母亲
爸爸 | bàba ; 父亲
孩子 | háizi ; 小孩
宝宝 | bǎobao ; 婴儿
奶奶 | nǎinai ; 外婆 ; 姥姥
爷爷 | yéye ; 外公 ; 姥爷
家人 | jiārén ; 家庭 ; 家
朋友 | péngyou
男孩 | nánhái ; 男孩子
女孩 | nǚhái ; 女孩子
# 8
红色 | hóngsè ; 红
蓝色 | lánsè ; 蓝
绿色 | lǜsè ; 绿
黄色 | huángsè ; 黄
黑色 | hēisè ; 黑
白色 | báisè ; 白
橙色 | chéngsè ; 橘色 ; 橘黄色
紫色 | zǐsè ; 紫
粉色 | fěnsè ; 粉红色 ; 粉红
棕色 | zōngsè ; 咖啡色 ; 褐色
# 9
狗 | gǒu ; 小狗
猫 | māo ; 小猫
鸟 | niǎo ; 小鸟
马 | mǎ
牛 | niú
猪 | zhū
兔子 | tùzi ; 兔
老鼠 | lǎoshǔ
熊 | xióng
狮子 | shīzi
# 10
头 | tóu
眼睛 | yǎnjing
耳朵 | ěrduo
鼻子 | bízi
嘴 | zuǐ ; 嘴巴
手 | shǒu
脚 | jiǎo
胳膊 | gēbo ; 手臂
腿 | tuǐ
头发 | tóufa
# 11
房子 | fángzi ; 家
门 | mén
窗户 | chuānghu ; 窗
桌子 | zhuōzi
椅子 | yǐzi
床 | chuáng
厨房 | chúfáng
房间 | fángjiān
钥匙 | yàoshi
书 | shū
# 12
学校 | xuéxiào
老师 | lǎoshī
学生 | xuésheng
笔 | bǐ ; 钢笔
铅笔 | qiānbǐ
纸 | zhǐ
书包 | shūbāo ; 包
电脑 | diànnǎo ; 计算机
课 | kè ; 班 ; 上课
作业 | zuòyè ; 家庭作业
# 13
十一 | shíyī ; 11
十二 | shí'èr ; 12
十五 | shíwǔ ; 15
二十 | èrshí ; 20
三十 | sānshí ; 30
四十 | sìshí ; 40
五十 | wǔshí ; 50
一百 | yìbǎi ; 100
一千 | yìqiān ; 1000
零 | líng ; 0
# 14
星期一 | xīngqī yī ; 周一 ; 礼拜一
星期二 | xīngqī èr ; 周二 ; 礼拜二
星期三 | xīngqī sān ; 周三 ; 礼拜三
星期四 | xīngqī sì ; 周四 ; 礼拜四
星期五 | xīngqī wǔ ; 周五 ; 礼拜五
星期六 | xīngqī liù ; 周六 ; 礼拜六
星期天 | xīngqī tiān ; 星期日 ; 周日 ; 礼拜天
今天 | jīntiān
明天 | míngtiān
昨天 | zuótiān
# 15
早上 | zǎoshang ; 上午 ; 早晨
下午 | xiàwǔ
傍晚 | bàngwǎn ; 晚上
晚上 | wǎnshang ; 夜里 ; 夜晚
天 | tiān ; 一天 ; 白天
星期 | xīngqī ; 周 ; 一个星期
月 | yuè ; 一个月
年 | nián ; 一年
现在 | xiànzài
以后 | yǐhòu ; 等一下 ; 待会儿
# 16
太阳 | tàiyáng
月亮 | yuèliang
星星 | xīngxing
雨 | yǔ ; 下雨
雪 | xuě ; 下雪
风 | fēng ; 刮风
很热 | hěn rè ; 天气很热 ; 热
很冷 | hěn lěng ; 天气很冷 ; 冷
树 | shù
花 | huā
# 17
衬衫 | chènshān ; T恤
裤子 | kùzi
鞋 | xié ; 鞋子
帽子 | màozi
裙子 | qúnzi ; 连衣裙
外套 | wàitào ; 夹克
袜子 | wàzi
眼镜 | yǎnjìng
衣服 | yīfu
雨伞 | yǔsǎn ; 伞
# 18
早饭 | zǎofàn ; 早餐
午饭 | wǔfàn ; 午餐
晚饭 | wǎnfàn ; 晚餐
鸡蛋 | jīdàn ; 蛋
奶酪 | nǎilào ; 芝士
汤 | tāng
糖 | táng
盐 | yán
肉 | ròu
蔬菜 | shūcài ; 青菜
# 19
城市 | chéngshì
商店 | shāngdiàn ; 店
餐厅 | cāntīng ; 饭馆 ; 饭店
公园 | gōngyuán
海滩 | hǎitān ; 沙滩
银行 | yínháng
博物馆 | bówùguǎn
图书馆 | túshūguǎn
市场 | shìchǎng ; 菜市场
街 | jiē ; 街道 ; 马路
# 20
大 | dà
小 | xiǎo
好 | hǎo
坏 | huài ; 不好
新 | xīn
旧 | jiù ; 老
开心 | kāixīn ; 高兴 ; 快乐
难过 | nánguò ; 伤心
快 | kuài
慢 | màn
# 21
吃 | chī
喝 | hē
去 | qù
来 | lái
看 | kàn ; 看见
说 | shuō ; 说话
读 | dú ; 看书
写 | xiě
睡觉 | shuìjiào ; 睡
玩 | wán ; 玩儿
# 22
我饿了 | wǒ è le ; 我很饿
我渴了 | wǒ kě le ; 我很渴
我累了 | wǒ lèi le ; 我很累
我很开心 | wǒ hěn kāixīn ; 我很高兴
我很冷 | wǒ hěn lěng ; 我冷
我很热 | wǒ hěn rè ; 我热
我喜欢 | wǒ xǐhuan ; 我喜欢这个
我不喜欢 | wǒ bù xǐhuan ; 我不喜欢这个
我爱你 | wǒ ài nǐ
我准备好了 | wǒ zhǔnbèi hǎo le ; 准备好了
# 23
什么 | shénme
谁 | shéi ; shuí
哪里 | nǎlǐ ; 哪儿 ; 在哪
什么时候 | shénme shíhou
为什么 | wèishénme
怎么 | zěnme ; 怎么样
哪个 | nǎge ; 哪一个
多少 | duōshao ; 几个
这是什么 | zhè shì shénme ; 这是啥
现在几点 | xiànzài jǐ diǎn ; 几点了 ; 现在几点了
# 24
请给我菜单 | qǐng gěi wǒ càidān ; 菜单 ; 我要看菜单
买单 | mǎidān ; 结账 ; 请买单
两位 | liǎng wèi ; 两个人 ; 两位谢谢
我要水 | wǒ yào shuǐ ; 请给我水 ; 给我一杯水
很好吃 | hěn hǎochī ; 好吃 ; 真好吃
我吃饱了 | wǒ chī bǎo le ; 吃饱了
再来一个 | zài lái yí ge ; 再来一份 ; 再来一杯
不要冰 | bú yào bīng ; 去冰 ; 不加冰
我要这个 | wǒ yào zhège ; 就要这个 ; 这个
干杯 | gānbēi
# 25
钱 | qián
价格 | jiàgé ; 价钱
便宜 | piányi
贵 | guì
开门 | kāimén ; 营业
关门 | guānmén ; 打烊
信用卡 | xìnyòngkǎ ; 银行卡 ; 刷卡
现金 | xiànjīn
收据 | shōujù ; 小票 ; 发票
太贵了 | tài guì le ; 太贵
# 26
公交车站在哪里 | gōngjiāochē zhàn zài nǎlǐ ; 公交站在哪里 ; 公交车站在哪儿
火车什么时候开 | huǒchē shénme shíhou kāi ; 火车几点开 ; 火车几点出发
我想去机场 | wǒ xiǎng qù jīchǎng ; 我要去机场 ; 去机场
有多远 | yǒu duō yuǎn ; 远吗 ; 多远
左转 | zuǒ zhuǎn ; 往左拐 ; 向左转
右转 | yòu zhuǎn ; 往右拐 ; 向右转
直走 | zhí zǒu ; 一直往前走 ; 往前走
很近 | hěn jìn ; 不远 ; 近
很远 | hěn yuǎn ; 远
请在这里停 | qǐng zài zhèlǐ tíng ; 在这里停 ; 这里停
# 27
你是哪里人 | nǐ shì nǎlǐ rén ; 你从哪里来 ; 你是哪国人
我是美国人 | wǒ shì měiguó rén ; 我从美国来 ; 我来自美国
我会说一点 | wǒ huì shuō yìdiǎn ; 我会一点 ; 我会说一点中文
你叫什么名字 | nǐ jiào shénme míngzi ; 你叫什么
你几岁了 | nǐ jǐ suì le ; 你多大了 ; 你几岁
我十岁 | wǒ shí suì ; 我十岁了 ; 我10岁
明天见 | míngtiān jiàn
祝你今天愉快 | zhù nǐ jīntiān yúkuài ; 祝你有美好的一天 ; 祝你愉快
祝你好运 | zhù nǐ hǎo yùn ; 好运 ; 加油
恭喜 | gōngxǐ ; 恭喜恭喜 ; 祝贺你
# 28
我起得很早 | wǒ qǐ de hěn zǎo ; 我早起 ; 我很早起床
我吃早饭 | wǒ chī zǎofàn ; 我吃早餐
我去上学 | wǒ qù shàngxué ; 我去学校
我去上班 | wǒ qù shàngbān ; 我去工作
我学习 | wǒ xuéxí ; 我在学习
我和朋友一起玩 | wǒ hé péngyou yìqǐ wán ; 我跟朋友玩 ; 我和朋友玩
我看书 | wǒ kàn shū ; 我读书 ; 我在看书
我去睡觉 | wǒ qù shuìjiào ; 我睡觉
我刷牙 | wǒ shuāyá
我洗澡 | wǒ xǐzǎo ; 我冲澡
# 29
狗很大 | gǒu hěn dà ; 这只狗很大
猫很小 | māo hěn xiǎo ; 这只猫很小
房子是白色的 | fángzi shì báisè de ; 房子是白的
水很冷 | shuǐ hěn lěng ; 水很凉
饭很好吃 | fàn hěn hǎochī ; 菜很好吃 ; 食物很好吃
书是新的 | shū shì xīn de ; 这本书是新的
我妈妈很开心 | wǒ māma hěn kāixīn ; 我妈妈很高兴
天气很好 | tiānqì hěn hǎo ; 今天天气很好
天空是蓝色的 | tiānkōng shì lánsè de ; 天是蓝的 ; 天很蓝
商店关门了 | shāngdiàn guānmén le ; 店关门了
# 30
我想要一杯咖啡 | wǒ xiǎng yào yì bēi kāfēi ; 我要一杯咖啡 ; 请给我一杯咖啡
你能帮我吗 | nǐ néng bāng wǒ ma ; 请帮帮我 ; 可以帮我吗
我在学中文 | wǒ zài xué zhōngwén ; 我在学汉语 ; 我学中文
我的中文不太好 | wǒ de zhōngwén bú tài hǎo ; 我中文说得不好 ; 我说中文不太好
请说慢一点 | qǐng shuō màn yìdiǎn ; 你能说慢一点吗 ; 慢一点说
这个用中文怎么说 | zhège yòng zhōngwén zěnme shuō ; 这个中文怎么说
我要回家 | wǒ yào huí jiā ; 我回家 ; 我回家了
我们明天去海滩 | wǒmen míngtiān qù hǎitān ; 明天我们去海边 ; 我们明天去海边
我有两个孩子 | wǒ yǒu liǎng ge háizi
非常感谢你的帮助 | fēicháng gǎnxiè nǐ de bāngzhù ; 谢谢你的帮助 ; 太感谢了
`)

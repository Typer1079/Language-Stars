import { parseLanguage } from './parse'

/**
 * Farsi (Persian, as spoken in Iran). Shown in English letters (aa = long a, kh = throaty h);
 * matched against Persian script. Everyday spoken forms are accepted alongside written ones.
 */
export const FARSI_LEVELS = parseLanguage('Farsi', `
# 1
سلام | salaam
مرسی | mersi ; ممنون ; متشکرم ; مرسی
لطفاً | lotfan ; لطفا ; خواهش میکنم
بله | baleh ; آره
نه | na ; خیر
خداحافظ | khodaahaafez ; خدا حافظ ; بای
صبح بخیر | sobh bekheyr ; صبح به خیر
شب بخیر | shab bekheyr ; شب به خیر
ببخشید | bebakhshid
متأسفم | mote'assefam ; متاسفم ; ببخشید
# 2
خواهش می‌کنم | khaahesh mikonam ; خواهش میکنم ; قابلی نداشت
نمی‌فهمم | nemifahmam ; نمیفهمم ; متوجه نمیشم
انگلیسی صحبت می‌کنید؟ | engelisi sohbat mikonid ; انگلیسی بلدید ; انگلیسی صحبت میکنید
دستشویی کجاست؟ | dastshuyi kojaast ; دستشویی کجاست ; توالت کجاست
آب | aab
چند است؟ | chand ast ; چنده ; قیمتش چنده ; چند
کمک! | komak ; کمک کنید
اسم من | esm-e man ; اسمم ; اسم من هست
از آشنایی‌تان خوشوقتم | az aashnaayitaan khoshvaghtam ; خوشبختم ; از آشناییتون خوشبختم
حالتان چطور است؟ | haalet chetore ; حالت چطوره ; حال شما چطوره ; خوبی
# 3
یک | yek ; ۱ ; 1
دو | do ; ۲ ; 2
سه | se ; ۳ ; 3
چهار | chahaar ; ۴ ; 4
پنج | panj ; ۵ ; 5
شش | shesh ; ۶ ; 6
هفت | haft ; ۷ ; 7
هشت | hasht ; ۸ ; 8
نه | noh ; ۹ ; 9
ده | dah ; ۱۰ ; 10
# 4
غذا | ghazaa
نان | naan
برنج | berenj ; پلو
قهوه | ghahveh
چای | chaay ; چایی
شیر | shir
میوه | miveh
سیب | sib
مرغ | morgh ; گوشت مرغ
ماهی | maahi
# 5
چپ | chap ; سمت چپ
راست | raast ; سمت راست
مستقیم | mostaghim ; مستقیم برو
اینجا | injaa
آنجا | aanjaa ; اونجا
هتل | hotel
فرودگاه | forudgaah
ایستگاه قطار | istgaah-e ghataar ; ایستگاه راه آهن
بلیط | belit ; بلیت
تاکسی | taaksi
# 6
دکتر | doktor ; پزشک
بیمارستان | bimaarestaan
پلیس | polis
داروخانه | daarukhaaneh
مریض هستم | mariz hastam ; مریضم ; من مریضم
گم شده‌ام | gom shodeham ; گم شدم ; راه رو گم کردم
ایست! | ist ; وایسا ; صبر کن
صبر کنید | sabr konid ; صبر کن ; یه لحظه
آهسته لطفاً | aahesteh lotfan ; یواش لطفا ; آهسته تر
دوباره لطفاً | dobaareh lotfan ; یه بار دیگه ; دوباره بگید
# 7
مادر | maadar ; مامان
پدر | pedar ; بابا
بچه | bacheh ; کودک
نوزاد | nowzaad ; بچه کوچک
مادربزرگ | maadarbozorg ; مادر بزرگ
پدربزرگ | pedarbozorg ; پدر بزرگ
خانواده | khaanevaadeh
دوست | dust
پسر | pesar
دختر | dokhtar
# 8
قرمز | ghermez
آبی | aabi
سبز | sabz
زرد | zard
سیاه | siyaah ; مشکی
سفید | sefid
نارنجی | naarenji
بنفش | banafsh
صورتی | surati
قهوه‌ای | ghahvei ; قهوه ای
# 9
سگ | sag
گربه | gorbeh
پرنده | parandeh
اسب | asb
گاو | gaav
خوک | khuk
خرگوش | khargush
موش | mush
خرس | khers
شیر | shir
# 10
سر | sar
چشم | cheshm
گوش | gush
بینی | bini ; دماغ
دهان | dahaan ; دهن
دست | dast
پا | paa
بازو | baazu
ساق پا | saagh-e paa ; پا
مو | mu ; موها
# 11
خانه | khaaneh ; خونه
در | dar
پنجره | panjereh
میز | miz
صندلی | sandali
تخت | takht
آشپزخانه | aashpazkhaaneh ; آشپزخونه
اتاق | otaagh
کلید | kelid
کتاب | ketaab
# 12
مدرسه | madreseh
معلم | moallem
دانش‌آموز | daanesh-aamuz ; دانش آموز ; شاگرد
خودکار | khodkaar ; قلم
مداد | medaad
کاغذ | kaaghaz
کیف | kif
کامپیوتر | kaampyuter ; رایانه
کلاس | kelaas
تکلیف | taklif ; مشق
# 13
یازده | yaazdah ; ۱۱ ; 11
دوازده | davaazdah ; ۱۲ ; 12
پانزده | paanzdah ; ۱۵ ; 15
بیست | bist ; ۲۰ ; 20
سی | si ; ۳۰ ; 30
چهل | chehel ; ۴۰ ; 40
پنجاه | panjaah ; ۵۰ ; 50
صد | sad ; ۱۰۰ ; 100
هزار | hezaar ; ۱۰۰۰ ; 1000
صفر | sefr ; ۰ ; 0
# 14
دوشنبه | doshanbeh
سه‌شنبه | seshanbeh ; سه شنبه
چهارشنبه | chahaarshanbeh ; چهار شنبه
پنجشنبه | panjshanbeh ; پنج شنبه
جمعه | jom'eh
شنبه | shanbeh
یکشنبه | yekshanbeh ; یک شنبه
امروز | emruz
فردا | fardaa
دیروز | diruz
# 15
صبح | sobh
بعدازظهر | ba'd az zohr ; بعد از ظهر ; عصر
عصر | asr ; غروب
شب | shab
روز | ruz
هفته | hafteh
ماه | maah
سال | saal
الان | al'aan ; حالا ; اکنون
بعداً | ba'dan ; بعدا
# 16
خورشید | khorshid ; آفتاب
ماه | maah
ستاره | setaareh
باران | baaraan ; بارون
برف | barf
باد | baad
هوا گرم است | havaa garm ast ; هوا گرمه ; گرمه
هوا سرد است | havaa sard ast ; هوا سرده ; سرده
درخت | derakht
گل | gol
# 17
پیراهن | piraahan
شلوار | shalvaar
کفش | kafsh
کلاه | kolaah
لباس زنانه | lebaas-e zanaaneh ; پیراهن زنانه ; دامن
ژاکت | zhaakat ; کت ; کاپشن
جوراب | juraab
عینک | eynak
لباس | lebaas
چتر | chatr
# 18
صبحانه | sobhaaneh
ناهار | naahaar
شام | shaam
تخم‌مرغ | tokhm-e morgh ; تخم مرغ
پنیر | panir
سوپ | sup ; آش
شکر | shekar
نمک | namak
گوشت | gusht
سبزیجات | sabzijaat ; سبزی
# 19
شهر | shahr
مغازه | maghaazeh ; فروشگاه
رستوران | resturaan
پارک | paark
ساحل | saahel
بانک | baank
موزه | muzeh
کتابخانه | ketaabkhaaneh ; کتابخونه
بازار | baazaar
خیابان | khiyaabaan ; خیابون
# 20
بزرگ | bozorg
کوچک | kuchak ; کوچیک
خوب | khub
بد | bad
نو | now ; جدید
کهنه | kohneh ; قدیمی
خوشحال | khoshhaal
ناراحت | naaraahat ; غمگین
تند | tond ; سریع
آهسته | aahesteh ; یواش
# 21
خوردن | khordan
نوشیدن | nushidan
رفتن | raftan
آمدن | aamadan ; اومدن
دیدن | didan
حرف زدن | harf zadan ; صحبت کردن
خواندن | khaandan ; خوندن
نوشتن | neveshtan
خوابیدن | khaabidan
بازی کردن | baazi kardan
# 22
گرسنه هستم | gorosneh hastam ; گشنمه ; گرسنمه
تشنه هستم | teshneh hastam ; تشنمه
خسته هستم | khasteh hastam ; خستم ; خسته ام
خوشحال هستم | khoshhaal hastam ; خوشحالم
سردم است | sardam ast ; سردمه ; سردم
گرمم است | garmam ast ; گرممه ; گرمم
دوستش دارم | dustash daaram ; خوشم میاد
دوستش ندارم | dustash nadaaram ; خوشم نمیاد
دوستت دارم | dustet daaram
آماده‌ام | aamaadeham ; آماده هستم ; آمادم
# 23
چه؟ | che ; چی
کی؟ | ki ; چه کسی
کجا؟ | kojaa
کی؟ | key ; چه وقت ; چه زمانی
چرا؟ | cheraa
چطور؟ | chetor ; چگونه
کدام؟ | kodaam ; کدوم
چند تا؟ | chand taa ; چند
این چیست؟ | in chist ; این چیه
ساعت چند است؟ | saa'at chand ast ; ساعت چنده
# 24
منو لطفاً | menu lotfan ; منو لطفا
صورت‌حساب لطفاً | surat-hesaab lotfan ; صورتحساب لطفا ; حساب لطفا
یک میز برای دو نفر لطفاً | yek miz baraaye do nafar lotfan ; میز دو نفره
آب می‌خواهم | aab mikhaaham ; آب میخوام ; آب لطفا
خیلی خوشمزه است | kheyli khoshmazeh ast ; خوشمزه است ; خیلی خوشمزس
سیر شدم | sir shodam ; سیرم
یکی دیگر لطفاً | yeki digar lotfan ; یکی دیگه لطفا
بدون یخ لطفاً | bedun-e yakh lotfan ; بدون یخ
این را می‌خواهم | in raa mikhaaham ; اینو میخوام ; این یکی
به سلامتی! | be salaamati ; به سلامتی
# 25
پول | pul
قیمت | gheymat
ارزان | arzaan ; ارزون
گران | geraan ; گرون
باز | baaz
بسته | basteh ; تعطیل
کارت اعتباری | kaart-e e'tebaari ; کارت
پول نقد | pul-e naghd ; نقد
رسید | resid ; فاکتور
خیلی گران است | kheyli geraan ast ; خیلی گرونه
# 26
ایستگاه اتوبوس کجاست؟ | istgaah-e otobus kojaast ; ایستگاه اتوبوس کجاست
قطار کی حرکت می‌کند؟ | ghataar key harekat mikonad ; قطار کی حرکت میکنه
می‌خواهم به فرودگاه بروم | mikhaaham be forudgaah beravam ; میخوام برم فرودگاه
چقدر دور است؟ | cheghadr dur ast ; چقدر دوره ; دوره
بپیچید به چپ | bepichid be chap ; بپیچ به چپ ; برو چپ
بپیچید به راست | bepichid be raast ; بپیچ به راست ; برو راست
مستقیم بروید | mostaghim beravid ; مستقیم برو
نزدیک است | nazdik ast ; نزدیکه
دور است | dur ast ; دوره
اینجا نگه دارید لطفاً | injaa negah daarid lotfan ; همینجا نگه دار
# 27
اهل کجا هستید؟ | ahl-e kojaa hastid ; اهل کجایی ; از کجا اومدی
من اهل آمریکا هستم | man ahl-e aamrikaa hastam ; اهل آمریکام ; از آمریکا اومدم
کمی صحبت می‌کنم | kami sohbat mikonam ; یه کم بلدم ; کمی فارسی صحبت میکنم
اسم شما چیست؟ | esm-e shomaa chist ; اسمت چیه ; اسم شما چیه
چند سال دارید؟ | chand saal daarid ; چند سالته ; چند سالتونه
ده سال دارم | dah saal daaram ; ده سالمه ; ۱۰ سالمه
فردا می‌بینمت | fardaa mibinamet ; فردا میبینمت ; تا فردا
روز خوبی داشته باشید | ruz-e khubi daashteh baashid ; روز خوش
موفق باشید | movaffagh baashid ; موفق باشی ; خدا به همراهت
تبریک می‌گویم | tabrik miguyam ; تبریک میگم ; تبریک
# 28
زود بیدار می‌شوم | zud bidaar mishavam ; زود بیدار میشم
صبحانه می‌خورم | sobhaaneh mikhoram ; صبحونه میخورم
به مدرسه می‌روم | be madreseh miravam ; میرم مدرسه
سر کار می‌روم | sar-e kaar miravam ; میرم سر کار
درس می‌خوانم | dars mikhaanam ; درس میخونم
با دوستانم بازی می‌کنم | baa dustaanam baazi mikonam ; با دوستام بازی میکنم
کتاب می‌خوانم | ketaab mikhaanam ; کتاب میخونم
می‌روم بخوابم | miravam bekhaabam ; میرم بخوابم ; میخوابم
مسواک می‌زنم | mesvaak mizanam ; مسواک میزنم
دوش می‌گیرم | dush migiram ; دوش میگیرم ; حموم میکنم
# 29
سگ بزرگ است | sag bozorg ast ; سگ بزرگه
گربه کوچک است | gorbeh kuchak ast ; گربه کوچیکه
خانه سفید است | khaaneh sefid ast ; خونه سفیده
آب سرد است | aab sard ast ; آب سرده
غذا خوب است | ghazaa khub ast ; غذا خوبه ; غذا خوشمزه است
کتاب نو است | ketaab now ast ; کتاب جدیده ; کتاب نوئه
مادرم خوشحال است | maadaram khoshhaal ast ; مامانم خوشحاله
هوا خوب است | havaa khub ast ; هوا خوبه
آسمان آبی است | aasemaan aabi ast ; آسمون آبیه
مغازه بسته است | maghaazeh basteh ast ; مغازه بسته‌ست ; مغازه تعطیله
# 30
یک فنجان قهوه می‌خواهم | yek fenjaan ghahveh mikhaaham ; یه قهوه میخوام ; یک قهوه لطفا
می‌توانید به من کمک کنید؟ | mitavaanid be man komak konid ; میشه کمکم کنید ; کمکم میکنید
دارم فارسی یاد می‌گیرم | daaram faarsi yaad migiram ; فارسی یاد میگیرم
فارسی را خوب صحبت نمی‌کنم | faarsi raa khub sohbat nemikonam ; فارسیم خوب نیست ; فارسی خوب بلد نیستم
می‌شود آهسته‌تر صحبت کنید؟ | mishavad aahestetar sohbat konid ; میشه آهسته تر صحبت کنید ; یواش تر بگید
این را به فارسی چه می‌گویند؟ | in raa be faarsi che miguyand ; اینو به فارسی چی میگن
دارم به خانه می‌روم | daaram be khaaneh miravam ; دارم میرم خونه ; میرم خونه
فردا به ساحل می‌رویم | fardaa be saahel miravim ; فردا میریم ساحل ; فردا میریم دریا
دو تا بچه دارم | do taa bacheh daaram ; دو بچه دارم ; ۲ تا بچه دارم
خیلی ممنون از کمکتان | kheyli mamnun az komaketaan ; خیلی ممنون از کمکت ; خیلی ممنون
`)

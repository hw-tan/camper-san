#!/usr/bin/env node
/**
 * Translates all spot title_ja → clean English using a hand-crafted dictionary.
 * No API calls, no rate limits. Outputs translations.csv (id, title_ja, title_en).
 *
 * Strategy:
 *   1. Substitute known proper place names (romanisation)
 *   2. Substitute place-type words (common nouns)
 *   3. Strip residual Japanese characters
 */
const fs   = require('fs');
const path = require('path');

// ── 1. Proper noun romanisation ──────────────────────────────────────────────
// Longer strings first to avoid partial matches
const PROPER_NOUNS = [
  // ── Hokkaido (hiragana place names used in facility names) ──
  ['しんしのつ', 'Shinshinotsu'], ['さるふつ', 'Sarufutsu'], ['クッチャロ', 'Kutcharo'],
  ['けんぶち', 'Kenbuchi'],       ['アポイ', 'Apoi'],         ['しほろ', 'Shihoro'],
  ['ほろかない', 'Horokanai'],     ['びふか', 'Bifuka'],       ['しべつ', 'Shibetsu'],
  ['みたら', 'Mitara'],           ['きょうわ', 'Kyowa'],       ['かかしの郷', 'Kakashi no Sato'],
  ['ルスツ', 'Rusutsu'],
  ['ニセコ', 'Niseko'],           ['むかわ', 'Mukawa'],        ['えりも', 'Erimo'],
  ['サロベツ', 'Sarobetsu'],      ['サロマ', 'Saroma'],        ['コタン', 'Kotan'],
  ['エルム', 'Elm'],              ['しのつ', 'Shinotsu'],      ['テムジン', 'Temujin'],
  ['オロマップ', 'Oromap'],       ['ノシャップ', 'Noshappu'],  ['パシクル', 'Pasikuru'],
  ['しょさんべつ', 'Shosanbetsu'],  ['とうま', 'Touma'],           ['にしおこっぺ', 'Nishiokoppe'],
  ['おこっぺ', 'Okoppe'],          ['ウトロ', 'Utoro'],           ['カルルス', 'Karurusu'],
  ['みさき台', 'Misakidai'],       ['ロマン街道', 'Roman Highway'], ['ちっぷべつ', 'Chippubetsu'],
  ['うたしない', 'Utashinai'],     ['はまとんべつ', 'Hamatombetsu'], ['しかおい', 'Shikaoi'],
  ['ほっとはぼろ', 'Hotto Haboro'], ['さんふらわー', 'Sunflower'],
  ['はぼろ', 'Haboro'],            ['鐘のなるまち', 'Bell Town'],
  ['あすなろ', 'Asunaro'],         ['桜岡', 'Sakura Hill'],
  ['オスパ', 'Osupa'],
  // More Hokkaido hot spring / landmark areas
  ['糠平源泉郷', 'Nukabira Hot Spring Village'],
  ['糠平', 'Nukabira'],            ['ひがし大雪', 'East Daisetsu'],
  ['源泉郷', 'Hot Spring Village'],['ぽっけ', 'Pokke'],
  ['とままえ', 'Tomamae'],         ['晩成', 'Bansei'],
  ['狩勝', 'Karikachi'],           ['吹上', 'Fukiage'],
  ['白銀荘', 'Shirogane-so'],      ['南茅部', 'Minamiayabe'],
  ['しかべ', 'Shikabe'],           ['間歇泉', 'Geyser'],
  ['盃', 'Sakazuki'],              ['風W', 'Wind W'],
  ['浜益', 'Hamayasu'],
  ['トムラウシ', 'Tomuraushi'],    ['つるぬま', 'Tsurunuma'],
  ['きょうごく', 'Kyogoku'],       ['かみゆうべつ', 'Kamiyubetsu'],
  ['おながわ', 'Onagawa'],          ['にしめ', 'Nishime'],
  ['さっつる', 'Satsuru'],          ['はまなす', 'Hamanasu'],
  ['白滝', 'Shirataki'],            ['花岡', 'Hanaoka'],
  ['焼走り', 'Yakedashiri'],        ['五色', 'Goshiki'],
  ['須川', 'Sukawa'],               ['庄内', 'Shonai'],
  ['みかわ', 'Mikawa'],
  ['然別', 'Shikaribetsu'],       ['女満別', 'Memanbetsu'],    ['暑寒', 'Shokan'],
  ['層雲峡', 'Sounkyo'],          ['天人峡', 'Tenninkyo'],     ['定山渓', 'Jozankei'],

  // ── Hokkaido (kanji) ──
  ['北オホーツク', 'North Okhotsk'], ['オホーツク', 'Okhotsk'],
  ['三笠', 'Mikasa'],          ['茂岩山', 'Mt. Moiwa'],     ['国設', 'National'],
  ['21世紀', '21st Century'],  ['世紀', 'Century'],
  ['日の出', 'Sunrise'],        ['格安', 'Budget'],           ['侍', 'Samurai'],
  ['羊のまち', "Sheep Town"],  ['鏡沼', 'Mirror Marsh'],
  ['丹頂', 'Tancho'],           ['水郷', 'River Town'],        ['通り', 'Street'],
  ['駅前', 'Station Front'],
  ['保養センター', 'Recreation Center'], ['保養', 'Recreation'],
  ['公認', 'Certified'],       ['川', ' River'],  ['河', ' River'],
  ['北広島', 'Kitahiroshima'], ['音威子府', 'Otoineppu'], ['弟子屈', 'Teshikaga'],
  ['幌加内', 'Horokanai'],     ['中頓別', 'Nakatombetsu'], ['西興部', 'Nishiokoppe'],
  ['占冠', 'Shimukappu'],      ['新ひだか', 'Shinhidaka'], ['新冠', 'Niikappu'],
  ['羅臼', 'Rausu'],           ['清里', 'Kiyosato'],       ['斜里', 'Shari'],
  ['小清水', 'Koshimizu'],     ['大空', 'Ozora'],          ['訓子府', 'Kunneppu'],
  ['佐呂間', 'Saroma'],        ['遠軽', 'Engaru'],          ['湧別', 'Yubetsu'],
  ['紋別', 'Monbetsu'],        ['雄武', 'Omu'],             ['興部', 'Okoppe'],
  ['枝幸', 'Esashi'],          ['豊富', 'Toyotomi'],        ['幌延', 'Horonobe'],
  ['天塩', 'Teshio'],          ['羽幌', 'Haboro'],          ['苫前', 'Tomamae'],
  ['小平', 'Obira'],           ['留萌', 'Rumoi'],           ['増毛', 'Mashike'],
  ['名寄', 'Nayoro'],          ['下川', 'Shimokawa'],       ['美深', 'Bifuka'],
  ['士別', 'Shibetsu'],        ['和寒', 'Wassamu'],         ['剣淵', 'Kenbuchi'],
  ['当麻', 'Touma'],           ['比布', 'Pippu'],           ['鷹栖', 'Takasu'],
  ['東神楽', 'Higashikagura'], ['東川', 'Higashikawa'],     ['上川', 'Kamikawa'],
  ['愛別', 'Aibetsu'],         ['旭川', 'Asahikawa'],       ['美瑛', 'Biei'],
  ['富良野', 'Furano'],        ['南富良野', 'Minamifurano'], ['占冠', 'Shimukappu'],
  ['中富良野', 'Nakafurano'],  ['上富良野', 'Kamifurano'],  ['幌向', 'Horomunai'],
  ['北竜', 'Hokuryu'],         ['雨竜', 'Uryu'],            ['秩父別', 'Chikubetsu'],
  ['妹背牛', 'Moseushi'],      ['沼田', 'Numata'],          ['深川', 'Fukagawa'],
  ['芦別', 'Ashibetsu'],       ['赤平', 'Akabira'],         ['砂川', 'Sunagawa'],
  ['滝川', 'Takikawa'],        ['岩見沢', 'Iwamizawa'],     ['夕張', 'Yubari'],
  ['栗山', 'Kuriyama'],        ['南幌', 'Nanporo'],         ['長沼', 'Naganuma'],
  ['由仁', 'Yuni'],            ['北村', 'Kitamura'],        ['月形', 'Tsukigata'],
  ['当別', 'Tobetsu'],         ['新篠津', 'Shinshinotsu'],  ['石狩', 'Ishikari'],
  ['小樽', 'Otaru'],           ['余市', 'Yoichi'],          ['仁木', 'Niki'],
  ['赤井川', 'Akaigawa'],      ['倶知安', 'Kutchan'],       ['ニセコ', 'Niseko'],
  ['京極', 'Kyogoku'],         ['真狩', 'Makkari'],         ['留寿都', 'Rusutsu'],
  ['喜茂別', 'Kimobetsu'],     ['伊達', 'Date'],            ['壮瞥', 'Sobetsu'],
  ['豊浦', 'Toyoura'],         ['室蘭', 'Muroran'],         ['登別', 'Noboribetsu'],
  ['白老', 'Shiraoi'],         ['苫小牧', 'Tomakomai'],     ['千歳', 'Chitose'],
  ['恵庭', 'Eniwa'],           ['江別', 'Ebetsu'],          ['北広島', 'Kitahiroshima'],
  ['平取', 'Biratori'],        ['新冠', 'Niikappu'],        ['浦河', 'Urakawa'],
  ['様似', 'Samani'],          ['えりも', 'Erimo'],         ['広尾', 'Hiroo'],
  ['大樹', 'Taiki'],           ['更別', 'Sarubetsu'],       ['忠類', 'Churui'],
  ['幕別', 'Makubetsu'],       ['音更', 'Otofuke'],         ['芽室', 'Memuro'],
  ['清水', 'Shimizu'],         ['新得', 'Shintoku'],        ['鹿追', 'Shikaoi'],
  ['士幌', 'Shihoro'],         ['上士幌', 'Kamishihoro'],   ['足寄', 'Ashoro'],
  ['陸別', 'Rikubetsu'],       ['本別', 'Honbetsu'],        ['豊頃', 'Toyokoro'],
  ['浦幌', 'Urahoro'],         ['釧路', 'Kushiro'],         ['白糠', 'Shiranuka'],
  ['厚岸', 'Akkeshi'],         ['浜中', 'Hamanaka'],        ['標茶', 'Shibecha'],
  ['阿寒', 'Akan'],            ['弟子屈', 'Teshikaga'],     ['標津', 'Shibetsu'],
  ['別海', 'Betsukai'],        ['中標津', 'Nakashibetsu'],  ['羅臼', 'Rausu'],
  ['知床', 'Shiretoko'],       ['網走', 'Abashiri'],        ['北見', 'Kitami'],
  ['美幌', 'Bihoro'],          ['津別', 'Tsubetsu'],        ['置戸', 'Oketo'],
  ['帯広', 'Obihiro'],         ['稚内', 'Wakkanai'],        ['札幌', 'Sapporo'],
  ['函館', 'Hakodate'],        ['安平', 'Abira'],           ['むかわ', 'Mukawa'],
  ['厚真', 'Atsuma'],          ['日高', 'Hidaka'],          ['穂別', 'Hobetsu'],

  // ── Landmark names (Hokkaido) ──
  ['洞爺湖', 'Lake Toya'],       ['支笏湖', 'Lake Shikotsu'], ['摩周湖', 'Lake Mashu'],
  ['屈斜路湖', 'Lake Kussharo'], ['阿寒湖', 'Lake Akan'],     ['サロマ湖', 'Lake Saroma'],
  ['大沼', 'Onuma'],             ['小沼', 'Konuma'],          ['十勝岳', 'Mt. Tokachidake'],
  ['羊蹄山', 'Mt. Yotei'],       ['大雪山', 'Daisetsuzan'],   ['利尻山', 'Mt. Rishiri'],
  ['斜里岳', 'Mt. Sharidake'],   ['羅臼岳', 'Mt. Rausudake'], ['雌阿寒岳', 'Mt. Meakandake'],
  ['層雲峡', 'Sounkyo'],         ['天人峡', 'Tenninkyo'],      ['定山渓', 'Jozankei'],
  ['ニセコ', 'Niseko'],          ['豊平峡', 'Hoheikyo'],
  ['十勝', 'Tokachi'],           ['日高', 'Hidaka'],

  // ── Tohoku ──
  ['仙台', 'Sendai'],   ['盛岡', 'Morioka'],    ['秋田', 'Akita'],
  ['山形', 'Yamagata'], ['福島', 'Fukushima'],  ['青森', 'Aomori'],
  ['弘前', 'Hirosaki'], ['八戸', 'Hachinohe'],  ['花巻', 'Hanamaki'],
  ['一関', 'Ichinoseki'],['酒田', 'Sakata'],    ['鶴岡', 'Tsuruoka'],
  ['会津', 'Aizu'],     ['郡山', 'Koriyama'],   ['いわき', 'Iwaki'],
  ['十和田', 'Towada'],  ['奥入瀬', 'Oirase'],   ['八甲田', 'Hakkoda'],
  ['蔵王', 'Zao'],       ['松島', 'Matsushima'],  ['平泉', 'Hiraizumi'],
  ['田沢湖', 'Lake Tazawa'], ['男鹿', 'Oga'],    ['象潟', 'Kisakata'],

  ['北海道', 'Hokkaido'],

  // ── Hot spring chains / well-known brands ──
  ['極楽湯', 'Gokurakuyu'], ['快活', 'Kaikatsu'],    ['草津', 'Kusatsu'],
  ['下呂', 'Gero'],         ['万葉', 'Manyo'],        ['龍神', 'Ryujin'],
  ['湯本', 'Yumoto'],       ['湯楽', 'Yura'],

  // ── Kanto ──
  ['東京', 'Tokyo'],       ['横浜', 'Yokohama'],    ['千葉', 'Chiba'],
  ['さいたま', 'Saitama'],  ['前橋', 'Maebashi'],    ['宇都宮', 'Utsunomiya'],
  ['水戸', 'Mito'],         ['日光', 'Nikko'],        ['箱根', 'Hakone'],
  ['鎌倉', 'Kamakura'],     ['横須賀', 'Yokosuka'],  ['熱海', 'Atami'],
  ['軽井沢', 'Karuizawa'],  ['奥多摩', 'Okutama'],   ['奥日光', 'Okunikko'],
  ['富士山', 'Mt. Fuji'],   ['富士五湖', 'Fuji Five Lakes'],  ['富士', 'Fuji'],
  ['河口湖', 'Lake Kawaguchi'], ['山中湖', 'Lake Yamanaka'],
  ['那須', 'Nasu'],          ['日塩', 'Shioya'],       ['霞ヶ浦', 'Lake Kasumigaura'],

  // ── Shin-Etsu ──
  ['長野', 'Nagano'],     ['新潟', 'Niigata'],     ['松本', 'Matsumoto'],
  ['上田', 'Ueda'],       ['飯田', 'Iida'],         ['諏訪', 'Suwa'],
  ['蓼科', 'Tateshina'],  ['志賀高原', 'Shiga Kogen'], ['妙高', 'Myoko'],
  ['糸魚川', 'Itoigawa'], ['佐渡', 'Sado'],         ['越後湯沢', 'Echigo-Yuzawa'],
  ['湯沢', 'Yuzawa'],     ['白馬', 'Hakuba'],        ['安曇野', 'Azumino'],
  ['上高地', 'Kamikochi'], ['乗鞍', 'Norikura'],

  // ── Kansai ──
  ['大阪', 'Osaka'],    ['京都', 'Kyoto'],     ['神戸', 'Kobe'],
  ['奈良', 'Nara'],     ['和歌山', 'Wakayama'], ['彦根', 'Hikone'],
  ['大津', 'Otsu'],     ['姫路', 'Himeji'],     ['白浜', 'Shirahama'],
  ['伊勢', 'Ise'],       ['鳥羽', 'Toba'],       ['熊野', 'Kumano'],
  ['高野山', 'Koyasan'], ['吉野', 'Yoshino'],    ['琵琶湖', 'Lake Biwa'],

  // ── Chugoku / Shikoku ──
  ['広島', 'Hiroshima'], ['岡山', 'Okayama'],   ['松江', 'Matsue'],
  ['鳥取', 'Tottori'],   ['山口', 'Yamaguchi'],  ['下関', 'Shimonoseki'],
  ['宮島', 'Miyajima'],  ['出雲', 'Izumo'],       ['大山', 'Daisen'],
  ['松山', 'Matsuyama'], ['高松', 'Takamatsu'],   ['徳島', 'Tokushima'],
  ['高知', 'Kochi'],     ['四万十', 'Shimanto'],  ['道後', 'Dogo'],

  // ── Kyushu / Okinawa ──
  ['福岡', 'Fukuoka'],    ['長崎', 'Nagasaki'],   ['熊本', 'Kumamoto'],
  ['大分', 'Oita'],        ['宮崎', 'Miyazaki'],   ['鹿児島', 'Kagoshima'],
  ['佐賀', 'Saga'],         ['那覇', 'Naha'],        ['石垣', 'Ishigaki'],
  ['宮古', 'Miyako'],       ['別府', 'Beppu'],       ['由布院', 'Yufuin'],
  ['阿蘇', 'Aso'],          ['雲仙', 'Unzen'],        ['霧島', 'Kirishima'],
  ['指宿', 'Ibusuki'],      ['屋久島', 'Yakushima'],  ['種子島', 'Tanegashima'],
  ['沖縄', 'Okinawa'],      ['西表', 'Iriomote'],     ['与那国', 'Yonaguni'],
];

// ── 2. Place-type word translations ─────────────────────────────────────────
// Longer strings first to avoid partial overlap
const TYPE_WORDS = [
  ['ハイウェイオアシス', 'Highway Oasis'],
  ['オートキャンプ場', 'Auto Campground'],
  ['キャンプ場', 'Campground'],
  ['野営場', 'Campsite'],
  ['森林公園', 'Forest Park'],
  ['自然公園', 'Nature Park'],
  ['海水浴場', 'Swimming Beach'], ['海浜', 'Seaside'],
  ['海岸線', 'Coastline'],       ['海の', 'Sea '],
  ['ふれあい広場', 'Community Plaza'],
  ['温泉ホテル', 'Hot Spring Hotel'],
  ['温泉旅館', 'Hot Spring Inn'],
  ['温泉街', 'Hot Spring Town'],
  ['露天風呂', 'Open-air Bath'],
  ['天然足湯', 'Natural Foot Bath'],
  ['足湯', 'Foot Bath'],
  ['温泉', 'Hot Spring'],
  // Katakana loanwords
  ['アイランド', 'Island'],   ['ファミリー', 'Family'],   ['ビレッジ', 'Village'],
  ['オーシャン', 'Ocean'],    ['ガーデン', 'Garden'],     ['フォレスト', 'Forest'],
  ['ロード', 'Road'],         ['センター', 'Center'],     ['ランド', 'Land'],
  ['パーク', 'Park'],         ['ヴィレッジ', 'Village'],  ['ベース', 'Base'],
  ['リゾート', 'Resort'],     ['プラザ', 'Plaza'],        ['マリーナ', 'Marina'],
  ['アリーナ', 'Arena'],      ['テラス', 'Terrace'],

  // Directional / positional words common in place names
  ['中央', 'Central'],  ['東側', 'East Side'],  ['西側', 'West Side'],
  ['北側', 'North Side'], ['南側', 'South Side'],
  ['上流', 'Upstream'], ['下流', 'Downstream'],

  // Common compound patterns
  ['絵本の里', 'Storybook Village'],   ['四季の館', 'Four Seasons Lodge'],
  ['家族旅行村', 'Family Vacation Village'],
  ['車中泊', 'Car Overnight'],

  // Misc common name components
  ['湯の杜', 'Hot Spring Grove'],
  ['の郷', ' no Sato'],  ['の里', ' no Sato'],   ['の丘', ' Hill'],
  ['の森', ' Forest'],   ['の杜', ' Grove'],      ['の湯', ' Hot Bath'],
  ['の水', ' Spring Water'],

  ['道の駅', 'Roadside Station'],
  ['旅行村', 'Vacation Village'],
  ['森と湖', 'Forest & Lake'],  ['森と', 'Forest & '],

  // Common remaining katakana
  ['サンフラワー', 'Sunflower'],  ['チロル', 'Tyrol'],
  ['コインパーキング', 'Coin Parking'],
  ['キング', 'King'],             ['スパ', 'Spa'],
  ['グランピング', 'Glamping'],
  ['バンガロー', 'Bungalow'],
  ['コテージ', 'Cottage'],
  ['ロッジ', 'Lodge'],
  ['キャビン', 'Cabin'],
  ['ステーション', 'Station'],
  ['グリーン', 'Green'],
  ['スポーツ', 'Sports'],
  ['フリーサイト', 'Free Site'],
  ['ホテル', 'Hotel'],
  ['モーテル', 'Motel'],

  // Common remaining kanji
  ['無料', 'Free'],   ['有料', 'Paid'],
  ['公衆トイレ', 'Public Restroom'],  ['トイレなし', 'No Restroom'],
  ['トイレ無し', 'No Restroom'],      ['トイレ', 'Restroom'],
  ['自然館', 'Nature Center'],        ['本店', 'Main Store'],
  ['ラーメン', 'Ramen'],              ['そば', 'Soba'],
  ['せせらぎ', 'Stream'],             ['昭和', 'Showa'],
  ['夜間閉鎖', 'Night Closure'],      ['周辺の', 'Nearby '],
  ['親水', 'Waterfront'],             ['健康', 'Health'],
  ['あり', 'Available'],              ['なし', 'None'],
  ['サイド', 'Side'],            ['エリア', 'Area'],
  ['多目的', 'Multi-purpose'],  ['観光', 'Sightseeing'],
  ['交流', 'Community'],         ['第一', 'No.1'],
  ['中華', 'Chinese'],           ['静岡', 'Shizuoka'],
  ['園地', 'Recreation Area'],   ['農村', 'Rural'],
  ['湧水', 'Natural Spring'],
  ['名水', 'Famous Spring'],
  ['天然', 'Natural'],
  ['ふるさと', 'Hometown'],
  ['ふれあい', 'Community'],
  ['緑地', 'Green Space'],
  ['みなと', 'Port'],
  ['ダム', 'Dam'],
  ['さくら', 'Sakura'],
  ['スポット', 'Spot'],
  ['登山道', 'Hiking Trail'],
  ['展望台', 'Observation Deck'],
  ['展望公園', 'Scenic Park'],
  ['海浜公園', 'Seaside Park'],
  ['運動公園', 'Sports Park'],
  ['家族公園', 'Family Park'],
  ['総合公園', 'General Park'],
  ['自然の森', 'Natural Forest'],
  ['公共駐車場', 'Public Parking'],
  ['無料駐車場', 'Free Parking'],
  ['臨海公園', 'Waterfront Park'],
  ['駐車公園', 'Park & Parking'],
  ['公園', 'Park'],
  ['駐車場', 'Parking Area'],
  ['駐車帯', 'Parking Zone'],
  ['キャンプサイト', 'Campsite'],
  ['高原', 'Highland'],
  ['牧場', 'Ranch'],
  ['農村公園', 'Rural Park'],
  ['峠', 'Pass'],
  ['渓谷', 'Valley / Gorge'],
  ['滝', 'Waterfall'],
  ['湖畔', 'Lakeside'],
  ['湖', 'Lake'],
  ['池', 'Pond'],
  ['沼', 'Marsh'],
  ['海岸', 'Coast'],
  ['砂浜', 'Sandy Beach'],
  ['ビーチ', 'Beach'],
  ['浜', 'Beach'],
  ['岬', 'Cape'],
  ['半島', 'Peninsula'],
  ['漁港', 'Fishing Port'],
  ['港', 'Port'],
  ['山頂', 'Summit'],
  ['山麓', 'Foot of Mountain'],
  ['神社', 'Shrine'],
  ['寺', 'Temple'],
  ['城', 'Castle'],
  ['市場', 'Market'],
  ['物産館', 'Local Products Center'],
  ['物産センター', 'Local Products Center'],
  ['道路公園', 'Road Park'],
  ['食堂', 'Diner'],
  ['レストラン', 'Restaurant'],
  ['広場', 'Plaza'],
  ['記念館', 'Memorial Hall'],
  ['博物館', 'Museum'],
  ['美術館', 'Art Museum'],
  ['動物園', 'Zoo'],
  ['水族館', 'Aquarium'],
  ['温泉センター', 'Hot Spring Center'],
  ['健康センター', 'Health Center'],
  ['スポーツセンター', 'Sports Center'],
  ['スポーツ公園', 'Sports Park'],
  ['文化の森', 'Culture Forest'],
  ['ゲートパーク', 'Gate Park'],
  ['野鳥観察', 'Bird Watching'],
  ['湿原', 'Wetlands'],
  ['フェリー', 'Ferry Terminal'],
  ['ターミナル', 'Terminal'],
  ['インター', 'Interchange'],
  ['サービスエリア', 'Service Area'],
  ['パーキングエリア', 'Parking Area'],
  ['道立', 'Prefectural'],
  ['町営', 'Town-run'],
  ['市営', 'City-run'],
  ['村営', 'Village-run'],
  ['共同浴場', 'Public Bath'],
  ['浴場', 'Bathhouse'],
  ['銭湯', 'Public Bath'],
];

// ── 3. Administrative suffix cleanup ────────────────────────────────────────
const ADMIN_SUFFIXES = [
  ['市', ' City'],
  ['町', '-cho'],
  ['村', '-mura'],
  ['区', '-ku'],
];

// ── Translation function ─────────────────────────────────────────────────────
function translate(raw) {
  if (!raw) return '';
  let s = raw;

  // Strip rank/status tags that parse.js adds in title_en (they're handled separately)
  s = s.replace(/\[S-Rank\]\s*/g, '')
       .replace(/\[A-Rank\]\s*/g, '')
       .replace(/\[B-Rank\]\s*/g, '')
       .replace(/\[Planned\]\s*/g, '')
       .replace(/\[Paid\]\s*/g, '')
       .replace(/\[Free Camp\]\s*/g, '')
       .replace(/\[Free\]\s*/g, '')
       .replace(/\[Quiet\]\s*/g, '')
       .replace(/\[Reservation Required\]\s*/g, '')
       .replace(/\[⚠ Night Toilets Closed\]\s*/g, '');

  // Strip emoji variation selectors (e.g. ️ = U+FE0F) that break hiragana matching
  s = s.replace(/[︎️]/g, '');

  // Remove hiragana readings in brackets （...）
  s = s.replace(/（[ぁ-ん\s]+）/g, '');

  // Remove HTML tags
  s = s.replace(/<[^>]+>/g, '');

  // Apply proper noun substitutions (longest first, already ordered)
  for (const [ja, en] of PROPER_NOUNS) {
    if (s.includes(ja)) s = s.split(ja).join(en);
  }

  // Apply type word substitutions
  for (const [ja, en] of TYPE_WORDS) {
    if (s.includes(ja)) s = s.split(ja).join(en);
  }

  // Post-proper-noun: city/town suffixes following romanised names
  s = s.replace(/([A-Za-z])市/g, '$1 City');
  s = s.replace(/([A-Za-z])町/g, '$1-cho');
  s = s.replace(/([A-Za-z])村/g, '$1-mura');

  // Apply admin suffix substitutions (only when following known place names)
  // Do these last and only on isolated characters
  for (const [ja, en] of ADMIN_SUFFIXES) {
    // Only replace if followed by a space, punctuation, or end of string
    s = s.replace(new RegExp(ja + '(?=[\\s、・,\\(（]|$)', 'g'), en);
  }

  // Remove の/も particles between English words
  s = s.replace(/([A-Za-z])[のも]([A-Za-z])/g, '$1 $2');

  // Ordinal numbers: 第2 → #2
  s = s.replace(/第(\d+)/g, '#$1');

  // Insert space at camelCase boundaries created by substitution (e.g. YoshinoPark → Yoshino Park)
  s = s.replace(/([a-z.])([A-Z])/g, '$1 $2');

  // Clean up double spaces and trim
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const SRC = path.join(__dirname, '../public/spots.json');
const OUT = path.join(__dirname, '../translations.csv');

function csvCell(v) {
  const s = String(v ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

const { features } = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const rows = ['id,title_ja,title_en'];
for (const f of features) {
  const p = f.properties;
  const title_en = translate(p.title_ja || '');
  rows.push([csvCell(p.id), csvCell(p.title_ja), csvCell(title_en)].join(','));
}

fs.writeFileSync(OUT, '﻿' + rows.join('\n'), 'utf8');
console.log(`✅ ${features.length} rows → ${OUT}`);

// Show sample of Hokkaido S/A rank spots
console.log('\n── Hokkaido S/A rank sample ──');
features
  .filter(f => f.properties.region === 'Hokkaido' && (f.properties.rank === 'S' || f.properties.rank === 'A'))
  .slice(0, 20)
  .forEach(f => {
    const p = f.properties;
    console.log(`[${p.rank}] ${p.title_ja}\n    → ${translate(p.title_ja)}\n`);
  });

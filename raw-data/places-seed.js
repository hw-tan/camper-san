/**
 * Seed list for scripts/geocode-places.js — named places (no map pin) that
 * search should still be able to find and pan/zoom to, e.g. "Mount Bandai".
 *
 * This is a STARTING POINT, not a researched/exhaustive list — review and
 * extend it before relying on it. `query` is the string sent to Nominatim;
 * include prefecture + "Japan" to avoid mismatches with same-named places
 * elsewhere in the world. `id` must be a stable, unique kebab-case slug.
 */
module.exports = [
  // Mountains
  { id: 'mt-bandai',    name_en: 'Mount Bandai',    name_ja: '磐梯山',   query: 'Mount Bandai, Fukushima, Japan',   type: 'mountain' },
  { id: 'mt-fuji',      name_en: 'Mount Fuji',      name_ja: '富士山',   query: 'Mount Fuji, Japan',                type: 'mountain' },
  { id: 'mt-aso',       name_en: 'Mount Aso',       name_ja: '阿蘇山',   query: 'Mount Aso, Kumamoto, Japan',       type: 'mountain' },
  { id: 'mt-yotei',     name_en: 'Mount Yotei',     name_ja: '羊蹄山',   query: 'Mount Yotei, Hokkaido, Japan',     type: 'mountain' },
  { id: 'mt-norikura',  name_en: 'Mount Norikura',  name_ja: '乗鞍岳',   query: 'Mount Norikura, Nagano, Japan',    type: 'mountain' },
  { id: 'mt-zao',       name_en: 'Mount Zao',       name_ja: '蔵王山',   query: 'Mount Zao, Yamagata, Japan',       type: 'mountain' },
  { id: 'ogawayama',    name_en: 'Ogawayama',       name_ja: '小川山',   query: 'Ogawayama, Kawakami, Nagano, Japan', type: 'mountain' },

  // Kogen / highlands
  { id: 'kirigamine-kogen', name_en: 'Kirigamine Kogen',  name_ja: '霧ヶ峰高原', query: 'Kirigamine Kogen, Nagano, Japan',   type: 'kogen' },
  { id: 'shiga-kogen',      name_en: 'Shiga Kogen',       name_ja: '志賀高原',   query: 'Shiga Kogen, Nagano, Japan',        type: 'kogen' },
  { id: 'aso-kuju-kogen',   name_en: 'Aso-Kuju Kogen',    name_ja: '阿蘇くじゅう高原', query: 'Kuju Kogen, Oita, Japan',     type: 'kogen' },
  { id: 'kirishima-kogen',  name_en: 'Kirishima Kogen',   name_ja: '霧島高原',   query: 'Kirishima Kogen, Kagoshima, Japan', type: 'kogen' },

  // National parks
  { id: 'shiretoko-np',       name_en: 'Shiretoko National Park',       name_ja: '知床国立公園',     query: 'Shiretoko National Park, Japan',       type: 'national_park' },
  { id: 'daisetsuzan-np',     name_en: 'Daisetsuzan National Park',     name_ja: '大雪山国立公園',   query: 'Daisetsuzan National Park, Japan',     type: 'national_park' },
  { id: 'nikko-np',           name_en: 'Nikko National Park',           name_ja: '日光国立公園',     query: 'Nikko National Park, Japan',           type: 'national_park' },
  { id: 'chubu-sangaku-np',   name_en: 'Chubu-Sangaku National Park',   name_ja: '中部山岳国立公園', query: 'Chubu-Sangaku National Park, Japan',   type: 'national_park' },

  // Ski areas
  { id: 'niseko',  name_en: 'Niseko',  name_ja: 'ニセコ', query: 'Niseko, Hokkaido, Japan', type: 'ski_area' },
  { id: 'hakuba',  name_en: 'Hakuba',  name_ja: '白馬',   query: 'Hakuba, Nagano, Japan',   type: 'ski_area' },

  // Van-life / camping districts
  { id: 'izu-peninsula',        name_en: 'Izu Peninsula',        name_ja: '伊豆半島',       query: 'Izu Peninsula, Shizuoka, Japan', type: 'district' },
  { id: 'noto-peninsula',       name_en: 'Noto Peninsula',       name_ja: '能登半島',       query: 'Noto Peninsula, Ishikawa, Japan', type: 'district' },
  { id: 'shimanami-kaido',      name_en: 'Shimanami Kaido',      name_ja: 'しまなみ海道',   query: 'Shimanami Kaido, Japan',          type: 'district' },
  { id: 'okinawa-main-island',  name_en: 'Okinawa Main Island',  name_ja: '沖縄本島',       query: 'Okinawa Island, Japan',           type: 'district' },

  // Prefectural capitals — one major city per prefecture, for broad nationwide
  // coverage of "search for a city/town" queries.
  { id: 'sapporo',    name_en: 'Sapporo',    name_ja: '札幌市',   query: 'Sapporo, Hokkaido, Japan',   type: 'city' },
  { id: 'aomori-city', name_en: 'Aomori',    name_ja: '青森市',   query: 'Aomori City, Aomori, Japan', type: 'city' },
  { id: 'morioka',    name_en: 'Morioka',    name_ja: '盛岡市',   query: 'Morioka, Iwate, Japan',      type: 'city' },
  { id: 'sendai',     name_en: 'Sendai',     name_ja: '仙台市',   query: 'Sendai, Miyagi, Japan',      type: 'city' },
  { id: 'akita-city', name_en: 'Akita',      name_ja: '秋田市',   query: 'Akita City, Akita, Japan',   type: 'city' },
  { id: 'yamagata-city', name_en: 'Yamagata', name_ja: '山形市', query: 'Yamagata City, Yamagata, Japan', type: 'city' },
  { id: 'fukushima-city', name_en: 'Fukushima', name_ja: '福島市', query: 'Fukushima City, Fukushima, Japan', type: 'city' },
  { id: 'mito',       name_en: 'Mito',       name_ja: '水戸市',   query: 'Mito, Ibaraki, Japan',       type: 'city' },
  { id: 'utsunomiya', name_en: 'Utsunomiya', name_ja: '宇都宮市', query: 'Utsunomiya, Tochigi, Japan', type: 'city' },
  { id: 'maebashi',   name_en: 'Maebashi',   name_ja: '前橋市',   query: 'Maebashi, Gunma, Japan',     type: 'city' },
  { id: 'saitama-city', name_en: 'Saitama',  name_ja: 'さいたま市', query: 'Saitama City, Saitama, Japan', type: 'city' },
  { id: 'chiba-city', name_en: 'Chiba',      name_ja: '千葉市',   query: 'Chiba City, Chiba, Japan',   type: 'city' },
  { id: 'tokyo',      name_en: 'Tokyo',      name_ja: '東京',     query: 'Tokyo, Japan',               type: 'city' },
  { id: 'yokohama',   name_en: 'Yokohama',   name_ja: '横浜市',   query: 'Yokohama, Kanagawa, Japan',  type: 'city' },
  { id: 'niigata-city', name_en: 'Niigata',  name_ja: '新潟市',   query: 'Niigata City, Niigata, Japan', type: 'city' },
  { id: 'toyama-city', name_en: 'Toyama',    name_ja: '富山市',   query: 'Toyama City, Toyama, Japan', type: 'city' },
  { id: 'kanazawa',   name_en: 'Kanazawa',   name_ja: '金沢市',   query: 'Kanazawa, Ishikawa, Japan',  type: 'city' },
  { id: 'fukui-city', name_en: 'Fukui',      name_ja: '福井市',   query: 'Fukui City, Fukui, Japan',   type: 'city' },
  { id: 'kofu',       name_en: 'Kofu',       name_ja: '甲府市',   query: 'Kofu, Yamanashi, Japan',     type: 'city' },
  { id: 'nagano-city', name_en: 'Nagano',    name_ja: '長野市',   query: 'Nagano City, Nagano, Japan', type: 'city' },
  { id: 'gifu-city',  name_en: 'Gifu',       name_ja: '岐阜市',   query: 'Gifu City, Gifu, Japan',     type: 'city' },
  { id: 'shizuoka-city', name_en: 'Shizuoka', name_ja: '静岡市', query: 'Shizuoka City, Shizuoka, Japan', type: 'city' },
  { id: 'nagoya',     name_en: 'Nagoya',     name_ja: '名古屋市', query: 'Nagoya, Aichi, Japan',       type: 'city' },
  { id: 'tsu',        name_en: 'Tsu',        name_ja: '津市',     query: 'Tsu, Mie, Japan',            type: 'city' },
  { id: 'otsu',       name_en: 'Otsu',       name_ja: '大津市',   query: 'Otsu, Shiga, Japan',         type: 'city' },
  { id: 'kyoto-city', name_en: 'Kyoto',      name_ja: '京都市',   query: 'Kyoto City, Kyoto, Japan',   type: 'city' },
  { id: 'osaka-city', name_en: 'Osaka',      name_ja: '大阪市',   query: 'Osaka City, Osaka, Japan',   type: 'city' },
  { id: 'kobe',       name_en: 'Kobe',       name_ja: '神戸市',   query: 'Kobe, Hyogo, Japan',         type: 'city' },
  { id: 'nara-city',  name_en: 'Nara',       name_ja: '奈良市',   query: 'Nara City, Nara, Japan',     type: 'city' },
  { id: 'wakayama-city', name_en: 'Wakayama', name_ja: '和歌山市', query: 'Wakayama City, Wakayama, Japan', type: 'city' },
  { id: 'tottori-city', name_en: 'Tottori',  name_ja: '鳥取市',   query: 'Tottori City, Tottori, Japan', type: 'city' },
  { id: 'matsue',     name_en: 'Matsue',     name_ja: '松江市',   query: 'Matsue, Shimane, Japan',     type: 'city' },
  { id: 'okayama-city', name_en: 'Okayama',  name_ja: '岡山市',   query: 'Okayama City, Okayama, Japan', type: 'city' },
  { id: 'hiroshima-city', name_en: 'Hiroshima', name_ja: '広島市', query: 'Hiroshima City, Hiroshima, Japan', type: 'city' },
  { id: 'yamaguchi-city', name_en: 'Yamaguchi', name_ja: '山口市', query: 'Yamaguchi City, Yamaguchi, Japan', type: 'city' },
  { id: 'tokushima-city', name_en: 'Tokushima', name_ja: '徳島市', query: 'Tokushima City, Tokushima, Japan', type: 'city' },
  { id: 'takamatsu',  name_en: 'Takamatsu',  name_ja: '高松市',   query: 'Takamatsu, Kagawa, Japan',   type: 'city' },
  { id: 'matsuyama',  name_en: 'Matsuyama',  name_ja: '松山市',   query: 'Matsuyama, Ehime, Japan',    type: 'city' },
  { id: 'kochi-city', name_en: 'Kochi',      name_ja: '高知市',   query: 'Kochi City, Kochi, Japan',   type: 'city' },
  { id: 'fukuoka-city', name_en: 'Fukuoka',  name_ja: '福岡市',   query: 'Fukuoka City, Fukuoka, Japan', type: 'city' },
  { id: 'saga-city',  name_en: 'Saga',       name_ja: '佐賀市',   query: 'Saga City, Saga, Japan',     type: 'city' },
  { id: 'nagasaki-city', name_en: 'Nagasaki', name_ja: '長崎市', query: 'Nagasaki City, Nagasaki, Japan', type: 'city' },
  { id: 'kumamoto-city', name_en: 'Kumamoto', name_ja: '熊本市', query: 'Kumamoto City, Kumamoto, Japan', type: 'city' },
  { id: 'oita-city',  name_en: 'Oita',       name_ja: '大分市',   query: 'Oita City, Oita, Japan',     type: 'city' },
  { id: 'miyazaki-city', name_en: 'Miyazaki', name_ja: '宮崎市', query: 'Miyazaki City, Miyazaki, Japan', type: 'city' },
  { id: 'kagoshima-city', name_en: 'Kagoshima', name_ja: '鹿児島市', query: 'Kagoshima City, Kagoshima, Japan', type: 'city' },
  { id: 'naha',       name_en: 'Naha',       name_ja: '那覇市',   query: 'Naha, Okinawa, Japan',       type: 'city' },

  // Popular tourist towns / districts (van-life relevant: onsen towns, ski
  // towns, historic districts) that aren't prefectural capitals.
  { id: 'hakone',       name_en: 'Hakone',       name_ja: '箱根町',   query: 'Hakone, Kanagawa, Japan',       type: 'town' },
  { id: 'karuizawa',    name_en: 'Karuizawa',    name_ja: '軽井沢町', query: 'Karuizawa, Nagano, Japan',      type: 'town' },
  { id: 'nikko-city',   name_en: 'Nikko',        name_ja: '日光市',   query: 'Nikko City, Tochigi, Japan',    type: 'town' },
  { id: 'kamakura',     name_en: 'Kamakura',     name_ja: '鎌倉市',   query: 'Kamakura, Kanagawa, Japan',     type: 'town' },
  { id: 'beppu',        name_en: 'Beppu',        name_ja: '別府市',   query: 'Beppu, Oita, Japan',            type: 'town' },
  { id: 'yufuin',       name_en: 'Yufuin',       name_ja: '由布院',   query: 'Yufuin, Oita, Japan',           type: 'town' },
  { id: 'takayama',     name_en: 'Takayama',     name_ja: '高山市',   query: 'Takayama, Gifu, Japan',         type: 'town' },
  { id: 'kurashiki',    name_en: 'Kurashiki',    name_ja: '倉敷市',   query: 'Kurashiki, Okayama, Japan',     type: 'town' },
  { id: 'otaru',        name_en: 'Otaru',        name_ja: '小樽市',   query: 'Otaru, Hokkaido, Japan',        type: 'town' },
  { id: 'furano',       name_en: 'Furano',       name_ja: '富良野市', query: 'Furano, Hokkaido, Japan',       type: 'town' },
  { id: 'matsumoto',    name_en: 'Matsumoto',    name_ja: '松本市',   query: 'Matsumoto, Nagano, Japan',      type: 'town' },
  { id: 'atami',        name_en: 'Atami',        name_ja: '熱海市',   query: 'Atami, Shizuoka, Japan',        type: 'town' },
  { id: 'nasu',         name_en: 'Nasu',         name_ja: '那須町',   query: 'Nasu, Tochigi, Japan',          type: 'town' },
  { id: 'fujikawaguchiko', name_en: 'Fujikawaguchiko', name_ja: '富士河口湖町', query: 'Fujikawaguchiko, Yamanashi, Japan', type: 'town' },
  { id: 'kusatsu-onsen', name_en: 'Kusatsu Onsen', name_ja: '草津町', query: 'Kusatsu, Gunma, Japan',         type: 'town' },
  { id: 'toba',         name_en: 'Toba',         name_ja: '鳥羽市',   query: 'Toba, Mie, Japan',              type: 'town' },
  { id: 'ine',          name_en: 'Ine',          name_ja: '伊根町',   query: 'Ine, Kyoto, Japan',             type: 'town' },
  { id: 'shirakawago',  name_en: 'Shirakawa-go', name_ja: '白川郷',   query: 'Shirakawa-go, Gifu, Japan',     type: 'town' },
];

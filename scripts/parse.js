#!/usr/bin/env node
/**
 * Camper-San data build script
 * Parses 7 regional JS files from syachuhaku.fxtec.info → public/spots.json (GeoJSON)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAW_DIR          = path.join(__dirname, '../raw-data');
const OUT_FILE         = path.join(__dirname, '../public/spots.json');
const TRANSLATIONS_CSV      = path.join(__dirname, '../translations.csv');
const DESC_TRANSLATIONS_CSV = path.join(__dirname, '../desc-translations.csv');

const FILES = [
  { file: 'hokkaidou.js', region: 'Hokkaido',         region_ja: '北海道' },
  { file: 'touhoku.js',   region: 'Tohoku',            region_ja: '東北' },
  { file: 'kantou.js',    region: 'Kanto',             region_ja: '関東' },
  { file: 'shin-etsu.js', region: 'Shin-Etsu',         region_ja: '信越' },
  { file: 'kansai.js',    region: 'Kansai',            region_ja: '関西' },
  { file: 'tyugokusikoku.js', region: 'Chugoku/Shikoku', region_ja: '中国四国' },
  { file: 'kyusyu.js',    region: 'Kyushu/Okinawa',   region_ja: '九州沖縄' },
];

const ICON_MAP = {
  'st':       { category: 'camping', label: 'Car Camp Spot',             emoji: '🅿️',  color: '#4CAF50' },
  'stM':      { category: 'camping', label: 'Roadside Station',          emoji: '🏪',  color: '#2196F3' },
  'stSAPA':   { category: 'highway', label: 'Highway Rest Area',         emoji: '🛣️',  color: '#9C27B0' },
  'stC':      { category: 'camping', label: 'Free Campground',           emoji: '🏕️',  color: '#66BB6A' },
  'sty':      { category: 'camping', label: 'Paid Parking',              emoji: '💰',  color: '#FF9800' },
  'styC':     { category: 'camping', label: 'Paid Campground',           emoji: '⛺',  color: '#FFA726' },
  'on':       { category: 'onsen',   label: 'Hot Spring',                emoji: '♨️',  color: '#F44336' },
  'on-Me':    { category: 'onsen',   label: 'Famous Hot Spring',         emoji: '♨️',  color: '#C62828' },
  'hs':       { category: 'onsen',   label: 'Camp Spot + Hot Spring',    emoji: '♨️',  color: '#00897B' },
  'hs-M':     { category: 'onsen',   label: 'Roadside Station + Onsen',  emoji: '♨️',  color: '#00796B' },
  'hs-MS':    { category: 'onsen',   label: 'Roadside Station + Onsen',  emoji: '♨️',  color: '#FFD700' },
  'hs-sw':    { category: 'onsen',   label: 'Campground + Shower',       emoji: '🚿',  color: '#00BCD4' },
  'hs-M-sw':  { category: 'onsen',   label: 'Roadside Station + Shower', emoji: '🚿',  color: '#00ACC1' },
  'hs-K-sw':  { category: 'highway', label: 'Highway Rest + Shower',     emoji: '🚿',  color: '#7B1FA2' },
  'hs-KS':    { category: 'highway', label: 'Highway Rest + Onsen',      emoji: '♨️',  color: '#FFD700' },
  'hsS':      { category: 'onsen',   label: 'Camp Spot + Onsen',         emoji: '♨️',  color: '#FFD700' },
  'zg':       { category: 'food',    label: 'Restaurant',                emoji: '🍜',  color: '#795548' },
  'zv':       { category: 'sights',  label: 'Sightseeing',               emoji: '🗺️',  color: '#607D8B' },
  'zm':       { category: 'sights',  label: 'Roadside Station (Info)',    emoji: 'ℹ️',  color: '#78909C' },
  'zy':       { category: 'sights',  label: 'Beach / Scenic Area',       emoji: '🏖️',  color: '#03A9F4' },
  'zk':       { category: 'sights',  label: 'Nature Spot',               emoji: '🌿',  color: '#8BC34A' },
  'zs':       { category: 'sights',  label: 'Scenic Park',               emoji: '🌳',  color: '#7CB342' },
  'zb':       { category: 'sights',  label: 'Convenience Spot',          emoji: '⛽',  color: '#9E9E9E' },
  'df':       { category: 'caution', label: 'Issues Reported',           emoji: '⚠️',  color: '#FF5722' },
  'q':        { category: 'other',   label: 'Region',                    emoji: '📍',  color: '#BDBDBD' },
};
const DEFAULT_ICON = { category: 'other', label: 'Other', emoji: '📍', color: '#BDBDBD' };

// Japanese place-type words → English (longest-match first)
const PLACE_WORDS = [
  ['ハイウェイオアシス', 'Highway Oasis'],
  ['オートキャンプ場', 'Auto Campground'],
  ['キャンプ場', 'Campground'],
  ['自然公園', 'Nature Park'],
  ['森林公園', 'Forest Park'],
  ['海水浴場', 'Swimming Beach'],
  ['ふれあい広場', 'Community Plaza'],
  ['道の駅', 'Roadside Station'],
  ['登山道', 'Hiking Trail'],
  ['展望台', 'Observation Deck'],
  ['温泉', 'Hot Spring'],
  ['公園', 'Park'],
  ['駐車場', 'Parking'],
  ['広場', 'Plaza'],
  ['海岸', 'Coast'],
  ['砂浜', 'Sandy Beach'],
  ['ビーチ', 'Beach'],
  ['漁港', 'Fishing Port'],
  ['港', 'Port'],
  ['高原', 'Highland'],
  ['牧場', 'Ranch'],
  ['峠', 'Pass'],
  ['渓谷', 'Valley'],
  ['滝', 'Waterfall'],
  ['湖', 'Lake'],
  ['池', 'Pond'],
  ['川', 'River'],
  ['山', 'Mt.'],
  ['神社', 'Shrine'],
  ['寺', 'Temple'],
  ['城', 'Castle'],
  ['市場', 'Market'],
  ['物産館', 'Local Products Hall'],
  ['無料駐車場', 'Free Parking'],
  ['物産店', 'Local Goods Shop'],
  ['道路公園', 'Road Park'],
  ['町', '-cho'],
  ['市', '-shi'],
  ['村', '-mura'],
  ['区', '-ku'],
  ['県', ' Pref.'],
];

// Bracket tag patterns (order matters — specific before catch-all)
const BRACKET_TAGS = [
  { re: /\[標高(\d+)m\]/g,       key: 'elevation', extractor: m => parseInt(m[1]),  en: '' },
  { re: /【Sランク[^】]*】/g,      key: 'rank',      val: 'S',   en: '[S-Rank] ' },
  { re: /【Aランク[^】]*】/g,      key: 'rank',      val: 'A',   en: '[A-Rank] ' },
  { re: /【Bランク[^】]*】/g,      key: 'rank',      val: 'B',   en: '[B-Rank] ' },
  { re: /【除外ランク[^】]*】/g,   key: 'rank',      val: 'X',   en: '' },
  { re: /【予定[^】]*】/g,         key: 'planned',   val: true,  en: '[Planned] ' },
  { re: /【有料[^】]*】/g,         key: 'paid',      val: true,  en: '[Paid] ' },
  { re: /【無料キャンプ場[^】]*】/g, key: 'free_camp', val: true, en: '[Free Camp] ' },
  { re: /【無料[^】]*】/g,         key: 'free',      val: true,  en: '[Free] ' },
  { re: /【静寂[^】]*】/g,         key: 'quiet',     val: true,  en: '[Quiet] ' },
  { re: /【トイレ夜間封鎖[^】]*】/g, key: 'warning', val: 'night-toilet', en: '[⚠ Night Toilets Closed] ' },
  { re: /【電話予約が必要[^】]*】/g, key: 'reservation', val: true, en: '[Reservation Required] ' },
  { re: /【[^】]*】/g,             key: null,        val: null,  en: '' },
];

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function removeEmoji(str) {
  return str.replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

function parseTitle(raw) {
  let s = raw || '';
  const tags = {};
  let enPrefix = '';

  for (const tag of BRACKET_TAGS) {
    const newRe = new RegExp(tag.re.source, 'g');
    const match = newRe.exec(s);
    if (match) {
      if (tag.extractor) {
        tags[tag.key] = tag.extractor(match);
      } else if (tag.key) {
        tags[tag.key] = tag.val;
      }
      if (tag.en) enPrefix += tag.en;
      s = s.replace(new RegExp(tag.re.source, 'g'), '').trim();
    }
  }

  // Remove hiragana-only parenthetical readings like （はなびとこうえん）
  s = s.replace(/（[ぁ-ん\s]+）/g, '').trim();

  const title_ja = removeEmoji(s).replace(/[、，。、\s]+$/, '').trim();

  // Build English by substituting place-type words
  let title_en = enPrefix;
  let working = title_ja;
  for (const [ja, en] of PLACE_WORDS) {
    working = working.split(ja).join(en);
  }
  title_en += working;

  return { title_ja, title_en, ...tags };
}

function extractDesc(raw) {
  const text = stripHtml(raw);

  const prices = [];
  for (const m of text.matchAll(/(\d+)円/g)) {
    const p = parseInt(m[1]);
    if (p >= 100 && p <= 30000) prices.push(p);
  }

  const hoursMatch = text.match(/(\d{1,2}:\d{2})[～〜](\d{1,2}:\d{2})/);
  const hours = hoursMatch ? `${hoursMatch[1]}–${hoursMatch[2]}` : null;

  const amenities = [];
  if (/トイレ/.test(text)) amenities.push('Toilets');
  if (/温泉|♨/.test(text)) amenities.push('Hot Spring');
  if (/シャワー/.test(text)) amenities.push('Showers');
  if (/コインランドリー/.test(text)) amenities.push('Laundry');
  if (/食堂|レストラン/.test(text)) amenities.push('Restaurant');
  if (/休憩室/.test(text)) amenities.push('Rest Room');
  if (/電源/.test(text)) amenities.push('Power');
  if (/Wi-Fi|WiFi|wifi/.test(text)) amenities.push('Wi-Fi');
  if (/コンビニ/.test(text)) amenities.push('Convenience Store Nearby');

  const warnings = [];
  if (/冬季閉鎖|冬期閉鎖/.test(text)) warnings.push('Closes in winter');
  if (/夜間.*閉鎖|閉鎖.*夜間/.test(text)) warnings.push('Closed at night');

  const parts = [];
  if (prices.length > 0) parts.push(`From ¥${Math.min(...prices).toLocaleString()}`);
  if (hours) parts.push(`Hours: ${hours}`);
  if (amenities.length > 0) parts.push(`Facilities: ${amenities.join(', ')}`);
  if (warnings.length > 0) parts.push(`⚠ ${warnings.join(' · ')}`);

  return {
    desc_ja: text,
    desc_en: parts.join(' · ') || null,
    price: prices.length > 0 ? Math.min(...prices) : null,
    hours,
    amenities,
  };
}

function loadTranslations() {
  if (!fs.existsSync(TRANSLATIONS_CSV)) return new Map();
  const xlat = new Map();
  const lines = fs.readFileSync(TRANSLATIONS_CSV, 'utf8')
    .replace(/^﻿/, '')   // strip BOM
    .split('\n').slice(1);    // skip header row
  for (const line of lines) {
    const fi = line.indexOf(',');
    if (fi < 0) continue;
    const rest = line.slice(fi + 1);
    const si = rest.indexOf(',');
    if (si < 0) continue;
    const title_ja = rest.slice(0, si).replace(/^"|"$/g, '');
    const title_en = rest.slice(si + 1).replace(/^"|"$/g, '').trim();
    if (title_ja && title_en) xlat.set(title_ja, title_en);
  }
  return xlat;
}

function loadDescTranslations() {
  if (!fs.existsSync(DESC_TRANSLATIONS_CSV)) return new Map();
  const map = new Map();
  const lines = fs.readFileSync(DESC_TRANSLATIONS_CSV, 'utf8')
    .replace(/^﻿/, '').split('\n').slice(1);
  for (const line of lines) {
    const fi = line.indexOf(',');
    if (fi < 0) continue;
    const id      = line.slice(0, fi).trim();
    const desc_en = line.slice(fi + 1).replace(/^"|"$/g, '').trim();
    if (id && desc_en) map.set(id, desc_en);
  }
  return map;
}

function parseFile(content) {
  const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  const ctx = {};
  try {
    vm.runInNewContext(cleaned, ctx);
  } catch (e) {
    console.error('  Parse error:', e.message.slice(0, 80));
  }
  return Array.isArray(ctx.spots) ? ctx.spots : [];
}

function main() {
  const xlat     = loadTranslations();
  const descXlat = loadDescTranslations();
  if (xlat.size > 0)     console.log(`  ${xlat.size} title translations loaded`);
  if (descXlat.size > 0) console.log(`  ${descXlat.size} description translations loaded`);
  if (xlat.size > 0 || descXlat.size > 0) console.log();

  const features = [];

  for (const { file, region, region_ja } of FILES) {
    const filepath = path.join(RAW_DIR, file);
    if (!fs.existsSync(filepath)) { console.warn(`Missing: ${filepath}`); continue; }

    const spots = parseFile(fs.readFileSync(filepath, 'utf8'));
    console.log(`  ${region}: ${spots.length} spots`);

    for (const spot of spots) {
      if (!Array.isArray(spot.pos) || spot.pos.length < 2) continue;

      const [lat, lng] = spot.pos;
      const iconInfo = ICON_MAP[spot.icon] || DEFAULT_ICON;
      const titleInfo = parseTitle(spot.title);

      // Apply translation lookup — preserve rank/status prefix already in title_en
      if (xlat.has(titleInfo.title_ja)) {
        const prefix = (titleInfo.title_en.match(/^(\[[^\]]+\]\s*)+/) || [''])[0];
        titleInfo.title_en = prefix + xlat.get(titleInfo.title_ja);
      }

      const descInfo = extractDesc(spot.desc);
      const spotId = String(features.length);
      if (descXlat.has(spotId)) descInfo.desc_en = descXlat.get(spotId);

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { id: features.length, region, region_ja, icon: spot.icon, ...iconInfo, ...titleInfo, ...descInfo },
      });
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ type: 'FeatureCollection', features }));
  console.log(`\n✅ ${features.length} spots → ${OUT_FILE}`);
}

main();

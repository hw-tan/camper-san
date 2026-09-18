#!/usr/bin/env node
/**
 * Camper-San places geocoder
 *
 * Manual, occasionally-rerun tool — NOT part of `npm run build`.
 *
 * Resolves the named-place seed list in raw-data/places-seed.js (mountains,
 * kogen highlands, national parks, districts with no map pin) to real
 * coordinates via OpenStreetMap's free Nominatim API, and writes the result
 * to public/places.json for the search feature to consume.
 *
 * Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
 * caps requests at 1/sec and requires a valid identifying User-Agent — this
 * script runs sequentially with a delay between requests and must not be
 * parallelized or looped in CI. Re-run it by hand whenever the seed list
 * changes.
 */
const fs = require('fs');
const path = require('path');

const SEED     = require('../raw-data/places-seed.js');
const OUT_FILE = path.join(__dirname, '../public/places.json');

const NOMINATIM_URL   = 'https://nominatim.openstreetmap.org/search';
const REQUEST_DELAY_MS = 1100; // stay safely under Nominatim's 1 req/sec limit
const USER_AGENT = 'camper-san-place-geocoder/1.0 (https://github.com/camper-san; contact: hwtan94@gmail.com)';

const ZOOM_BY_TYPE = {
  mountain: 12,
  ski_area: 12,
  kogen: 11,
  national_park: 9,
  district: 10,
  prefecture: 8,
  city: 11,
  town: 13,
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function geocodeOnce(query) {
  const url = `${NOMINATIM_URL}?${new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'jp' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim request failed: ${res.status} ${res.statusText}`);
  const results = await res.json();
  return results[0] || null;
}

// Nominatim falls back to loosely-tokenized/fuzzy matches when it has no real
// hit for a query, often returning an unrelated place with a plausible
// "importance" score (e.g. querying "能登半島" can return a glass museum with
// no name relation to the query at all). Importance alone can't be trusted —
// the returned `name` must actually relate to what we asked for.
function isRelevantMatch(query, result) {
  if (!result || !result.name) return false;
  return result.name.includes(query) || query.includes(result.name);
}

// Japanese place names are indexed far more reliably in OSM/Nominatim than
// their English glosses, so try the Japanese name first and fall back to the
// disambiguated English `query` string.
async function geocode(entry) {
  const candidates = [entry.name_ja, entry.query].filter(Boolean);
  for (let i = 0; i < candidates.length; i++) {
    const result = await geocodeOnce(candidates[i]);
    if (isRelevantMatch(candidates[i], result)) return result;
    if (i < candidates.length - 1) await sleep(REQUEST_DELAY_MS);
  }
  return null;
}

async function main() {
  const resolved = [];
  const skipped = [];

  for (const entry of SEED) {
    process.stdout.write(`Geocoding "${entry.name_ja || entry.query}"... `);
    let result;
    try {
      result = await geocode(entry);
    } catch (err) {
      console.log(`ERROR (${err.message})`);
      skipped.push(entry);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (!result) {
      console.log('no match — skipping');
      skipped.push(entry);
    } else {
      const zoom = ZOOM_BY_TYPE[entry.type] ?? 10;
      resolved.push({
        id: entry.id,
        name_en: entry.name_en,
        name_ja: entry.name_ja,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        zoom,
        type: entry.type,
      });
      console.log(`OK (${result.lat}, ${result.lon})`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(resolved, null, 2) + '\n');

  console.log(`\nResolved ${resolved.length}/${SEED.length} places → ${path.relative(process.cwd(), OUT_FILE)}`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}: ${skipped.map(e => e.id).join(', ')}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

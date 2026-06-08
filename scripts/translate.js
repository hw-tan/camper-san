#!/usr/bin/env node
/**
 * Batch-translate all spot title_ja → English via unofficial Google Translate.
 * Saves progress so it can be safely interrupted and resumed.
 * Usage: node scripts/translate.js
 */
const fs   = require('fs');
const path = require('path');

const SRC      = path.join(__dirname, '../public/spots.json');
const PROGRESS = path.join(__dirname, '../.translate-progress.json');
const OUT_CSV  = path.join(__dirname, '../translations-google.csv');

const DELAY_MS     = 150;   // base delay between requests
const BACKOFF_MS   = 3000;  // delay after a rate-limit hit
const MAX_RETRIES  = 4;
const SAVE_EVERY   = 100;   // save progress every N translations

function csvCell(v) {
  const s = String(v ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateWithRetry(translateFn, text, delay) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await translateFn(text, { from: 'ja', to: 'en' });
      return result.text;
    } catch (e) {
      const isRateLimit = e.message?.includes('429') || e.message?.includes('Too Many');
      if (isRateLimit && attempt < MAX_RETRIES) {
        const wait = BACKOFF_MS * attempt;
        process.stdout.write(` [rate-limit, waiting ${wait}ms]`);
        await sleep(wait);
      } else if (attempt === MAX_RETRIES) {
        throw e;
      }
    }
  }
}

async function main() {
  const { translate } = await import('@vitalets/google-translate-api');

  const { features } = JSON.parse(fs.readFileSync(SRC, 'utf8'));

  // Deduplicate titles, preserve insertion order (roughly by rank)
  const titleMap = new Map();
  for (const f of features) {
    const { id, title_ja } = f.properties;
    if (!title_ja) continue;
    if (!titleMap.has(title_ja)) titleMap.set(title_ja, []);
    titleMap.get(title_ja).push(id);
  }

  const uniqueTitles = [...titleMap.keys()];
  console.log(`${features.length} spots · ${uniqueTitles.length} unique titles\n`);

  // Load saved progress
  let cache = {};
  if (fs.existsSync(PROGRESS)) {
    cache = JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
    console.log(`Resuming from ${Object.keys(cache).length} already cached\n`);
  }

  let done = 0, skipped = 0, errors = 0;
  const startTime = Date.now();

  for (const title_ja of uniqueTitles) {
    if (cache[title_ja] !== undefined) { skipped++; done++; continue; }

    try {
      const translated = await translateWithRetry(translate, title_ja, DELAY_MS);
      cache[title_ja] = translated;
    } catch (e) {
      errors++;
      console.error(`\n  ✗ "${title_ja}" — ${e.message.slice(0, 60)}`);
      cache[title_ja] = ''; // mark as attempted so we don't retry forever
    }

    done++;

    if (done % SAVE_EVERY === 0) {
      fs.writeFileSync(PROGRESS, JSON.stringify(cache));
      const elapsed  = ((Date.now() - startTime) / 1000).toFixed(0);
      const remaining = Math.round((uniqueTitles.length - done) * DELAY_MS / 1000);
      process.stdout.write(`\r  ${done}/${uniqueTitles.length} · ${errors} errors · ~${remaining}s left   `);
    }

    await sleep(DELAY_MS);
  }

  // Final progress save
  fs.writeFileSync(PROGRESS, JSON.stringify(cache));

  // Write CSV keyed on title_ja
  const rows = ['title_ja,title_en'];
  for (const [title_ja, title_en] of Object.entries(cache)) {
    if (title_en) rows.push([csvCell(title_ja), csvCell(title_en)].join(','));
  }
  fs.writeFileSync(OUT_CSV, '﻿' + rows.join('\n'), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n\n✅ ${done - skipped} new · ${skipped} cached · ${errors} errors · ${elapsed} min → ${OUT_CSV}`);
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Convert the full spots-export CSV back into desc-translations.csv (id, desc_en).
 * Also updates translations.csv if title_en has changed.
 * Usage: node scripts/import-desc.js <path-to-export.csv>
 */
const fs   = require('fs');
const path = require('path');

const srcPath  = process.argv[2];
if (!srcPath) { console.error('Usage: node import-desc.js <export.csv>'); process.exit(1); }

const DESC_OUT  = path.join(__dirname, '../desc-translations.csv');
const TITLE_OUT = path.join(__dirname, '../translations.csv');
const SPOTS     = path.join(__dirname, '../public/spots.json');

// ── Proper CSV parser (handles quoted multi-line fields) ──────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"')                     { inQ = false; }
      else                                     { cell += ch; }
    } else {
      if      (ch === '"')  { inQ = true; }
      else if (ch === ',')  { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') { cell += ch; }
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvCell(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r'))
    return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// ── Parse upload ──────────────────────────────────────────────────────────
const raw  = fs.readFileSync(srcPath, 'utf8').replace(/^﻿/, '');
const rows = parseCSV(raw);
const [header, ...dataRows] = rows;

const COL = {};
header.forEach((h, i) => { COL[h.trim()] = i; });

const idCol      = COL['id'];
const titleJaCol = COL['title_ja'];
const titleEnCol = COL['title_en'];
const descEnCol  = COL['desc_en'];

if (idCol === undefined || descEnCol === undefined) {
  console.error('Could not find required columns. Got:', header.join(', '));
  process.exit(1);
}

// ── Build desc-translations.csv ───────────────────────────────────────────
const descRows = ['id,desc_en'];
let descCount = 0;
for (const row of dataRows) {
  const id      = (row[idCol] ?? '').trim();
  const desc_en = (row[descEnCol] ?? '').trim();
  if (!id || !desc_en) continue;
  descRows.push([id, desc_en].map(csvCell).join(','));
  descCount++;
}
fs.writeFileSync(DESC_OUT, '﻿' + descRows.join('\n'), 'utf8');
console.log(`✅ ${descCount} description translations → desc-translations.csv`);

// ── Update translations.csv if title_en changed ───────────────────────────
if (titleJaCol !== undefined && titleEnCol !== undefined && fs.existsSync(SPOTS)) {
  // Load existing title translations keyed by title_ja
  const existing = new Map();
  if (fs.existsSync(TITLE_OUT)) {
    const tLines = fs.readFileSync(TITLE_OUT, 'utf8').replace(/^﻿/, '').split('\n').slice(1);
    for (const line of tLines) {
      const fi = line.indexOf(',');
      if (fi < 0) continue;
      const rest = line.slice(fi + 1);
      const si   = rest.indexOf(',');
      if (si < 0) continue;
      const ja = rest.slice(0, si).replace(/^"|"$/g, '');
      const en = rest.slice(si + 1).replace(/^"|"$/g, '').trim();
      if (ja && en) existing.set(ja, en);
    }
  }

  let updated = 0;
  for (const row of dataRows) {
    const title_ja = (row[titleJaCol] ?? '').trim();
    const title_en = (row[titleEnCol] ?? '').trim();
    if (!title_ja || !title_en) continue;
    if (existing.get(title_ja) !== title_en) { existing.set(title_ja, title_en); updated++; }
  }

  if (updated > 0) {
    // Re-read existing CSV to preserve row order and IDs, only update title_en
    const csvLines = fs.readFileSync(TITLE_OUT, 'utf8').replace(/^﻿/, '').split('\n');
    const header2  = csvLines[0];
    const outLines = [header2];
    for (const line of csvLines.slice(1)) {
      const fi = line.indexOf(',');
      if (fi < 0) { if (line.trim()) outLines.push(line); continue; }
      const rest   = line.slice(fi + 1);
      const si     = rest.indexOf(',');
      if (si < 0)  { outLines.push(line); continue; }
      const id     = line.slice(0, fi);
      const ja     = rest.slice(0, si).replace(/^"|"$/g, '');
      const en_new = existing.get(ja);
      if (en_new !== undefined) {
        outLines.push([id, csvCell(ja), csvCell(en_new)].join(','));
      } else {
        outLines.push(line);
      }
    }
    fs.writeFileSync(TITLE_OUT, '﻿' + outLines.join('\n'), 'utf8');
    console.log(`✅ ${updated} title translations updated → translations.csv`);
  } else {
    console.log('  No title changes detected.');
  }
}

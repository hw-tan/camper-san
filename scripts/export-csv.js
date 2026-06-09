#!/usr/bin/env node
/**
 * Export spots.json → CSV for translation.
 * Key translatable fields: title_ja, title_en (current), desc_ja, desc_en (current auto-extracted).
 * When the translated file is returned, parse.js reads desc-translations.csv (id, desc_en)
 * to override the auto-extracted desc_en.
 */
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public/spots.json');
const OUT = path.join(__dirname, '../spots-export.csv');

function csvCell(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(cols) {
  return cols.map(csvCell).join(',');
}

const { features } = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const HEADER = [
  'id',
  'title_ja',       // Japanese title — source text
  'title_en',       // English title  — current translation (editable)
  'desc_ja',        // Japanese description — source text to translate
  'desc_en',        // English description — current auto-extracted summary (editable)
  'region',
  'region_ja',
  'icon',
  'label',          // English spot-type label
  'category',
  'rank',           // S / A / B
  'paid',
  'free_camp',
  'price',
  'hours',
  'amenities',      // pipe-separated list
  'elevation',
];

const rows = [
  HEADER.join(','),
  ...features.map(f => {
    const p = f.properties;
    return csvRow([
      p.id,
      p.title_ja,
      p.title_en,
      p.desc_ja,
      p.desc_en,
      p.region,
      p.region_ja,
      p.icon,
      p.label,
      p.category,
      p.rank ?? '',
      p.paid ?? '',
      p.free_camp ?? '',
      p.price ?? '',
      p.hours ?? '',
      Array.isArray(p.amenities) ? p.amenities.join(' | ') : '',
      p.elevation ?? '',
    ]);
  }),
];

fs.writeFileSync(OUT, '﻿' + rows.join('\n'), 'utf8'); // BOM for Excel/Sheets compatibility
console.log(`✅ ${features.length} rows → ${OUT}`);

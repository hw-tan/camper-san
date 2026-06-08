#!/usr/bin/env node
/**
 * Export spots.json → CSV for translation review.
 * Columns: id, title_ja, title_en, category, label, region, region_ja, icon
 */
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public/spots.json');
const OUT = path.join(__dirname, '../spots-export.csv');

function csvCell(v) {
  const s = String(v ?? '');
  // Wrap in quotes if the value contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(cols) {
  return cols.map(csvCell).join(',');
}

const { features } = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const HEADER = ['id', 'title_ja', 'title_en', 'category', 'label', 'region', 'region_ja', 'icon'];

const rows = [
  HEADER.join(','),
  ...features.map(f => {
    const p = f.properties;
    return csvRow([p.id, p.title_ja, p.title_en, p.category, p.label, p.region, p.region_ja, p.icon]);
  }),
];

fs.writeFileSync(OUT, '﻿' + rows.join('\n'), 'utf8'); // BOM for Excel compatibility
console.log(`✅ ${features.length} rows → ${OUT}`);

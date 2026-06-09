# Camper-San — Project Guide

## What this is
A mobile-first PWA map of ~9,500 camping and overnight spots across Japan. Users browse, filter, favourite, and navigate to spots. Built for personal use; deployed on Vercel.

## Tech stack
- **Map**: MapLibre GL JS 4.7.1 — WebGL vector tile renderer
- **Base tiles**: CartoDB Voyager GL (`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`) — free, no API key, English labels
- **Frontend**: Single-file vanilla JS IIFE in `public/index.html` — no build step, no framework
- **Data**: `public/spots.json` — GeoJSON FeatureCollection (~9,547 features)
- **Offline**: Service worker in `public/sw.js` — network-first for app shell, tile caching for map
- **Hosting**: Vercel (auto-deploys from master)

## Key files
| File | Purpose |
|------|---------|
| `public/index.html` | Entire app — HTML, CSS, JS in one file |
| `public/spots.json` | Source of truth for all spot data (GeoJSON) |
| `public/sw.js` | Service worker — cache strategy, offline support |
| `scripts/parse.js` | Rebuilds `spots.json` from raw source data + translations |
| `scripts/export-csv.js` | Exports `spots.json` → `spots-export.csv` for translation |
| `scripts/import-desc.js` | Imports translated CSV → `desc-translations.csv` + updates `translations.csv` |
| `translations.csv` | Title translations: `id, title_ja, title_en` |
| `desc-translations.csv` | Description translations: `id, desc_en` |

## Translation data pipeline
When the user wants to update translations:
1. `node scripts/export-csv.js` → produces `spots-export.csv`
2. User opens in Google Sheets, uses `=GOOGLETRANSLATE()` on `desc_en` and `title_en` columns
3. User returns the edited CSV
4. `node scripts/import-desc.js <returned-file.csv>` → updates `desc-translations.csv` and `translations.csv`
5. `node scripts/parse.js` → rebuilds `public/spots.json`
6. Verify: check spot count and sample a few descriptions

## MapLibre patterns — critical to get right

### Coordinate order
MapLibre uses **`[longitude, latitude]`** everywhere (GeoJSON standard). This is the opposite of Leaflet.
```js
map.easeTo({ center: [lng, lat] });           // ✅ correct
map.easeTo({ center: [lat, lng] });           // ❌ wrong — will fly to wrong place
map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 56 });
```

### Feature property lookup
MapLibre serialises feature properties on click events — arrays like `amenities` come back as strings. Always look up the original feature from `featureById`:
```js
map.on('click', 'spots-points', e => {
  const f = featureById.get(String(e.features[0].properties.id));
  if (f) openSheet(f);   // f has original arrays intact
});
```

### Two-source architecture (favourites never cluster)
```js
map.addSource('spots', { type: 'geojson', cluster: true, ... });  // non-favs, clustered
map.addSource('favs',  { type: 'geojson', ... });                 // favs, never clustered

// In applyFilters():
const favFeats   = filtered.filter(f => favs.has(String(f.properties.id)));
const otherFeats = filtered.filter(f => !favs.has(String(f.properties.id)));
map.getSource('spots').setData({ type: 'FeatureCollection', features: otherFeats });
map.getSource('favs').setData({ type: 'FeatureCollection', features: favFeats });
```

### Sources/layers must be added inside `map.on('load', ...)`
```js
map.on('load', () => {
  initMapLayers();   // addSource / addLayer calls go here
  fetch('/spots.json').then(...);
});
```

## Filter system
Tags live in `TAG_FNS` — each key maps to a predicate on a GeoJSON feature `f`:
```js
const TAG_FNS = {
  overnight: f => ['st','stM','stC','sty','styC','hs',...].includes(f.properties.icon),
  onsen:     f => [...].includes(f.properties.icon),
  nature:    f => f.properties.category === 'sights',
  paid:      f => f.properties.paid === true || ['sty','styC'].includes(f.properties.icon),
  saved:     f => favs.has(String(f.properties.id)),
  // ...
};
```
To add a new filter: add a predicate to `TAG_FNS`, add a `<button class="fp-chip" data-tag="...">` in the HTML filter panel.

## Language
- Default is always **English** on every load — `let lang = 'en';` (no localStorage read on init)
- Toggle button in topbar switches between EN/JA within the session
- `displayTitle(p)` returns the right title based on `lang`

## Git workflow
- **Feature branch**: `claude/vercel-repo-editing-TV5cv` is the active dev branch
- Always develop on the feature branch, PR into `master`
- Force-push with `--force-with-lease` is safe on this branch (it's a single-developer repo)
- After a squash-merge, the branch history diverges — create a new branch from master rather than rebasing
- Vercel auto-deploys master; preview deployments are created for open PRs

## SW cache versioning
Bump `CACHE` and `TILE_CACHE` version strings in `public/sw.js` whenever the app shell changes significantly. Current: `campersan-v4` / `campersan-tiles-v4`.

## Coding style
- No comments unless the WHY is non-obvious
- No extra abstractions for hypothetical future use
- No error handling for impossible cases — trust internal guarantees
- Prefer editing existing files; don't create new ones unless genuinely needed
- Keep `public/index.html` as a single self-contained file — no bundler, no imports

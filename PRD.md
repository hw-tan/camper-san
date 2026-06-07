# Camper-San — Feature PRD
## Features: Search, Near Me, Favorites, Offline, Distance

**Status:** Draft  
**Date:** 2026-06-07

---

## Background

Camper-San is a Japan van-life PWA showing ~thousands of camping spots, onsens, highway rest stops, food, and sights on a Leaflet map. Users are typically driving across Japan and consulting the app roadside or in remote areas with poor signal. The five features below address the most common friction points in that use case.

---

## Feature 1 — Search Bar

### Problem
Users cannot find a spot by name, region, or keyword. The only discovery mechanism is panning the map or tapping filter chips — neither works if you know where you want to go.

### Goal
Let users type a query and instantly see matching spots highlighted on the map and in a results list.

### User Stories
- As a user, I want to type a place name (English or Japanese) and see matching spots so I can navigate directly without panning.
- As a user, I want results to appear as I type so I don't have to press Enter.
- As a user, I want to tap a result and have the map fly to that spot and open its detail sheet.

### Requirements

| # | Requirement |
|---|-------------|
| 1.1 | A search icon button in the top bar expands an input field when tapped. Tapping again or pressing Escape collapses it. |
| 1.2 | Search runs client-side against `title_en`, `title_ja`, `region`, and `region_ja` fields. No server round-trip. |
| 1.3 | Results appear in a scrollable list overlay (max 8 rows visible) below the top bar, updating on every keystroke with debounce ≤ 150 ms. |
| 1.4 | Each result row shows: emoji + spot name (EN) + region + rank tag if S or A. |
| 1.5 | Tapping a result closes the search overlay, flies the map to the spot at zoom 14, and opens the bottom sheet for that spot. |
| 1.6 | If the search query is empty, the list is hidden and all active filter chips remain in effect. |
| 1.7 | Search and filter chips are independent but compose: search narrows within the active chip filter (e.g. searching "湯" while the Onsen chip is active only searches onsen spots). |
| 1.8 | Minimum query length to trigger search: 1 character. |
| 1.9 | "No results" state shows a short message rather than an empty list. |

### Out of Scope
- Fuzzy / typo-tolerant matching (v1 uses substring match)
- Server-side search or indexing

---

## Feature 2 — "Near Me" Radius Filter

### Problem
A user parked for the night wants to find spots within driving range. Zooming and panning the map is slow and imprecise; there is no way to say "show me everything within 100 km."

### Goal
Let users filter visible spots to a radius around their current GPS position.

### User Stories
- As a user, I want to tap a button and see only spots within a chosen radius of my current location.
- As a user, I want to pick from a few preset distances (50 / 100 / 200 km) so I don't have to type anything.
- As a user, I want the map to zoom to fit the filtered results so I don't have to do it manually.

### Requirements

| # | Requirement |
|---|-------------|
| 2.1 | A "Near Me" button is added to the top bar (next to the existing locate button). |
| 2.2 | Tapping "Near Me" requests GPS. On success, presents a bottom action sheet with three options: 50 km / 100 km / 200 km and a "Clear" option. |
| 2.3 | On selection, the map renders only markers within the chosen great-circle radius of the user's coordinates. |
| 2.4 | A dismissible pill/badge below the top bar shows the active radius (e.g. "📍 Within 100 km"). Tapping it opens the radius picker again. |
| 2.5 | Radius filtering composes with active filter chips (e.g. "Hot Springs within 50 km"). |
| 2.6 | Radius filtering does NOT compose with Search (search clears the radius badge; applying a radius clears the search). |
| 2.7 | After filtering, the map pans/zooms to fit the visible markers with `fitBounds` and padding. |
| 2.8 | Spot count in the top bar reflects the radius-filtered count. |
| 2.9 | GPS permission denial shows a non-blocking toast: "Location access needed for Near Me." |
| 2.10 | "Clear" resets to the previously active chip filter. |

### Out of Scope
- Custom radius input
- Continuous location tracking / auto-updating radius

---

## Feature 3 — Favorites / Bookmarks

### Problem
Users discover good spots while browsing but have no way to save them. They lose track of spots they wanted to visit.

### Goal
Let users bookmark spots locally, persistently, with zero backend or login.

### User Stories
- As a user, I want to heart a spot so I can find it again later.
- As a user, I want a filter chip that shows only my saved spots.
- As a user, I want my favorites to survive closing and reopening the app.

### Requirements

| # | Requirement |
|---|-------------|
| 3.1 | A heart icon button (🤍 / ❤️) appears in the bottom sheet action row alongside the existing Google Maps and Navigate buttons. |
| 3.2 | Tapping the heart toggles the spot in/out of a favorites set stored in `localStorage` under key `campersan_favs` as a JSON array of spot IDs. |
| 3.3 | When the sheet opens for a favorited spot, the heart renders as filled (❤️). For unfavorited spots it renders hollow (🤍). |
| 3.4 | A "❤️ Saved" filter chip is added to the filter bar between "⭐ A/S Rank" and "⚠️ Caution". |
| 3.5 | Favorited markers render with a small heart overlay or a distinct border color on the map so they are visually identifiable while browsing. |
| 3.6 | If a user has zero favorites and taps the Saved chip, show a bottom sheet message: "No saved spots yet — tap ❤️ on any spot to save it." |
| 3.7 | Favorites persist across sessions via `localStorage`. No account or sync required. |
| 3.8 | Favorites survive the Offline feature (Feature 5) — they must be readable without network. |

### Out of Scope
- Cloud sync / sharing favorites
- Folders or named lists

---

## Feature 5 — Offline Support (Service Worker)

### Problem
Camping and van-life destinations are often in areas with no mobile signal. The app becomes a blank screen without connectivity, precisely when users need it most.

### Goal
Make the app fully usable without a network connection after first load.

### User Stories
- As a user driving in a tunnel or mountain area, I want the app to still show the map and all spot data even with no signal.
- As a user, I want the app to automatically update its cached data when I'm back online without any manual action.

### Requirements

| # | Requirement |
|---|-------------|
| 5.1 | A Service Worker (`sw.js`) is registered on app load. |
| 5.2 | The Service Worker pre-caches on install: `index.html`, `spots.json`, Leaflet JS/CSS, MarkerCluster JS/CSS. |
| 5.3 | Cache strategy for `spots.json`: **stale-while-revalidate** — serve from cache immediately, fetch update in background, swap on next load. |
| 5.4 | Cache strategy for `index.html`: **network-first with cache fallback** — try network, fall back to cache if offline. |
| 5.5 | Cache strategy for Leaflet CDN assets: **cache-first** (they are versioned and immutable). |
| 5.6 | Map tiles (OpenStreetMap) are cached on access with an LRU limit of 500 tiles (≈ 5 MB) using a separate tile cache. |
| 5.7 | A small "Offline" badge appears in the top bar when the app detects no connectivity (`navigator.onLine` + `online`/`offline` events). It disappears when connectivity resumes. |
| 5.8 | When a new version of `spots.json` or `index.html` is downloaded in the background, a non-intrusive toast appears: "Update ready — reload to refresh." with a Reload button. |
| 5.9 | The Service Worker uses a versioned cache name (e.g. `campersan-v1`) so deploys cleanly bust the old cache. |
| 5.10 | `manifest.json` already exists; confirm `start_url`, `display: standalone`, and icon paths are correct for add-to-homescreen. |

### Out of Scope
- Background sync for user-generated data
- Push notifications

---

## Feature 6 — Distance Indicator

### Problem
When a user opens a spot's detail sheet, there is no sense of how far away it is. They have to mentally estimate from the map or switch to Google Maps just to check distance.

### Goal
Show the straight-line distance from the user's current location to a spot, directly in the detail sheet.

### User Stories
- As a user viewing a spot's detail, I want to immediately see how far away it is so I can decide if it's worth the drive tonight.
- As a user browsing the map, I want markers to optionally show distance so I can compare nearby options at a glance.

### Requirements

| # | Requirement |
|---|-------------|
| 6.1 | When the user has granted GPS permission (from any previous action), the detail sheet shows a distance row: `📏 Distance — 34 km away`. |
| 6.2 | Distance is calculated as great-circle (Haversine) distance in km, rounded to the nearest km. Under 1 km shows as "< 1 km". |
| 6.3 | If GPS is not yet available, the distance row is omitted (not shown as blank or "—"). |
| 6.4 | GPS position is cached in memory for the session; distance calculation does not re-request location each time a sheet opens. |
| 6.5 | When the user taps the locate button (📍) and GPS is acquired, any open sheet refreshes its distance row without reopening. |
| 6.6 | If the Near Me filter is active (Feature 2), the distance row is always present since GPS is already known. |
| 6.7 | Distance is recalculated if the user's GPS position updates (e.g. they tapped locate again with a new position). |

### Out of Scope
- Driving distance / route distance (straight-line only)
- Distance shown on map markers while browsing (can be a follow-up)

---

## Implementation Order

| Sprint | Features | Rationale |
|--------|----------|-----------|
| 1 | Feature 3 (Favorites) + Feature 6 (Distance) | Pure client-side, no new permissions flow, low risk. Establishes GPS caching pattern used by Feature 2. |
| 2 | Feature 2 (Near Me) + Feature 1 (Search) | Both depend on the GPS session cache from Sprint 1. Search is UI-only; Near Me adds the radius logic. |
| 3 | Feature 5 (Offline / Service Worker) | Added last so the SW caches the final built assets, not intermediate versions. |

---

## Shared Technical Notes

- **GPS position**: A single module (`gps.js` or inline) manages one `watchPosition` handle and exposes `getPosition()` returning the last known coords. All features read from this shared cache.
- **localStorage keys**: `campersan_favs` (array of spot IDs). No other keys needed for these five features.
- **Spot ID**: Each spot needs a stable ID for favorites storage. Use the `title_ja` + coordinate pair as a hash, or add an `id` field in `parse.js` during the build step.
- **No new dependencies**: All five features are implementable with vanilla JS + the existing Leaflet stack.
- **Bundle size**: Everything stays in `index.html` + `sw.js`. No bundler needed.

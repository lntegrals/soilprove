# SoilProve

**Field-specific nitrogen decisions, grounded in live field intelligence.**

SoilProve is a multi-page precision-agriculture workspace that translates a
single field coordinate into a defensible nitrogen recommendation — reviewable
by an agronomist and validated by a real on-farm trial.

This repository is the Cape Girardeau Vibeathon prototype build.

---

## Why this exists

The deeper agronomy problem isn't fertilizer waste. It's that **farmers fear
yield loss more than they value paper savings**. SoilProve closes that gap by
making every nitrogen recommendation:

1. **Defensible** — every lb is tied to an explicit soil, weather, agronomic, or economic driver.
2. **Live-data-grounded** — pulled directly from USDA NRCS soil maps and the National Weather Service for the exact field coordinate.
3. **Agronomist-owned** — there is a real review surface where a CCA can approve, adjust, or send back the recommendation.
4. **Trial-ready** — a low-risk strip trial generates the proof before the recommendation scales.
5. **Validated by outcome** — harvest results feed a margin / yield / fertilizer verdict.

---

## What is live

| Layer       | Source                                                                                  | What we use                                         |
| ----------- | --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Soil        | USDA NRCS Soil Data Access — **SSURGO**                                                | Dominant map unit / component, texture, drainage class, hydrologic group, organic matter (depth-weighted 0–30 cm), available water storage, ksat, taxonomy |
| Weather     | National Weather Service — **api.weather.gov**                                          | Grid resolution, 7-day forecast, precipitation probabilities, temperature, near-term rain risk |
| Geocoding   | US Census Geocoding Services (oneline address)                                          | Optional free-text → lat/lon convenience            |

Soil and weather both flow into the recommendation engine — they are not
decorative. The recommendation visibly responds to soil texture, drainage,
organic matter, and forecast precipitation.

The recommendation engine, confidence scoring, and explanation layer are
deterministic rule-based heuristics in this build — there is no trained ML
model yet. The architecture is built so a trained model can drop in cleanly
(see `ARCHITECTURE.md`).

---

## Workflow

Eight routed pages, one persistent field state:

1. **`/`** — Premium landing. Sets the product thesis and routes the user into the workspace.
2. **`/workspace`** — Workspace dashboard. Active fields, projected savings, freshness of live data, review status.
3. **`/workspace/field/[id]/setup`** — Field identity, location (lat/lon + optional geocode), acreage, economics, residual N, previous crop.
4. **`/workspace/field/[id]/intelligence`** — Live USDA soil profile + live NWS forecast. Risk bars for leaching, denitrification, weather loss.
5. **`/workspace/field/[id]/recommendation`** — Decision console. Reference rate, driver waterfall, confidence, economics, feature snapshot.
6. **`/workspace/field/[id]/review`** — Agronomist review. Approve, approve with adjusted rate, or request revision. Rationale persisted.
7. **`/workspace/field/[id]/trial`** — Low-risk strip trial planner. Strip preview, trial vs control rates, success metrics, CSV export.
8. **`/workspace/field/[id]/outcome`** — Harvest entry. Yield comparison chart. Validated / inconclusive / needs-more-data verdict. Next-year action.
9. **`/method`** — Concise method, data sources, model interface, and honesty rail.

State persists in `localStorage` (`soilprove.workspace.v1`) so edits survive
refresh and you can move freely between pages.

---

## Recommendation engine

The engine is a **transparent additive heuristic** over a typed feature vector:

```
baseline      = regional MRTN reference for the field's state
+ previous crop delta              (agronomy)
+ residual N delta                 (agronomy)
+ organic matter mineralization    (soil)     ← live SSURGO
+ leaching / denit soil delta      (soil)     ← live SSURGO
+ weather-loss-risk delta          (weather)  ← live NWS
+ N-to-corn price ratio delta      (economics)
————————————————————————————————————————————
= SoilProve recommended rate
```

The model exposes a `RecommendationModel` interface (`name`, `version`,
`modelClass`, `recommend(features, inputs)`) so a trained predictor can replace
the heuristic without touching feature extraction or the UI.

A `DecisionFeatures` type vector — defined once in `src/lib/types.ts` and
produced by `extractFeatures()` — is the contract every downstream module
consumes. That is the ML interface point.

Confidence is a 0..1 score with penalties for: rate far from the regional
reference, elevated weather loss risk, leachy soil profile, and small field
size. Risk flags are surfaced explicitly on the recommendation page.

---

## Running locally

```bash
npm install
npm run dev
```

The app boots at `http://localhost:3000` (or whatever port Next picks). Live
USDA and NWS calls happen server-side from Next API routes; no API keys are
required. The first soil + weather fetch warms the in-browser cache.

Build & lint:

```bash
npm run build   # production build
npm run lint    # next lint — no warnings or errors
```

No environment variables are required for any live data source. See
`.env.example` for an optional contact-email header you can set if you're
running NWS at higher volumes.

---

## Demo (5 minutes)

The end-to-end demo script lives in `DEMO_SCRIPT.md`. Quick path:

1. Hit `/` and click **Open workspace**.
2. Open the flagship field, jump to **Field Intelligence** — point at the live USDA map unit and the 7-day NWS forecast.
3. Move to **Recommendation** — show the driver waterfall and the confidence score moving with soil + weather inputs.
4. Open **Agronomist Review** — approve with an adjusted rate.
5. **Trial Planner** — show the strip preview and CSV export.
6. **Outcome** — drag a yield input to flip the verdict from inconclusive → validated.

---

## Deployment notes

This is a stock Next.js 14 App Router app with no server-side runtime
dependencies beyond Node 18+. It deploys cleanly to Vercel, Fly, Render, or
any Node host. The three live integrations (USDA SDA, NWS, Census Geocoder)
are all public and unauthenticated, so a deploy needs no secrets.

For higher production traffic against NWS, set
`NWS_USER_AGENT="YourApp (contact@example.com)"` and pipe it through
`src/lib/integrations/nws.ts`. NWS asks every consumer to identify themselves.

---

## Architecture

See `ARCHITECTURE.md` for the route map, data flow, engine modules, and ML
extension path. The architecture is intentionally **ML-ready**: the next pass
can plug a trained yield-response model into the existing recommendation
interface without touching the UI.

---

## What is *not* real yet (honesty rail)

- No trained ML model in this build — the engine is rules-based.
- No bundled farmer outcome data. The outcome page works on the user's own trial input.
- No real retailer / OEM integrations.
- Regional MRTN reference rates are conservative state-level averages, not field-specific calibrations.
- When USDA SDA or NWS is unreachable, the app falls back to a clearly-labelled regional estimate (the badge changes from "Live USDA" to "Fallback").

---

## License

Prototype build — not for production agronomy.

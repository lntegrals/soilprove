# SoilProve · Architecture

SoilProve is a Next.js 14 App Router application with three runtime layers:

1. **UI / route layer** — premium SaaS-style app shell and routed workflow pages.
2. **Engine / domain layer** — pure typed functions: feature extraction, recommendation, trial economics, outcome summarization.
3. **Integration layer** — server-side fetchers for USDA NRCS Soil Data Access (SSURGO) and the National Weather Service.

A persistent `localStorage`-backed workspace store glues them together on the client.

---

## Route structure

```
/                                            premium landing
/method                                      data sources, model interface, honesty rail
/workspace                                   workspace dashboard (all fields)
/workspace/field/[id]                        → redirect to /setup
/workspace/field/[id]/setup                  field identity, location, economics
/workspace/field/[id]/intelligence           live USDA + NWS
/workspace/field/[id]/recommendation         decision console, drivers, confidence
/workspace/field/[id]/review                 agronomist review surface
/workspace/field/[id]/trial                  trial planner + CSV export
/workspace/field/[id]/outcome                harvest entry + verdict
/api/soil?lat&lon                            USDA SDA SSURGO normalized profile
/api/weather?lat&lon                         NWS 7-day forecast + near-term loss risk
/api/geocode?q                               US Census oneline geocoder
```

All `workspace/field/[id]/*` pages share a `WorkspaceShell` layout that
provides the sidebar workflow rail, sticky field-context header, and live
data-freshness badges.

---

## Field state model

```
WorkspaceState
  ├── fields: Record<id, FieldState>
  ├── order: string[]
  └── activeId: string

FieldState
  ├── inputs:  FieldInputs          // identity, location, economics, agronomy
  ├── soil:    SoilProfile?         // live USDA SSURGO normalized profile
  ├── weather: WeatherProfile?      // live NWS 7-day outlook
  ├── review:  AgronomistReview?
  ├── trial:   Partial<TrialPlan>?
  ├── outcome: Partial<OutcomeData>?
  └── updatedAt: ISO timestamp
```

`store.ts` exposes a vanilla `useSyncExternalStore` interface plus a
`workspaceActions` object for mutations. Mutations are persisted to
`localStorage` on every write and synced across tabs via the `storage` event.

Hooks consumed by pages:

- `useFieldState(id)` — get a field
- `useFieldList()` — list all fields (ordered)
- `useSoilFetcher(id)` / `useWeatherFetcher(id)` — explicit refetch
- `useEnsureIntelligence(id)` — lazily fetches missing soil/weather on mount

---

## API routes

| Route             | Runtime | Purpose                                           |
| ----------------- | ------- | ------------------------------------------------- |
| `/api/soil`       | Node    | Calls USDA SDA T-SQL endpoint, returns `SoilProfile` |
| `/api/weather`    | Node    | Calls `api.weather.gov` /points → /forecast, returns `WeatherProfile` |
| `/api/geocode`    | Node    | US Census oneline address → `{lat, lon, county, state}` |

All three are `dynamic = "force-dynamic"` and `cache: "no-store"`. Failures
return a clearly-labelled fallback (`source: "fallback"`) rather than HTTP
errors — this keeps the UI graceful when an upstream is briefly unavailable.

---

## USDA SSURGO flow

```
client (Intelligence page)
  └─ GET /api/soil?lat&lon
        └─ src/lib/integrations/ssurgo.ts
              ├─ build T-SQL with 0.0005° bounding-box polygon
              ├─ POST to sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest
              ├─ normalize → SoilProfile
              └─ on failure or no-match → fallbackProfile()
```

The query uses 4 CTEs:

1. `dominant` — pick the dominant non-water major component at the polygon.
2. `top_horizon` — surface chorizon row (≤15 cm depth) for ksat.
3. `top_texture` — surface texture class from `chtexturegrp` / `chtexture`.
4. `om_w` — depth-weighted average of organic matter across the 0-30 cm chorizon.

The result is normalized into a typed `SoilProfile` (texture class, drainage
class, hydrologic group, OM %, AWS 0-150 cm, ksat, taxonomy).

---

## NWS weather flow

```
client (Intelligence page)
  └─ GET /api/weather?lat&lon
        └─ src/lib/integrations/nws.ts
              ├─ GET https://api.weather.gov/points/{lat},{lon}  → forecast URL
              ├─ GET that forecast URL
              ├─ pair day/night periods into a 7-day daily series
              ├─ compute near.nextRainProbPct, near.next7DayPrecipInches
              └─ on failure → fallbackWeather()
```

NWS docs: <https://www.weather.gov/documentation/services-web-api>.

---

## Recommendation engine

```
extractFeatures(inputs, soil, weather)
  └─ DecisionFeatures       (typed feature vector)
            │
            ▼
recommendationModel.recommend(features, inputs)
  └─ Recommendation
        ├─ baseMrtnRate              (state-level reference)
        ├─ recommendedRate           (base + sum of factor deltas)
        ├─ factors[]                 (named, signed, categorized)
        ├─ perAcreCostDelta, totalCostDelta
        ├─ expectedYield, yieldRange
        ├─ confidence, confidenceScore, riskFlags
        └─ explainer
```

### Feature vector

`DecisionFeatures` is the single ML-ready contract:

| Group     | Field                              | Source                          |
| --------- | ---------------------------------- | ------------------------------- |
| inputs    | `acres`, `previousCrop`, `residualN`, `currentNRate`, `cornPrice`, `nitrogenPrice`, `priceRatio`, `targetYield` | User |
| soil      | `textureClass`, `drainageClass`, `hydrologicGroup`, `organicMatterPct`, `availableWaterStorageCm`, `leachingPotential01`, `denitPotential01` | USDA SSURGO |
| weather   | `nextRainProbPct`, `next7DayPrecipInches`, `weatherLossRisk01` | NWS |
| composite | `baseMrtnRate`                     | State lookup                     |

Derived 0..1 risk signals (`leachingPotential01`, `denitPotential01`,
`weatherLossRisk01`) are linear blends with named weights, all defined in
`src/lib/engine/features.ts`. They are exposed to the UI on the Intelligence
page as risk bars and shape the recommendation deltas.

### Factor categories

- **agronomy** — previous crop credit/penalty, residual N
- **soil** — organic matter mineralization, loss-risk profile
- **weather** — near-term forecast loss risk
- **economics** — N : corn price ratio

The factors carry a `category` so the recommendation page can color-code the
driver waterfall.

### Confidence score

```
score = 0.85
score -= 0.20 if rate is far (>35 lb) from regional reference
score -= 0.12 if weather loss risk ≥ 0.55
score -= 0.08 if leaching potential ≥ 0.70
score -= 0.10 if acres < 40   (small field — noisier outcomes)
score += 0.05 if soybeans previous crop and weather loss risk < 0.30
score clamped to [0.10, 0.98]
```

Categorical: `score ≥ 0.78 → high`, `≥ 0.55 → moderate`, else `low`.

---

## Trial / outcome layer

`src/lib/engine/trial.ts` exposes:

- `defaultTrialPlan(inputs, rec, reviewRate)` — seeds the planner.
- `trialEconomics(trial, n$, corn$, yieldDelta?)` — pre-trial economics.
- `summarizeOutcome(args)` — post-trial verdict (`validated | inconclusive | needs_more_data`) with named thresholds:
    - `marginDelta > 8 * acres && yieldDelta > -2 → validated`
    - `yieldDelta < -4 → needs_more_data`
    - else `inconclusive`

---

## ML-ready interface

```ts
export interface RecommendationModel {
  readonly name: string;
  readonly version: string;
  readonly modelClass: "heuristic" | "statistical" | "ml";
  recommend(features: DecisionFeatures, inputs: FieldInputs): Recommendation;
}

export const recommendationModel: RecommendationModel = new HeuristicModel();
```

To swap in a trained model in the next pass:

1. Implement `RecommendationModel` (most likely as a wrapper around
   `onnxruntime-web` or a small Bayesian regression run server-side).
2. Use the existing `DecisionFeatures` vector — it is the contract.
3. Replace the exported `recommendationModel` singleton.
4. Optionally pre-compute features in a Next API route so the predictor runs
   server-side.

Nothing in the UI or store needs to change.

### Likely next ML inputs

The current heuristic only uses the obvious soil + weather features. A trained
predictor would benefit from:

- multi-horizon soil texture / OM gradient,
- 30-year normal vs current-year precip anomaly,
- elevation / slope / aspect (USGS 3DEP),
- crop residue cover (NDVI / NDTI from Sentinel-2 or Landsat),
- planting-date weather windows,
- residual N test value (continuous, not categorical).

### Suggested model class

A gradient-boosted regression on a target of *site-year yield response curve
optimum N*, trained from a corpus of regional trial data, would slot in
directly. The interface returns a single `recommendedRate`; we'd add a
quantile predictor for the confidence interval to feed `yieldRange` and
`confidenceScore`.

---

## File map

```
src/
  app/
    layout.tsx, globals.css, page.tsx                # landing
    method/page.tsx                                  # method
    workspace/page.tsx                               # workspace dashboard
    workspace/field/[id]/layout.tsx                  # workspace shell wrapper
    workspace/field/[id]/page.tsx                    # redirect → /setup
    workspace/field/[id]/{setup,intelligence,...}/page.tsx
    api/{soil,weather,geocode}/route.ts              # server-side fetchers
  components/
    ui/{Logo,Badge,Stat,Panel,FieldInput,MiniMap}.tsx
    shell/WorkspaceShell.tsx                         # sidebar + field header
  lib/
    types.ts                                         # all domain types
    demo-data.ts                                     # flagship + alt fields
    format.ts                                        # number / unit formatting
    store.ts                                         # workspace store + fetch hooks
    engine/features.ts                               # feature extraction
    engine/model.ts                                  # RecommendationModel + heuristic
    engine/trial.ts                                  # trial economics + outcome summary
    integrations/ssurgo.ts                           # USDA SDA fetch + normalize
    integrations/nws.ts                              # NWS fetch + normalize
    integrations/geocode.ts                          # US Census oneline geocoder
```

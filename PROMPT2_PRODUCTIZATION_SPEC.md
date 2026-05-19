/goal Rebuild the current SoilProve app into a competition-winning, product-grade agronomic decision platform for the Cape Girardeau Vibeathon. This is a major second-pass transformation, not a light polish pass. Work autonomously for as long as needed. Make strong product, UX, and engineering decisions without asking for clarification unless absolutely blocked.

# Core Strategic Direction

The current app successfully communicates the SoilProve concept, but it still feels like a long hackathon explainer page rather than a real software product. Transform it into a world-class, multi-page precision agriculture workflow that feels credible, beautiful, live-data-powered, and ready to demo as a serious product.

SoilProve should feel like:
- a real field intelligence workspace,
- powered by real public soil and weather data,
- generating a defensible nitrogen decision from that live context,
- reviewable by an agronomist,
- and operational enough that a judge believes farmers could actually use it.

This pass is NOT primarily about training a full machine learning model. That will be a separate later pass. This pass should create:
1. a much more real product,
2. a much more credible live-data recommendation engine,
3. a clean ML-ready architecture,
4. and a truly excellent product UX.

# First Actions

Before coding:
1. Read `SOILPROVE_BUILD_BRIEF.md`.
2. Read `CLAUDE.md`.
3. Read the challenge/source artifacts in `sourcedocs/`.
4. Audit the existing codebase and understand what should be retained, refactored, or removed.
5. Synthesize a concise internal plan, then execute it.

Do not preserve weak parts of the current implementation just because they already exist. Keep what is useful; rebuild what needs to be rebuilt.

# Non-Negotiable Product Shift: Remove the Long Scroll Site

The current single scrolling experience is not the final product.

Refactor SoilProve into a proper route-based web application with a coherent app shell, separate workflow pages, and premium SaaS-level navigation.

Use Next.js App Router route architecture or an equivalent clean structure.

A strong target route structure would be:

- `/` — premium landing / product entry
- `/workspace` — farm / field workspace dashboard
- `/workspace/field/[id]/setup` — field/location/economic setup
- `/workspace/field/[id]/intelligence` — live soil + weather field intelligence
- `/workspace/field/[id]/recommendation` — nitrogen recommendation and drivers
- `/workspace/field/[id]/review` — agronomist review and signoff
- `/workspace/field/[id]/trial` — trial planning
- `/workspace/field/[id]/outcome` — results / ROI / next-year decision
- `/method` — concise methods and data sources page

You may improve this route structure if you find a better one, but the final result must feel like a serious product with page-level workflow, not a storytelling scroll page.

# UX / Visual Design Bar

Make this look and feel dramatically more sophisticated.

Target:
- world-class agritech SaaS,
- Stripe/Linear-level compositional polish translated into agriculture,
- premium but grounded,
- visually confident,
- sparse where appropriate,
- highly readable,
- data-rich without feeling cluttered.

Design expectations:
- refined typography hierarchy,
- strong grid system,
- beautifully spaced cards and panels,
- sophisticated left nav or workflow rail,
- excellent top-level dashboard composition,
- clean charts and comparisons,
- elegant risk/confidence displays,
- polished maps/location components,
- crisp badges and state indicators,
- tasteful motion/transitions where they materially improve the feel,
- restrained earthy/soil-inspired palette with modern neutrals,
- no generic template dashboard look.

The current product has too much text and too much “narrated demo” energy. Reduce visible UI copy substantially. Aim to cut primary interface prose by at least 50% while improving clarity.

The application should communicate through:
- information hierarchy,
- metrics,
- visual comparison,
- precise labels,
- and small excellent pieces of copy,
not long explanatory text blocks.

# Remove Disclaimer Bloat from the Main Experience

The current app over-explains “modeled,” “demo,” “prototype,” and “simulated” inside the core workflow. Remove that clutter from the primary product experience.

The user-facing workflow should feel clean, confident, and real.

However:
- Do not fabricate unsupported technical claims.
- Do not invent customer proof or fake scientific validation.
- Keep data provenance and method detail available in tasteful places:
  - a `/method` page,
  - compact “How this works” drawers,
  - info tooltips,
  - README documentation.
- The core interface should not repeatedly apologize for itself.

# Live Real Data Integrations — Must Implement and Must Matter

This is the most important credibility upgrade.

Integrate real public data sources directly into the SoilProve workflow, and ensure that those values materially affect the recommendation/risk layer. Do not merely fetch live data and display it decoratively.

## 1. Real Field Location / Geospatial Setup

Build a much stronger field setup page.

Required:
- user can select or edit a real location,
- support latitude/longitude directly,
- include a polished visual map or location panel if feasible,
- maintain acreage and agronomic inputs,
- persist the active field state across pages,
- seed the app with a compelling default field that works immediately for demo purposes.

If full polygon drawing is too much for this pass, use a coordinate/pin-based field location plus acreage. It must still feel location-aware and real.

## 2. Live USDA NRCS Soil Data Access / SSURGO Integration

Implement a server-side integration using official USDA NRCS Soil Data Access / SSURGO data for the selected field location.

Use the selected location to retrieve real soil information where available, such as:
- dominant map unit or soil series context,
- component or map unit name,
- soil texture / class where feasible,
- drainage class or hydrologic group where feasible,
- organic matter / water availability / available representative soil property where feasible.

Do not overcomplicate the query if a smaller reliable subset is more robust. Prioritize stable live results over a fragile maximal query.

Use this live soil data in the product in three ways:
1. Display it elegantly on the Field Intelligence page.
2. Feed relevant fields into the recommendation / risk engine.
3. Explain recommendation drivers in a concise visual way.

Implement:
- clean API route/server action boundaries,
- typed response normalization,
- loading states,
- API failure state,
- fallback behavior if USDA data is temporarily unavailable.

The app should not crash or degrade into nonsense if a live fetch fails.

## 3. Live National Weather Service API Integration

Implement a live National Weather Service weather integration for the selected field coordinates.

Use official weather data to provide useful current decision context. Where practical, retrieve:
- forecast information,
- temperature/precipitation context,
- near-term rain/storm risk if available through the API path used,
- field weather risk signal.

Use this weather context in the product in three ways:
1. Display it elegantly on the Field Intelligence page.
2. Feed it into recommendation confidence/risk.
3. Influence concise recommendation explanation, especially around nitrogen loss/timing risk.

Again:
- use clean server-side fetch logic,
- normalize the response,
- handle API failures,
- provide a polished loading/error state.

## 4. Optional Geocoding / Convenience Layer

If useful and low-risk, add a convenience layer for entering county/city/location labels that resolve to coordinates. Do this only if it improves the UX and does not create fragility.

Location selection must remain robust even without a third-party geocoder.

# Recommendation Engine Upgrade — Real Data Driven, Not ML Yet

The current recommendation logic is too toy-like. Replace it with a more serious, production-minded recommendation architecture that uses the newly integrated live data.

This pass should create a robust, explainable recommendation system that is:

- live-data-informed,
- economically grounded,
- agronomically reasoned,
- cleanly modular,
- and ready for a real ML model in Prompt 3.

## Inputs the Recommendation Layer Should Use

At minimum, the recommendation / risk engine should consider:

User-provided:
- acreage,
- crop rotation / previous crop,
- baseline/current N rate,
- nitrogen price,
- corn price,
- residual N or soil-N indicator if provided,
- optional planting/timing or management assumptions if useful.

Live-data-derived:
- USDA soil attributes retrieved for the field,
- NWS weather / rain-risk / forecast context,
- any normalized field intelligence features that are robustly available.

## Required Architecture

Create a clean domain layer with explicit separation of:

- field inputs,
- live soil data normalization,
- live weather data normalization,
- extracted decision features,
- recommendation calculation,
- recommendation confidence/risk scoring,
- economics/ROI calculations,
- explanation driver generation,
- scenario comparison.

Avoid putting recommendation logic directly inside UI components.

## Model-Ready Requirement for Prompt 3

Design this system so that a true ML model can be integrated cleanly in the next development pass.

Specifically:
- define a typed feature vector for nitrogen decision modeling,
- define a clear `RecommendationModel` or equivalent service interface,
- separate baseline agronomic heuristics from future predictive modeling,
- centralize feature extraction,
- document the likely future ML inputs,
- document how a trained model would slot into the existing architecture.

The goal of this pass is to make the system **ML-ready**, not to burn hours chasing a training dataset or faking a model.

If a genuinely useful lightweight statistical confidence/risk calculation is straightforward and defensible, include it. But do not spend the bulk of this run trying to train a full ML model. That is intentionally reserved for the next prompt.

# Product Experience to Build

## A. Landing Page `/`

Create a significantly better landing page than the current top-of-scroll hero.

It should be:
- visually striking,
- concise,
- product-like,
- and immediately route users into the workspace/demo.

It should present SoilProve as:
“Field-specific nitrogen decisions, grounded in live field intelligence.”

Keep it very tight. No hackathon essay. No large disclaimer text.

Include a strong CTA such as:
- “Open Field Workspace”
- “Analyze Demo Field”

## B. Workspace Dashboard `/workspace`

Build a real dashboard home that makes the product feel persistent and usable.

Show:
- one flagship demo field and optionally room for additional fields,
- recommendation status,
- live data freshness / soil/weather availability,
- agronomist review status,
- projected economic impact,
- current risk state,
- CTA into field workflow.

This page should make a judge think, “This is a product, not a one-off calculator.”

## C. Field Setup Page `/workspace/field/[id]/setup`

Build a polished setup/input page with:
- editable field name,
- acreage,
- location coordinates / map panel,
- county/state presentation if available,
- crop rotation,
- baseline/current N rate,
- economic inputs,
- residual N/management indicators if useful,
- fetch/refresh live field intelligence CTA.

This should feel like the clean place where a user configures a real field.

## D. Field Intelligence Page `/workspace/field/[id]/intelligence`

This should be one of the strongest pages in the app.

Show real live external data in a world-class layout:
- location/map visual,
- USDA soil profile card,
- current soil-context attributes,
- NWS weather panel,
- precipitation/rain-loss or timing-risk signal,
- data freshness/status,
- “decision inputs flowing into SoilProve” composition.

This page should make it undeniable that SoilProve is not just a static toy.

## E. Recommendation Page `/workspace/field/[id]/recommendation`

This is the hero product page.

Build a premium decision console showing:
- current baseline N plan,
- SoilProve recommended plan,
- delta in lbs N/acre,
- total economic impact,
- cost difference per acre and whole-field,
- confidence or risk score,
- recommendation status,
- high-quality visual driver breakdown,
- concise explanation of the major factors that moved the recommendation,
- scenario toggles if feasible.

The recommendation should visibly respond to real soil/weather context already fetched.

Use strong but restrained UX:
- driver bars,
- waterfall-style contribution visualization if appropriate,
- confidence/risk card,
- economic outcome cards,
- excellent density control.

No wall-of-text explanations.

## F. Agronomist Review Page `/workspace/field/[id]/review`

Turn this into a credible collaboration workflow:
- recommendation summary,
- agronomist adjustment control,
- agronomist note,
- status: pending / reviewed / approved / adjusted,
- side-by-side comparison of original recommendation vs adjusted review rate,
- clear signoff action.

It should feel like a serious review surface, not a toy slider card.

## G. Trial Planner Page `/workspace/field/[id]/trial`

Upgrade the trial planner into a stronger real-use feature:
- create a low-risk trial/control comparison,
- choose trial acreage or split,
- compare nitrogen rates and expected cost difference,
- define evaluation metrics,
- generate a polished trial summary,
- keep CSV/export if already implemented,
- optionally create a simple visual representation of control vs trial strips if achievable.

Make this page feel like SoilProve reduces adoption risk in a practical way.

## H. Outcome Page `/workspace/field/[id]/outcome`

Upgrade the outcome tracking page:
- user enters or adjusts trial/control yields,
- show total ROI,
- fertilizer savings,
- yield difference,
- margin impact,
- nitrogen efficiency or related comparison,
- recommendation validated / inconclusive / revise-next-year state,
- clear next-year action recommendation,
- export or summary if already supported.

This page should complete the loop cleanly.

## I. Method Page `/method`

Create a concise, elegant page that explains:
- data sources used,
- what comes live from USDA/NWS,
- how the recommendation engine is structured,
- what “confidence/risk” means,
- what assumptions remain user-driven,
- how future ML would extend the system.

This is where detail belongs, not in the core product flow.

# Data Persistence

Add practical persistence so the app feels like software rather than a reset-on-refresh demo.

Required:
- active field state should persist across route changes,
- edits should not disappear during workflow navigation,
- page refresh should retain the flagship demo field and user edits if feasible.

Local persistence is acceptable. Do not add auth or backend account complexity unless it is extremely trivial and clearly beneficial.

# App Shell and Navigation

Create a polished reusable shell for the workspace pages:
- left nav or workflow rail,
- field context header,
- progress through setup → intelligence → recommendation → review → trial → outcome,
- easy jump among pages,
- live status indicators where useful.

This should feel like a cohesive product system.

# Code Quality and Architecture

Refactor cleanly. The codebase should look intentionally designed, not accumulated.

Expected:
- modular folders,
- typed domain models,
- clean API layer,
- typed feature/recommendation models,
- reusable UI primitives,
- reusable product-level cards/components,
- centralized constants/config,
- proper loading/error states,
- robust environment variable handling,
- no dead components,
- no abandoned code,
- no huge tangled page files if avoidable.

Use official API docs as needed to implement USDA and NWS integrations correctly.

# What NOT To Do

Do not:
- train a full ML model in this pass,
- create fake ML branding,
- spend hours chasing a dataset,
- add authentication,
- add payments,
- add giant company/admin features,
- add a chatbot as the main product,
- preserve the current scroll structure,
- leave disclaimer-heavy UI clutter in place,
- add superficial API fetches that do not shape the recommendation workflow.

# Required Deliverables

By the end of this goal run, the repo should contain:

1. A rebuilt multi-page SoilProve product.
2. A premium landing page.
3. A real workspace dashboard.
4. Proper field workflow pages.
5. Live USDA NRCS soil data integration in the actual product flow.
6. Live NWS weather integration in the actual product flow.
7. A materially upgraded recommendation engine that uses live soil/weather inputs.
8. A clean ML-ready architecture for future modeling.
9. Polished state persistence across pages.
10. Refactored world-class UX/design system.
11. Updated README.md.
12. Updated `.env.example` if any configuration is needed.
13. `ARCHITECTURE.md` documenting:
    - route structure,
    - data flow,
    - live API architecture,
    - recommendation engine architecture,
    - model-ready feature vector / future ML integration path.
14. `DEMO_SCRIPT.md` optimized for a 5-minute competition demo.
15. Passing build and lint.

# README Requirements

Update README.md to include:
- what SoilProve is,
- the problem it solves,
- how the multi-page workflow works,
- which data sources are live,
- how USDA soil and NWS weather influence the recommendation,
- recommendation engine overview,
- local run instructions,
- environment variables if any,
- deployment notes,
- short “how to demo this in 5 minutes” section,
- note that the architecture is prepared for a stronger ML layer in a future pass.

# ARCHITECTURE.md Requirements

Create a serious but concise architecture document describing:
- frontend route structure,
- shared workspace/app shell,
- field state model,
- API routes/server actions,
- USDA soil integration flow,
- NWS weather integration flow,
- normalized feature layer,
- recommendation engine logic,
- risk/confidence logic,
- economics layer,
- model interface / feature vector for future ML integration,
- next-step ML expansion plan.

# DEMO_SCRIPT.md Requirements

Create a competition-optimized 5-minute demo script with:
- opening hook,
- problem framing,
- product walkthrough sequence,
- exact order of pages to show,
- what to emphasize on live soil/weather data,
- what to emphasize on recommendation credibility,
- what to emphasize on agronomist review and trial planning,
- tight closing vision,
- optional fallback script if a live API is slow during demo.

# Verification Before Stopping

Before stopping, explicitly surface proof in the transcript that:

- `npm install` succeeds if needed,
- `npm run build` exits successfully,
- `npm run lint` exits successfully or lint is cleanly configured and passing,
- the USDA soil fetch path exists and is wired into a visible page,
- the NWS weather fetch path exists and is wired into a visible page,
- soil/weather-derived values influence recommendation/risk logic,
- the main product is now route-based rather than a long scroll page,
- README.md exists and is updated,
- ARCHITECTURE.md exists,
- DEMO_SCRIPT.md exists,
- no obvious TypeScript errors remain.

# Strategic Standard

This should not merely be “better than the first version.”

It should make a judge think:
“This is not just a vibe-coded mockup. This is a real, well-designed agronomic decision product with live field intelligence and a credible path to advanced modeling.”

If tradeoffs arise, prioritize in this order:

1. Product credibility
2. Live real-data integrations
3. World-class UX and multi-page workflow
4. Recommendation engine quality
5. Clean ML-ready architecture
6. Extra niceties

Do not stop after cosmetic improvements. Make it feel real.





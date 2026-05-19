# SoilProve — Vibeathon prototype

> Prove what your soil data is worth.

SoilProve is a nitrogen **decision-confidence** product for corn farmers and the agronomists who advise them. This repo is a polished hackathon prototype built for the Cape Girardeau Vibeathon SoilProve challenge.

It is intentionally *not* a fertilizer calculator. The product story it demonstrates is:

> *"Lowering or adjusting nitrogen does not feel like reckless guesswork. I understand the logic, my agronomist can validate it, and I can trial it safely."*

---

## What this prototype is

A single-page Next.js + TypeScript + Tailwind app that implements the full SoilProve **sacred demo flow** end-to-end:

1. **Field intake** — a farmer picks one of three seeded scenarios or edits inputs (field, county, acres, previous crop, current N rate, corn/N prices, residual N, weather, soil type).
2. **Recommendation comparison** — the current flat plan vs a deterministic, MRTN-style recommendation. Includes a per-factor "Why this recommendation changed" panel so nothing is a black box.
3. **Peer evidence** — a clearly **modeled** cohort summary with similar-scenario count, average reduction, modeled margin effect, yield range, and a confidence badge.
4. **Agronomist review** — a stamped review state with reviewer credentials, rationale, approve / approve-with-adjusted-rate / request-revision actions. The reviewer-approved rate flows downstream.
5. **Safe trial planner** — pick one comfortable subsection, side-by-side trial-strip vs control-strip, success metrics, and a CSV export of the signed trial plan.
6. **Outcome & ROI dashboard** — type harvest numbers (or use seeded post-season values) and see fertilizer savings, yield delta, net margin impact, and a Validated / Inconclusive / Needs review verdict.

The demo loop closes: **recommendation → validation → trial → result.**

---

## Run it locally

Requires Node 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint, configured via next/core-web-vitals
```

The build is fully static — no backend, no database, no auth. State lives in the page so that judges can play with every input and watch numbers update in real time.

---

## Recommendation model — assumptions

The recommendation engine in `src/lib/recommend.ts` is a **deterministic, rules-based demo model inspired by the MRTN methodology**. It is not a production agronomic engine.

Starting from a regional reference rate of **165 lb N / ac** (corn-after-soybeans), it applies transparent additive adjustments:

| Factor | Range of adjustment |
| --- | --- |
| Previous crop (soybeans / corn / small grain / alfalfa) | −30 to +35 lb N / ac |
| Residual soil N indicator (low / typical / elevated) | −22 to +12 lb N / ac |
| Seasonal scenario (normal / wet / dry / cool-late) | −8 to +14 lb N / ac |
| N-to-corn price ratio | −8 to +6 lb N / ac (only shown when material) |

Final rate is clamped to 100–260 lb N / ac. Modeled yield is a simple parabola around the recommended rate, plus small offsets for rotation and weather. Confidence is rule-based on whether inputs match the regional reference scenario, field size, and how far the recommendation has moved from MRTN.

Every adjustment is surfaced in the **"Why this recommendation differs"** panel. The number is never delivered without the math.

---

## What's real vs simulated

We do not dress synthetic numbers up as real customer outcomes — that would undercut SoilProve's trust thesis.

**Real in this build**
- The recommendation engine with visible, editable per-factor adjustments
- The agronomist review state machine (approve / adjust / request revision) and its downstream effect on the trial planner and outcome verdict
- The trial planner with CSV export
- The outcome verdict logic against the trial
- Brand voice, copy, visual identity, and product framing

**Modeled / demo only**
- The peer cohort panel — labeled "modeled" everywhere. Scenario counts, average reductions, modeled margin effect, and yield range are computed from the recommendation, not from real farmers.
- The illustrative cohort labels (Mark · Story County; Caspian · Boone County) come from the SoilProve elevator-pitch materials in `source_docs/` and are presented as **modeled peer** examples, not real users.
- Residual N indicator, seasonal scenario, and county / soil type are inputs the farmer picks for the demo — they aren't pulled from soil tests or weather APIs.
- The post-season yield numbers are seeded so the outcome dashboard has something to show. Edit them and the verdict updates.

A dedicated **"What's real vs simulated"** section is rendered at the bottom of the app for judges and farmers alike.

---

## Demo script (≈ 4 minutes)

A judge or hackathon viewer should be able to follow this without prep.

**1. Open the app (~10s).** Land on the hero. Read the headline: *"Nitrogen decisions farmers understand, agronomists review, and outcomes validate."* Note the live snapshot card showing the current rate, SoilProve rate, and modeled savings for the seeded `North 80 — Holcomb` field. Mention the tagline: *Prove what your soil data is worth.*

**2. Field intake (~30s).** Click between the three seeded scenarios in the top right (`North 80 — Holcomb`, `South Pivot — Linn 12`, `River Bottoms — Champaign 4`). Each loads a different rotation, residual N, and weather. Edit the corn price or nitrogen price live — the downstream numbers update instantly.

**3. Recommendation (~45s).** Show the three plan cards (Current / SoilProve / Agronomist-adjusted), the per-acre and total savings, and the modeled yield range. Then walk the **"Why this recommendation differs"** ladder on the right: MRTN reference → soybean credit → residual N → weather → price ratio → result. Emphasize: *no number without the math.*

**4. Peer evidence (~30s).** Show the modeled cohort numbers and the confidence badge. Point at the labeled "Modeled — demo data" pill. Show the two modeled peer narratives (Mark, Caspian) and explicitly call out: *these are illustrative, not real users.*

**5. Agronomist review (~45s).** Drag the "Conservative adjustment" slider up a notch. Click **Approve with adjusted rate**. Watch the stamp appear, the downstream `effectiveRate` change, and the trial planner pick it up automatically.

**6. Trial planner (~30s).** Show the trial-strip slider, the per-rate spend, the modeled fertilizer savings card. Click **Download trial plan (CSV)** so a judge sees a real CSV land in their downloads folder.

**7. Outcome & ROI (~45s).** Show the verdict ("Validated" / "Inconclusive" / "Needs review") based on the seeded yield numbers. Drop the trial yield by 5 bu — verdict flips to *Needs review*. Bump it back up — verdict goes green. Read the "what this means next year" guidance.

**8. Close (~15s).** Scroll to *What's real vs simulated*. Call out that the prototype is honest about its limits. End on the tagline.

---

## File map

```
src/
├── app/
│   ├── layout.tsx           # Fonts (Inter + Poppins via next/font) and metadata
│   ├── page.tsx             # Single-page orchestrator with state & demo flow
│   └── globals.css          # Tailwind base + brand utility classes
├── components/
│   ├── Topbar.tsx           # Sticky nav with step navigation
│   ├── Hero.tsx             # Landing hero + live snapshot card
│   ├── IntakePanel.tsx      # Field intake form + scenario chips
│   ├── RecommendationPanel.tsx
│   ├── PeerEvidencePanel.tsx
│   ├── AgronomistPanel.tsx
│   ├── TrialPlannerPanel.tsx
│   ├── OutcomePanel.tsx
│   ├── FlowFooter.tsx       # Per-section back / continue navigation
│   ├── HonestyFooter.tsx    # What's real vs simulated
│   ├── Badge.tsx            # Pills + demo-data label
│   ├── Stat.tsx             # Reusable stat block
│   └── Logo.tsx
└── lib/
    ├── recommend.ts         # Deterministic recommendation engine + cohort + trial + outcome
    ├── demo-data.ts         # Seeded fields, option lists
    ├── format.ts            # Number / currency / bu formatters
    └── types.ts             # Shared types
```

---

## What we deliberately did not build

To respect the brief and keep the demo crisp, this build does not include:

- Authentication, user accounts, or payment flows
- Onboarding wizards or multi-step forms beyond the demo intake
- A general farm-management suite
- Real John Deere / Climate FieldView / OEM integrations
- Real agronomic API integrations or weather pulls
- A chat assistant as the primary interface
- Anything outside the sacred demo flow

The goal of this repo is a **finished vertical slice** that makes the SoilProve thesis tangible in five minutes.

---

## Credits

- Product thesis, brand voice, and copy direction: SoilProve overview, branding guide, and elevator pitch in `source_docs/` (Cape Girardeau Vibeathon materials)
- Recommendation methodology framing: Midwest Nitrogen Rate Trial (MRTN) — used here as a reference frame for a deterministic demo model, not as a production calculator

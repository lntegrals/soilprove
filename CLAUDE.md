# SoilProve — Hackathon Build Brief

## Mission

Build a polished, judge-ready hackathon prototype for the Cape Girardeau Vibeathon SoilProve challenge.

SoilProve is NOT merely a fertilizer calculator.

It is a nitrogen decision-confidence product for farmers and agronomists:
- explain a field-specific nitrogen recommendation,
- show why it differs from the farmer's current plan,
- provide prototype peer-evidence context,
- allow agronomist review/signoff,
- generate a safe trial plan,
- show post-season ROI/outcome proof.

The product should make a farmer feel:
"Lowering or adjusting nitrogen does not feel like reckless guesswork. I understand the logic, my agronomist can validate it, and I can trial it safely."

---

## Core Product Thesis

The problem is not just nitrogen waste.
The deeper problem is that farmers fear yield loss more than they value theoretical savings.

SoilProve should solve:
1. Recommendation clarity
2. Trust / evidence
3. Human agronomist review
4. Low-risk trial adoption
5. Outcome tracking

---

## Sacred Demo Flow

The product must make this flow work end-to-end:

### 1. Farmer Intake
A user selects or enters:
- field name
- location / county
- acreage
- previous crop
- current planned N rate
- corn price
- nitrogen price
- soil / residual N indicator
- weather or seasonal scenario

Use polished defaults so the demo starts instantly.

### 2. Recommendation Comparison
Show:
- Current flat nitrogen plan
- SoilProve recommended plan
- Estimated change in N/acre
- Estimated input cost difference
- Estimated gross savings across the field
- Explanation panel: "Why this recommendation changed"

The logic may be a deterministic rules-based demo model, not a scientific production model. Make that clear.

### 3. Peer Evidence Panel
Show a "comparable field evidence" module:
- similar scenario count
- average N reduction
- average modeled margin effect
- yield outcome range
- confidence badge

This must be labeled as prototype/demo evidence or modeled evidence.
Do NOT present synthetic proof as real customer validation.

### 4. Agronomist Review Mode
Create a review state in which an agronomist can:
- approve recommendation,
- request a more conservative rate,
- add a rationale note,
- stamp a "Reviewed" status.

This should feel like the product is augmenting agronomists, not replacing them.

### 5. Safe Trial Planner
Generate a low-risk pilot plan:
- choose one field / subsection to test
- compare current rate vs SoilProve rate
- define success metrics:
  - fertilizer spend
  - yield delta
  - net margin
- output a clean trial summary card and downloadable report/CSV if feasible

### 6. Outcome / ROI Dashboard
Show a post-season result state:
- baseline nitrogen spend
- actual nitrogen spend
- simulated/entered yield result
- net margin change
- "Validated / inconclusive" label
- simple visual comparison

This closes the loop:
recommendation → validation → test → result.

---

## Product Positioning

Use this positioning in the interface and copy:

### Core line
"Prove what your soil data is worth."

### Supporting line
"Field-specific nitrogen decisions farmers can understand, agronomists can review, and outcomes can validate."

Tone:
- grounded
- plainspoken
- credible
- no startup nonsense
- no fake scientific certainty
- no overclaiming

---

## What NOT to Build

Do not build:
- authentication
- payment flow
- complex onboarding
- full farm management suite
- real OEM / John Deere integrations
- real agronomic API integrations unless trivial and non-blocking
- a chat assistant as the primary experience
- feature bloat outside the sacred demo flow

---

## Technical Product Requirements

Use a polished modern web stack suitable for a hackathon demo:
- Next.js
- TypeScript
- Tailwind
- high-quality component structure
- responsive desktop-first dashboard design

Strongly prefer:
- visually coherent dashboards/cards
- clean state management
- demo data that is editable
- deterministic recommendation calculation
- clear empty/error states where appropriate

---

## Recommended App Structure

Suggested pages/views:
1. Landing / product overview
2. Main dashboard / active field
3. Recommendation detail
4. Agronomist review
5. Trial planner
6. Outcome dashboard

A single app with smooth tabs or sidebar navigation is acceptable and may demo better than many routes.

---

## Data Integrity Rules

Any simulated data must be labeled honestly:
- "prototype cohort"
- "modeled evidence"
- "demo scenario"
- "illustrative post-season result"

Never imply:
- actual farmer customer results
- scientifically validated ROI claims
- live production agronomy accuracy

---

## Judging Optimization

The product should feel:
- finished enough to demo immediately
- visually impressive
- strategically thoughtful
- domain-aware
- clearly tied to the challenge

It should be easy for a judge to understand in under 60 seconds.

---

## Required Deliverables in the Repo

Claude should produce:
- working app
- polished README.md
- seeded demo scenario
- explanation of recommendation model assumptions
- demo script / walkthrough in README
- honest "what is simulated" section
- commands to run locally
- build passes successfully

---

## Definition of Done

The implementation is complete when:
1. The app implements the full sacred demo flow end-to-end.
2. The UI is polished enough for a 5-minute competition video.
3. The business thesis is visible in the product itself.
4. No synthetic evidence is represented as real.
5. `npm install` succeeds.
6. `npm run build` succeeds.
7. `npm run lint` succeeds, or lint is configured and clean.
8. README.md explains:
   - what SoilProve is,
   - the demo flow,
   - what is real vs simulated,
   - how to run the project.

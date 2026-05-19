# SoilProve · 5-minute Demo Script

A tight competition walkthrough. Total time: ~5:00. Tone is grounded and
plainspoken — let the product carry the wow.

## Opening hook (0:00 – 0:25)

> *"Farmers in Cape Girardeau apply about 200 lb of nitrogen per acre on
> corn — but most of them already suspect they're over-applying. The reason
> they don't trim it isn't the math. It's fear of yield loss."*

> *"SoilProve is a nitrogen decision-confidence product. We take a field's
> real soil profile from USDA, its real forecast from the National Weather
> Service, and we turn that into a defensible nitrogen number — one the
> farmer can understand, the agronomist can review, and a real trial can
> validate."*

Open the landing page: `/`. Don't dwell — show the hero card, then click
**Open workspace**.

## Workspace dashboard (0:25 – 0:55)

> *"Each field carries its own live soil profile, weather, and projected
> savings. The flagship field here is North Bend in Cape Girardeau County."*

Point at:

- Three real fields. Each shows a recommended rate vs the farmer's plan, a
  whole-field $ delta, and a per-field confidence read.
- Total acres + projected savings rolled up at the top.

Click **Open flagship field** → it lands in the field workflow.

## Field Setup (0:55 – 1:30)

> *"This is where the field is identified — name, acreage, lat/lon, economics.
> The location is the most important thing: it's what we send to USDA and to
> the Weather Service."*

Demonstrate the geocode bar: type `Cape Girardeau, MO`, hit **Resolve** —
the coordinate and county auto-fill. Mini-map pin moves.

Show the side rail: setup is done, soil/weather are about to come live, review
is pending.

Click **Fetch field intelligence**.

## Field Intelligence (1:30 – 2:30) — the credibility moment

> *"This is live USDA SSURGO data — the actual soil map unit for the field.
> Menfro silt loam, well drained, hydrologic group C, 2.3% organic matter.
> Not a region-average. Not a guess. This is the polygon under the field."*

> *"And this is the National Weather Service — 7-day forecast for the exact
> coordinate. Today's near-term rain probability is 80%, with about 2.8
> inches of precip modeled over the week."*

Show the two risk bars:

> *"From those two data sources we derive leaching potential, denitrification
> potential, and a weather loss risk score. That's the bridge into the
> recommendation."*

Click **Generate recommendation**.

## Recommendation (2:30 – 3:30) — the hero page

> *"185 lb per acre — 15 below the farmer's plan, 10 above the Missouri MRTN
> reference. About $1,228 in nitrogen savings on this field."*

Point at the driver waterfall:

> *"You can see exactly why we moved off the regional reference. Organic
> matter mineralization trims us down. The wet near-term forecast pushes us
> back up. The N-to-corn price ratio shaves another six pounds. Nothing
> opaque."*

Point at the feature snapshot:

> *"And this is the typed feature vector — the contract for the engine.
> Today it feeds a transparent heuristic. Next iteration it feeds a trained
> yield-response model. The interface doesn't change."*

Confidence reads ~73% — moderate. Mention the small risk flag if visible.

## Agronomist Review (3:30 – 4:00)

> *"SoilProve generates the number. The agronomist owns the decision."*

Click **Approve with adjusted rate**. Slide it to ~190.

> *"They can approve straight, approve with an adjusted rate, or send it back
> with a note. The reviewed rate then flows into the trial planner."*

The sidebar badge flips from "Review pending" to "Approved · adjusted".

## Trial Planner (4:00 – 4:30)

> *"Before any rate scales, it gets trialed on a strip. 33 acres at the
> SoilProve rate, 33 acres at the farmer's normal rate, same field. Expected
> savings on the strip about $307."*

Click **Export trial plan (CSV)**.

> *"The plan exports with the agronomy basis, prices, applied rates, and
> reviewer info — for the farm record or the retailer."*

## Outcome (4:30 – 4:55)

> *"After harvest, the farmer enters the trial and control yields. 195.6
> versus 193.8 — held within the noise band — plus the fertilizer we saved.
> Verdict: validated."*

Bump the trial yield a couple bushels to show the verdict re-render.

> *"That closes the loop. Recommendation → review → trial → result → next-year
> action."*

## Close (4:55 – 5:00)

> *"SoilProve makes the nitrogen decision defensible. Live data grounds it,
> the agronomist owns it, the trial proves it. Prove what your soil data is
> worth."*

---

## Fallback script — if a live API is slow

If the USDA SSURGO fetch is slow on stage:

- Note out loud: *"that's a live USDA query — we built a graceful fallback so the page never blocks."*
- The Intelligence page will already be showing the fallback profile badge.
- Move directly to the **Recommendation** page — it computes off whatever soil/weather data is in the store, fallback or live.

If NWS is slow:

- The recommendation works without weather (loss risk falls back to a neutral 30% next-rain probability).
- Continue with the demo unchanged.

## Tips

- Don't open every page. Keep the cadence tight: workspace → intelligence → recommendation → review → trial → outcome.
- Don't read the disclaimer rail in the UI out loud — the model honesty
  lives on `/method` and in the README. The judges will appreciate that you
  did not over-claim, but you don't need to spend airtime on it.
- The most powerful 30 seconds are the Intelligence page. Slow down there.

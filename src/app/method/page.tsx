import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { recommendationModel } from "@/lib/engine/model";

export const metadata = {
  title: "Method · SoilProve",
};

export default function MethodPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-100 bg-paper">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/"><Logo /></Link>
          <Link href="/workspace" className="btn-ghost">
            Open workspace →
          </Link>
        </div>
      </header>
      <main className="container-page py-12">
        <div className="max-w-3xl">
          <Badge tone="loam">Method</Badge>
          <h1 className="mt-3">How SoilProve produces a defensible number</h1>
          <p className="mt-3 text-balance text-lg leading-relaxed text-ink-600">
            The product is intentionally honest about what is live, what is
            modeled, and what is reserved for a future ML pass. This page lays
            out the data sources, feature layer, and recommendation engine in
            plain terms.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Block
            num="01"
            title="Live data sources"
            body={
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-700">
                <li>
                  <strong>USDA NRCS SSURGO</strong> via Soil Data Access. A
                  single T-SQL query pulls map unit, dominant component,
                  drainage class, hydrologic group, organic matter (0–30 cm
                  depth-weighted), available water storage, and surface
                  texture for the exact field coordinate.
                </li>
                <li>
                  <strong>National Weather Service</strong>. The
                  api.weather.gov /points endpoint resolves a coordinate to a
                  forecast grid, then the gridpoint forecast is normalized to
                  a 7-day daily outlook with precipitation probabilities.
                </li>
                <li>
                  <strong>US Census geocoder</strong>. Optional free-text
                  resolver. Latitude and longitude is the source of truth.
                </li>
              </ul>
            }
          />
          <Block
            num="02"
            title="Feature extraction layer"
            body={
              <>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  A single pure function takes the field inputs plus live soil
                  and weather, and produces a typed <code className="font-mono text-[12px]">DecisionFeatures</code> vector
                  used by every downstream module: engine, risk, ROI, and the
                  future ML model.
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-700">
                  <li>Texture → leaching potential (0..1)</li>
                  <li>Drainage class → denitrification potential (0..1)</li>
                  <li>Hydrologic group → runoff potential</li>
                  <li>NWS 72h precip prob × soil sensitivity → weather loss risk</li>
                  <li>Price ratio = N price ÷ corn price</li>
                  <li>Regional MRTN reference rate by state</li>
                </ul>
              </>
            }
          />
          <Block
            num="03"
            title="Recommendation engine"
            body={
              <>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  The default <strong>{recommendationModel.name}</strong> (v{recommendationModel.version}) is a transparent
                  additive heuristic over the feature vector. It starts from a
                  state-level MRTN reference and applies named, signed
                  contributions for agronomy, soil, weather, and economics.
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-700">
                  Every contribution is surfaced in the recommendation page so
                  a farmer can see exactly why their number is what it is.
                </p>
              </>
            }
          />
          <Block
            num="04"
            title="Confidence & risk"
            body={
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
                <li>+ Stable when rate is near the regional reference</li>
                <li>− Penalty for elevated weather loss risk</li>
                <li>− Penalty for leachy soil profiles</li>
                <li>− Penalty for small field acreage (noisier outcomes)</li>
                <li>Numeric score (0..1), categorical {`{low, moderate, high}`}, and named risk flags</li>
              </ul>
            }
          />
          <Block
            num="05"
            title="Economics layer"
            body={
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                The savings number is computed from <em>lb N / ac saved × N price × acres</em>.
                Trial economics break out fertilizer spend (baseline vs trial),
                yield revenue delta, and net margin delta. No leverage, no implied
                rebates. Just first-order math you can sanity check on paper.
              </p>
            }
          />
          <Block
            num="06"
            title="ML-ready interface"
            body={
              <>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  The engine implements a <code className="font-mono text-[12px]">RecommendationModel</code> interface with{" "}
                  <code className="font-mono text-[12px]">name</code>, <code className="font-mono text-[12px]">version</code>,{" "}
                  <code className="font-mono text-[12px]">modelClass</code>, and a single{" "}
                  <code className="font-mono text-[12px]">recommend(features, inputs)</code> method.
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-700">
                  A trained predictor (gradient-boosted yield response surface,
                  Bayesian hierarchical model, etc.) can drop in without
                  touching feature extraction or the UI. Flip the exported
                  singleton.
                </p>
              </>
            }
          />
        </div>

        <section className="mt-16">
          <Badge tone="ink">What is not real yet</Badge>
          <h2 className="mt-3">Honesty rail</h2>
          <ul className="mt-4 grid gap-2.5 text-sm leading-relaxed text-ink-700 md:grid-cols-2">
            <li>· No trained ML model in this build. The engine is rules-based.</li>
            <li>· No real farmer outcomes are bundled. The outcome page is for the user’s own trial data.</li>
            <li>· No live retailer or OEM integrations.</li>
            <li>· Geocoding falls back gracefully; the source of truth is lat/lon.</li>
            <li>· When USDA or NWS is unreachable, the app uses a clearly labelled regional fallback.</li>
            <li>· State-level MRTN reference rates are conservative averages, not field-specific calibrations.</li>
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-ink-100 bg-paper p-6 md:p-7">
          <h3>Endpoints</h3>
          <ul className="mt-4 grid gap-2.5 text-sm leading-relaxed text-ink-700 md:grid-cols-2">
            <li><code>GET /api/soil?lat=…&amp;lon=…</code><span className="mx-1.5 text-ink-300">·</span>USDA SSURGO normalized soil profile</li>
            <li><code>GET /api/weather?lat=…&amp;lon=…</code><span className="mx-1.5 text-ink-300">·</span>NWS 7-day forecast and near-term loss risk</li>
            <li><code>GET /api/geocode?q=…</code><span className="mx-1.5 text-ink-300">·</span>US Census oneline address resolver</li>
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/workspace" className="btn-primary">Open workspace</Link>
          <Link href="/" className="btn-ghost">← Back to landing</Link>
        </div>
      </main>
      <footer className="border-t border-ink-100 bg-canvas py-8">
        <div className="container-page text-[12px] text-ink-500">
          SoilProve
        </div>
      </footer>
    </div>
  );
}

function Block({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <section className="surface panel-pad">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl text-loam-500">{num}</span>
        <span className="micro">Section</span>
      </div>
      <h3 className="mt-1">{title}</h3>
      {body}
    </section>
  );
}

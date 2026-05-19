import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="bg-canvas">
      <SiteHeader />
      <main>
        <Hero />
        <SecondaryBand />
        <PillarStrip />
        <Workflow />
        <ClosingBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-ink-100 bg-paper/80 backdrop-blur">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden gap-7 text-sm text-ink-600 md:flex">
          <Link href="/#workflow" className="hover:text-ink-900">Workflow</Link>
          <Link href="/method" className="hover:text-ink-900">Method</Link>
          <Link href="/#vision" className="hover:text-ink-900">Vision</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/method" className="hidden text-sm text-ink-600 hover:text-ink-900 md:inline">
            How it works
          </Link>
          <Link href="/workspace" className="btn-primary">
            Open workspace →
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-60" />
      <div className="container-page relative grid items-center gap-12 py-20 md:grid-cols-[1.15fr,0.85fr] md:py-28">
        <div>
          <Badge tone="moss" dot className="mb-5">
            Live USDA + NWS
          </Badge>
          <h1 className="text-balance text-[40px] leading-[1.05] tracking-tightish md:text-[64px]">
            Prove what your soil data is worth.
          </h1>
          <p className="mt-5 max-w-xl text-balance text-lg leading-relaxed text-ink-600">
            Field-specific nitrogen decisions grounded in live USDA soil data
            and National Weather Service forecasts, reviewable by an agronomist
            and validated by a real trial.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workspace" className="btn-primary">
              Open field workspace
            </Link>
            <Link href="/method" className="btn-ghost">
              How the engine works
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink-100 pt-6 text-[13px]">
            <Metric kpi="USDA" sub="SSURGO soil profile" />
            <Metric kpi="NWS" sub="Forecast and loss risk" />
            <Metric kpi="MRTN" sub="Economic baseline" />
          </dl>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}

function Metric({ kpi, sub }: { kpi: string; sub: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-ink-900">{kpi}</div>
      <div className="text-ink-500">{sub}</div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-moss-100 blur-3xl" />
      <div className="absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-loam-100 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-paper shadow-lift">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose2-400" />
            <span className="h-2 w-2 rounded-full bg-amber2-400" />
            <span className="h-2 w-2 rounded-full bg-moss-400" />
          </div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-400">
            Recommendation · North Bend
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 px-6 py-7">
          <div>
            <div className="label">Current plan</div>
            <div className="mt-1.5 font-display text-4xl leading-none text-ink-900">
              200<span className="ml-1 text-base font-normal text-ink-400">lb/ac</span>
            </div>
            <div className="mt-2 text-[12px] text-ink-500">Farmer baseline</div>
          </div>
          <div>
            <div className="label">SoilProve</div>
            <div className="mt-1.5 font-display text-4xl leading-none text-moss-700">
              176<span className="ml-1 text-base font-normal text-ink-400">lb/ac</span>
            </div>
            <div className="mt-2 text-[12px] font-semibold text-moss-700">
              −24 lb/ac, $1,964 saved
            </div>
          </div>
        </div>
        <div className="border-t border-ink-100 px-6 py-4">
          <div className="label mb-2">Drivers</div>
          <DriverBar label="Soybean rotation credit" delta={0} color="bg-ink-200" />
          <DriverBar label="Silt loam · moderately drained" delta={-6} color="bg-moss-300" />
          <DriverBar label="Forecast: 70% rain next 72h" delta={+10} color="bg-sky2-300" />
          <DriverBar label="Organic matter 3.4%" delta={-8} color="bg-loam-300" />
          <DriverBar label="N : corn ratio 0.14" delta={0} color="bg-ink-200" />
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 px-6 py-4 text-[12px]">
          <span className="text-ink-500">Confidence</span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
              <span className="block h-1.5 w-[78%] rounded-full bg-moss-500" />
            </span>
            <span className="font-semibold text-moss-700">High · 0.78</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverBar({ label, delta, color }: { label: string; delta: number; color: string }) {
  const isPos = delta > 0;
  const isNeg = delta < 0;
  return (
    <div className="grid grid-cols-[1fr,auto] items-center gap-2 py-1.5">
      <div className="flex items-center gap-3 text-[12px] text-ink-700">
        <span className={`h-1.5 w-10 rounded-full ${color}`} />
        <span className="truncate">{label}</span>
      </div>
      <span
        className={`text-[12px] font-semibold tabular-nums ${
          isPos ? "text-clay-600" : isNeg ? "text-moss-700" : "text-ink-400"
        }`}
      >
        {delta > 0 ? "+" : delta < 0 ? "−" : ""}{Math.abs(delta)} lb
      </span>
    </div>
  );
}

function SecondaryBand() {
  return (
    <section className="border-y border-ink-100 bg-paper">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <Pillar
          n="01"
          title="A defensible number"
          body="Recommendations are explainable, not opaque. Every pound of N is tied to a soil, weather, agronomic, or economic driver."
        />
        <Pillar
          n="02"
          title="Live field intelligence"
          body="USDA SSURGO and the National Weather Service are queried against your exact coordinates, not assumed from a region."
        />
        <Pillar
          n="03"
          title="Built around the agronomist"
          body="An agronomist reviews, adjusts, and signs off. A safe trial proves the rate on one strip before any scale up."
        />
      </div>
    </section>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-loam-500">{n}</div>
      <h3 className="mt-1">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}

function PillarStrip() {
  return (
    <section id="workflow" className="container-page py-20">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="loam">Workflow</Badge>
          <h2 className="mt-3 text-balance text-3xl md:text-4xl">
            From a coordinate to a season-end ROI.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink-600">
          Six routed pages, one persistent field state. Live data flows from
          the first page into the recommendation, into the review, into the
          trial.
        </p>
      </div>
    </section>
  );
}

function Workflow() {
  const items = [
    { n: "01", title: "Field Setup", body: "Identify location, acreage, and economics. Persisted across pages." },
    { n: "02", title: "Field Intelligence", body: "Pull live USDA soil profile and NWS weather for the exact coordinate." },
    { n: "03", title: "Recommendation", body: "Decision console with drivers, economics, confidence and risk." },
    { n: "04", title: "Agronomist Review", body: "Approve, adjust, or request revision with a written rationale." },
    { n: "05", title: "Trial Planner", body: "Define a low-risk trial strip vs control. Export the plan." },
    { n: "06", title: "Outcome", body: "Enter harvest results and get a validated or inconclusive verdict." },
  ];
  return (
    <section className="container-page pb-20">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <div key={it.n} className="surface panel-pad transition hover:shadow-lift">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl text-loam-500">{it.n}</span>
              <span className="micro">Step</span>
            </div>
            <h3 className="mt-3">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingBand() {
  return (
    <section id="vision" className="border-t border-ink-100 bg-ink-900 text-paper">
      <div className="container-page grid items-center gap-10 py-16 md:grid-cols-[1.4fr,1fr]">
        <div>
          <Badge tone="ink" className="bg-ink-800 text-paper ring-ink-700">
            Why this exists
          </Badge>
          <h2 className="mt-3 text-balance text-3xl text-paper md:text-4xl">
            Farmers fear yield loss more than they value paper savings. SoilProve closes that gap.
          </h2>
          <p className="mt-3 max-w-xl text-balance leading-relaxed text-ink-200">
            The engine is honest about what is live, what is modeled, and what
            needs a real trial. The architecture is ready to swap in a trained
            yield-response model when the data is in place.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/workspace" className="btn-soft bg-paper text-ink-900 hover:bg-ink-100">
              Try the workspace
            </Link>
            <Link href="/method" className="btn-ghost border-ink-700 bg-transparent text-paper hover:bg-ink-800">
              Read the method
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
          <div className="label text-ink-300">What is grounded</div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-100">
            <li>Live USDA NRCS SSURGO soil profile</li>
            <li>Live National Weather Service forecast</li>
            <li>Soil and weather feed the recommendation</li>
            <li>Transparent rules engine with named drivers</li>
            <li>ML-ready feature vector for a trained successor</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-canvas py-8">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-500">
        <Logo />
        <span>Prove what your soil data is worth.</span>
      </div>
    </footer>
  );
}

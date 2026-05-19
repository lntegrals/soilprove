export function HonestyFooter() {
  return (
    <section
      id="what-is-simulated"
      className="border-t border-slate-100 bg-sand"
    >
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-bold text-slate-800">
              What&apos;s real vs simulated
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              SoilProve is a hackathon prototype. The product story is real;
              the data is not. We won&apos;t dress synthetic numbers up as real
              customer validation — that would undercut the trust thesis the
              product is built around.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The recommendation logic is a deterministic, rules-based model
              inspired by the MRTN methodology, not a production agronomic
              engine. Every input adjustment in the &ldquo;Why this differs&rdquo;
              panel is visible and editable.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FactCard
                title="Real in this build"
                tone="slate"
                items={[
                  "Deterministic recommendation engine (visible factors)",
                  "Agronomist review state machine with adjusted-rate flow",
                  "Trial planner with CSV export",
                  "Outcome verdict logic against the trial",
                  "Branding, copy, and product framing",
                ]}
              />
              <FactCard
                title="Modeled / demo only"
                tone="amber"
                items={[
                  "Peer cohort numbers — labeled as modeled, not customer outcomes",
                  "Named &ldquo;peer&rdquo; scenarios (Mark, Caspian) are illustrative cohort labels, not real users",
                  "Soil residual N, weather scenario, and county are inputs you choose for the demo",
                  "Yield modeling is a teaching parabola, not an agronomic forecast",
                  "Post-season outcome data is seeded — edit it to explore verdicts",
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "slate" | "amber";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";
  const titleCls = tone === "amber" ? "text-amber-800" : "text-slate-700";
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <h3 className={`font-display text-sm font-bold ${titleCls}`}>{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2">
            <svg
              viewBox="0 0 20 20"
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                tone === "amber" ? "text-amber-600" : "text-slate-500"
              }`}
              fill="currentColor"
              aria-hidden
            >
              <circle cx="10" cy="10" r="3" />
            </svg>
            <span
              dangerouslySetInnerHTML={{
                __html: i,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

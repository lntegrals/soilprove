"use client";

import { FieldIntake, Recommendation } from "@/lib/types";
import { fmtBu, fmtLb, fmtUSD, fmtUSD2, signed } from "@/lib/format";
import { Stat } from "./Stat";
import { Badge } from "./Badge";

type Props = {
  intake: FieldIntake;
  rec: Recommendation;
  effectiveRate: number;
  reviewerAdjusted: boolean;
};

export function RecommendationPanel({
  intake,
  rec,
  effectiveRate,
  reviewerAdjusted,
}: Props) {
  const rateDelta = intake.currentNRate - effectiveRate;
  const perAcre = rateDelta * intake.nitrogenPrice;
  const total = perAcre * intake.acres;

  return (
    <section className="card overflow-hidden">
      <header className="border-b border-slate-100 bg-gradient-to-br from-white to-sand px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-slate-800">
                Recommendation comparison
              </h2>
              <ConfidenceBadge confidence={rec.confidence} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {intake.fieldName} · {intake.county} County, {intake.state} ·{" "}
              {intake.acres} ac
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Method:</span>{" "}
            MRTN-style reference rate ({rec.baseMrtnRate} lb / ac) + transparent
            field adjustments. Deterministic demo model.
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        {/* Comparison block */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PlanCard
              label="Your current plan"
              rate={intake.currentNRate}
              tone="muted"
              caption="Flat application"
            />
            <PlanCard
              label="SoilProve recommended"
              rate={rec.recommendedRate}
              tone="primary"
              caption="MRTN + field adjustments"
              highlight
            />
            {reviewerAdjusted ? (
              <PlanCard
                label="Agronomist-adjusted"
                rate={effectiveRate}
                tone="accent"
                caption="Reviewer-stamped"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Agronomist review will appear here once stamped.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <Stat
                label="Δ N rate / ac"
                value={
                  <span
                    className={
                      rateDelta > 0
                        ? "text-terracotta-600"
                        : rateDelta < 0
                        ? "text-slate-600"
                        : "text-slate-700"
                    }
                  >
                    {signed(-rateDelta, " lb")}
                  </span>
                }
                hint={
                  rateDelta > 0
                    ? "Lower than your current plan"
                    : rateDelta < 0
                    ? "Higher than your current plan"
                    : "Matches your current plan"
                }
              />
              <Stat
                label="Input cost / ac"
                value={
                  <span
                    className={
                      perAcre >= 0 ? "text-terracotta-600" : "text-slate-700"
                    }
                  >
                    {perAcre >= 0 ? "−" : "+"}
                    {fmtUSD2(Math.abs(perAcre))}
                  </span>
                }
                hint="Fertilizer spend change at this rate"
              />
              <Stat
                label="Across the field"
                value={
                  <span
                    className={
                      total >= 0 ? "text-terracotta-600" : "text-slate-700"
                    }
                  >
                    {total >= 0 ? "−" : "+"}
                    {fmtUSD(Math.abs(total))}
                  </span>
                }
                hint={`${intake.acres} ac × per-acre change`}
              />
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-display text-sm font-bold text-slate-700">
              Modeled yield expectation
            </h3>
            <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <div className="font-display text-2xl font-bold text-slate-800">
                  {fmtBu(rec.expectedYield)}
                </div>
                <div className="text-xs text-slate-500">
                  Range {rec.expectedYieldRange[0].toFixed(0)}–
                  {rec.expectedYieldRange[1].toFixed(0)} bu / ac
                </div>
              </div>
              <p className="max-w-md text-xs text-slate-500">
                {rec.confidenceReason}
              </p>
            </div>
          </div>
        </div>

        {/* Why this changed */}
        <div className="lg:col-span-5">
          <h3 className="font-display text-sm font-bold text-slate-700">
            Why this recommendation differs from your plan
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Each factor is additive and shown in lb N / ac vs the MRTN reference
            rate.
          </p>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
              <span className="pill bg-slate-100 text-slate-700">
                Reference
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700">
                  MRTN reference rate
                </div>
                <div className="text-xs text-slate-500">
                  Regional reference for corn after soybeans.
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {fmtLb(rec.baseMrtnRate)}
              </div>
            </li>
            {rec.factors.map((f) => (
              <li
                key={f.label}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5"
              >
                <span
                  className={`pill ${
                    f.delta > 0
                      ? "bg-terracotta-50 text-terracotta-700"
                      : f.delta < 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {signed(f.delta, " lb")}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-700">
                    {f.label}
                  </div>
                  <div className="text-xs text-slate-500">{f.rationale}</div>
                </div>
              </li>
            ))}
            <li className="flex items-start gap-3 rounded-lg bg-slate-700 px-3 py-2.5 text-white">
              <span className="pill bg-white/15 text-white">Result</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">SoilProve rate</div>
                <div className="text-xs opacity-80">
                  Sum of MRTN reference plus modeled adjustments.
                </div>
              </div>
              <div className="text-sm font-semibold">
                {fmtLb(rec.recommendedRate)}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  label,
  rate,
  tone,
  caption,
  highlight = false,
}: {
  label: string;
  rate: number;
  tone: "muted" | "primary" | "accent";
  caption: string;
  highlight?: boolean;
}) {
  const colors =
    tone === "primary"
      ? "bg-slate-700 text-white"
      : tone === "accent"
      ? "bg-terracotta-50 text-terracotta-800 ring-1 ring-terracotta-200"
      : "bg-white text-slate-700 ring-1 ring-slate-200";
  return (
    <div
      className={`rounded-2xl p-4 ${colors} ${
        highlight ? "shadow-lift" : "shadow-card"
      }`}
    >
      <div
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          tone === "primary" ? "text-white/70" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold leading-none">
        {Math.round(rate)}
      </div>
      <div
        className={`mt-1 text-[11px] ${
          tone === "primary" ? "text-white/70" : "text-slate-500"
        }`}
      >
        lb N / ac · {caption}
      </div>
    </div>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: Recommendation["confidence"];
}) {
  if (confidence === "high")
    return <Badge tone="emerald">High confidence</Badge>;
  if (confidence === "moderate")
    return <Badge tone="amber">Moderate confidence</Badge>;
  return <Badge tone="rose">Limited confidence</Badge>;
}

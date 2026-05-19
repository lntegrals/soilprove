"use client";

import { FieldIntake, Recommendation } from "@/lib/types";
import { fmtUSD, fmtLb } from "@/lib/format";
import { Badge } from "./Badge";

type Props = {
  intake: FieldIntake;
  rec: Recommendation;
  effectiveRate: number;
  onStart: () => void;
  reviewStamped: boolean;
};

export function Hero({
  intake,
  rec,
  effectiveRate,
  onStart,
  reviewStamped,
}: Props) {
  const rateDelta = intake.currentNRate - effectiveRate;
  const perAcreSavings = rateDelta * intake.nitrogenPrice;
  const totalSavings = perAcreSavings * intake.acres;

  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-sand to-white">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div className="container-page relative grid grid-cols-1 gap-10 py-12 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-7">
          <span className="pill bg-terracotta-50 text-terracotta-700 ring-1 ring-terracotta-200">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta-500" />
            Prove what your soil data is worth
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-slate-800 sm:text-5xl">
            Nitrogen decisions farmers understand,{" "}
            <span className="text-terracotta-600">agronomists review,</span>{" "}
            and outcomes validate.
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-slate-600">
            SoilProve is a decision-confidence product, not just a fertilizer
            calculator. Compare your current plan against a transparent,
            MRTN-style recommendation, see modeled peer evidence, route it
            through an agronomist, run a safe side-by-side trial, then prove
            the result at harvest.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={onStart}>
              Walk the demo flow
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden
              >
                <path d="M7.3 4.3a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 11-1.4-1.4L11.6 10 7.3 5.7a1 1 0 010-1.4z" />
              </svg>
            </button>
            <a className="btn-ghost" href="#what-is-simulated">
              What&apos;s real vs simulated
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone="slate">MRTN-style recommendation</Badge>
            <Badge tone="slate">Agronomist signoff loop</Badge>
            <Badge tone="slate">Modeled peer cohort</Badge>
            <Badge tone="slate">Outcome ROI proof</Badge>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Live snapshot · {intake.fieldName}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {intake.county} County, {intake.state} · {intake.acres} ac
                </div>
              </div>
              {reviewStamped ? (
                <Badge tone="emerald">Agronomist reviewed</Badge>
              ) : (
                <Badge tone="amber">Awaiting review</Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <HeroStat label="Current" value={fmtLb(intake.currentNRate)} />
              <HeroStat
                label="SoilProve"
                value={fmtLb(effectiveRate)}
                accent
              />
              <HeroStat
                label={totalSavings >= 0 ? "Modeled savings" : "Added cost"}
                value={fmtUSD(Math.abs(totalSavings))}
                tone="dark"
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <strong className="font-semibold text-slate-700">
                Method:
              </strong>{" "}
              {rec.baseMrtnRate} lb / ac regional reference, adjusted for
              rotation, residual N, weather, and price ratio.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  accent = false,
  tone = "light",
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "light" | "dark";
}) {
  if (tone === "dark") {
    return (
      <div className="rounded-xl bg-slate-700 p-3 text-white">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
          {label}
        </div>
        <div className="mt-1 font-display text-xl font-bold leading-tight">
          {value}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl p-3 ring-1 ${
        accent
          ? "bg-terracotta-50 text-terracotta-800 ring-terracotta-200"
          : "bg-slate-50 text-slate-700 ring-slate-100"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-1 font-display text-xl font-bold leading-tight">
        {value}
      </div>
    </div>
  );
}

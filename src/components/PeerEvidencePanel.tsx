"use client";

import { FieldIntake, PeerCohort, Recommendation } from "@/lib/types";
import { fmtUSD2, signed } from "@/lib/format";
import { DemoLabel } from "./Badge";

type Props = {
  intake: FieldIntake;
  rec: Recommendation;
  cohort: PeerCohort;
};

export function PeerEvidencePanel({ intake, rec, cohort }: Props) {
  return (
    <section className="card p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">
            Comparable field evidence
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Modeled cohort of similar fields — corn after{" "}
            {intake.previousCrop.replace("_", " ")} in the {intake.state} region
            with comparable rotation and soil profile.
          </p>
        </div>
        <span
          className={`pill ring-1 ${
            cohort.confidenceBadge.includes("strong")
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : cohort.confidenceBadge.includes("limited")
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-amber-50 text-amber-700 ring-amber-200"
          }`}
        >
          {cohort.confidenceBadge}
        </span>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CohortStat
          label="Similar scenarios"
          value={`${cohort.scenarioCount}`}
          hint="Modeled comparable fields"
        />
        <CohortStat
          label="Avg N reduction"
          value={`${cohort.avgReductionLbPerAcre} lb / ac`}
          hint="vs prior flat-rate plans"
        />
        <CohortStat
          label="Avg margin effect"
          value={`${
            cohort.avgMarginEffectPerAcre >= 0 ? "+" : "−"
          }${fmtUSD2(Math.abs(cohort.avgMarginEffectPerAcre))} / ac`}
          hint="Fertilizer savings + yield"
          accent={cohort.avgMarginEffectPerAcre > 0}
        />
        <CohortStat
          label="Yield outcome range"
          value={`${signed(cohort.yieldDeltaRange[0])} to ${signed(
            cohort.yieldDeltaRange[1],
            " bu"
          )}`}
          hint="Modeled distribution"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <PeerNarrative
          farmer="Mark · Story County, IA"
          rotation="Corn after soybeans · 220 ac"
          summary="Cohort scenario A — modeled $24/ac savings at a 26 lb cut, yield held within ±2 bu."
        />
        <PeerNarrative
          farmer="Caspian · Boone County, IA"
          rotation="Corn after soybeans · 168 ac"
          summary="Cohort scenario B — modeled $19/ac savings at an 18 lb cut, +2 bu yield in modeled outcome."
        />
      </div>

      <div className="mt-5">
        <DemoLabel />
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Cohort note: {cohort.cohortNote} In production, this panel would
        cross-reference live peer farmer outcomes by county and soil type, with
        consent.
      </p>
    </section>
  );
}

function CohortStat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-lg font-bold ${
          accent ? "text-terracotta-600" : "text-slate-800"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function PeerNarrative({
  farmer,
  rotation,
  summary,
}: {
  farmer: string;
  rotation: string;
  summary: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">{farmer}</div>
        <span className="pill bg-slate-100 text-slate-600">Modeled peer</span>
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{rotation}</div>
      <p className="mt-2 text-sm text-slate-600">{summary}</p>
    </div>
  );
}

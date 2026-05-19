"use client";

import { FieldIntake, Recommendation, TrialPlan } from "@/lib/types";
import { fmtLb, fmtUSD, fmtUSD2 } from "@/lib/format";

type Props = {
  intake: FieldIntake;
  rec: Recommendation;
  trial: TrialPlan;
  effectiveRate: number;
  onChange: (patch: Partial<TrialPlan>) => void;
  onDownloadCsv: () => void;
};

export function TrialPlannerPanel({
  intake,
  rec,
  trial,
  effectiveRate,
  onChange,
  onDownloadCsv,
}: Props) {
  const fertSavings =
    (trial.controlRate - trial.trialRate) * intake.nitrogenPrice * trial.trialAcres;
  const acresPct = Math.min(100, (trial.trialAcres / Math.max(1, intake.acres)) * 100);

  return (
    <section className="card p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">
            Safe trial planner
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Pick one comfortable field and run a side-by-side trial. The point
            is proof, not a fleet-wide change.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onDownloadCsv}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v7.59l2.3-2.3a1 1 0 111.4 1.42l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.42L9 11.59V4a1 1 0 011-1z" />
            <path d="M3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
          Download trial plan (CSV)
        </button>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trial layout
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={4}
                max={Math.max(8, Math.round(intake.acres * 0.5))}
                value={trial.trialAcres}
                onChange={(e) =>
                  onChange({
                    trialAcres: Number(e.target.value),
                    controlAcres: Number(e.target.value),
                  })
                }
                className="flex-1 accent-terracotta-500"
              />
              <span className="w-24 text-right text-sm font-semibold text-slate-700">
                {trial.trialAcres} ac strip
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {acresPct.toFixed(0)}% of {intake.acres} ac. Control strip uses
              the same acreage at your current rate.
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <RateEditor
                label="Control rate"
                value={trial.controlRate}
                onChange={(v) => onChange({ controlRate: v })}
                tone="muted"
              />
              <RateEditor
                label="Trial rate"
                value={trial.trialRate}
                onChange={(v) => onChange({ trialRate: v })}
                tone="accent"
                hint={`Reviewer-approved: ${fmtLb(effectiveRate)}`}
                onApplyApproved={() => onChange({ trialRate: effectiveRate })}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trial notes
            </h3>
            <textarea
              className="field-input mt-2 min-h-[90px]"
              value={trial.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-700">
              Trial summary
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <SummaryStat
                label="Trial acres"
                value={`${trial.trialAcres} ac`}
              />
              <SummaryStat
                label="Fertilizer (control)"
                value={fmtUSD(
                  trial.controlRate * intake.nitrogenPrice * trial.trialAcres
                )}
                hint={`${fmtLb(trial.controlRate)}`}
              />
              <SummaryStat
                label="Fertilizer (trial)"
                value={fmtUSD(
                  trial.trialRate * intake.nitrogenPrice * trial.trialAcres
                )}
                hint={`${fmtLb(trial.trialRate)}`}
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-700 px-4 py-4 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                Expected fertilizer savings on the trial strip
              </div>
              <div className="mt-1 font-display text-3xl font-bold">
                {fertSavings >= 0 ? "−" : "+"}
                {fmtUSD2(Math.abs(fertSavings))}
              </div>
              <div className="mt-1 text-xs text-white/70">
                {fertSavings >= 0 ? "Modeled savings" : "Modeled added cost"} on{" "}
                {trial.trialAcres} ac. Yield impact will be measured at harvest.
              </div>
            </div>

            <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Success metrics
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {trial.successMetrics.map((m) => (
                <li key={m} className="flex gap-2">
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {m}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-slate-500">
              Download the trial plan as a CSV — bring it to your retailer, your
              applicator, and your agronomist. One signed page beats verbal
              agreement at the planter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RateEditor({
  label,
  value,
  onChange,
  tone,
  hint,
  onApplyApproved,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tone: "muted" | "accent";
  hint?: string;
  onApplyApproved?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "accent"
          ? "border-terracotta-200 bg-terracotta-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={80}
          max={280}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="field-input"
        />
        <span className="text-xs text-slate-500">lb / ac</span>
      </div>
      {hint ? (
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{hint}</span>
          {onApplyApproved ? (
            <button
              type="button"
              onClick={onApplyApproved}
              className="text-terracotta-700 underline-offset-2 hover:underline"
            >
              Use approved rate
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-slate-800">
        {value}
      </div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

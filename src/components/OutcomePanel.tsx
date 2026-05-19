"use client";

import { FieldIntake, OutcomeData, Recommendation, TrialPlan } from "@/lib/types";
import { fmtBu, fmtUSD, fmtUSD2, signed } from "@/lib/format";
import { Badge, DemoLabel } from "./Badge";

type Props = {
  intake: FieldIntake;
  rec: Recommendation;
  trial: TrialPlan;
  outcome: OutcomeData;
  onChange: (patch: Partial<OutcomeData>) => void;
  onReset: () => void;
};

export function OutcomePanel({
  intake,
  rec,
  trial,
  outcome,
  onChange,
  onReset,
}: Props) {
  const totalSavings = outcome.fertilizerSpendBaseline - outcome.fertilizerSpendActual;
  const yieldDelta = outcome.yieldTrial - outcome.yieldControl;
  const revenueDelta = yieldDelta * intake.cornPrice * trial.trialAcres;

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-white to-sand px-6 py-5">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">
            Outcome & ROI dashboard
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Close the loop: recommendation → validation → trial → result. Type
            in your harvest numbers below, or use the seeded post-season demo
            data to see how it would look at year-end.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onReset}>
          Reset to seeded result
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reported numbers
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField
              label="Trial yield"
              value={outcome.yieldTrial}
              step={0.1}
              suffix="bu / ac"
              onChange={(v) => onChange({ yieldTrial: v })}
            />
            <NumberField
              label="Control yield"
              value={outcome.yieldControl}
              step={0.1}
              suffix="bu / ac"
              onChange={(v) => onChange({ yieldControl: v })}
            />
            <NumberField
              label="Applied rate (trial)"
              value={outcome.appliedRateTrial}
              step={1}
              suffix="lb / ac"
              onChange={(v) =>
                onChange({
                  appliedRateTrial: v,
                  fertilizerSpendActual:
                    v * intake.nitrogenPrice * trial.trialAcres,
                })
              }
            />
            <NumberField
              label="Applied rate (control)"
              value={outcome.appliedRateControl}
              step={1}
              suffix="lb / ac"
              onChange={(v) =>
                onChange({
                  appliedRateControl: v,
                  fertilizerSpendBaseline:
                    v * intake.nitrogenPrice * trial.trialAcres,
                })
              }
            />
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            In production, yield monitor and applicator data would auto-fill
            these fields. For the demo, edit any value and watch the verdict
            update.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div
            className={`rounded-2xl p-5 ring-1 ${
              outcome.verdict === "validated"
                ? "bg-emerald-50 ring-emerald-200"
                : outcome.verdict === "needs_more_data"
                ? "bg-rose-50 ring-rose-200"
                : "bg-amber-50 ring-amber-200"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VerdictBadge verdict={outcome.verdict} />
              <span className="text-[11px] text-slate-600">
                Across {trial.trialAcres} trial acres · {intake.fieldName}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{outcome.verdictNote}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <ResultStat
                label="Fertilizer savings"
                value={`${totalSavings >= 0 ? "−" : "+"}${fmtUSD(
                  Math.abs(totalSavings)
                )}`}
                hint={`Baseline ${fmtUSD(
                  outcome.fertilizerSpendBaseline
                )} vs actual ${fmtUSD(outcome.fertilizerSpendActual)}`}
                accent
              />
              <ResultStat
                label="Yield delta"
                value={`${signed(yieldDelta)} bu / ac`}
                hint={`${fmtBu(outcome.yieldTrial)} trial vs ${fmtBu(
                  outcome.yieldControl
                )} control`}
              />
              <ResultStat
                label="Net margin impact"
                value={`${outcome.marginDelta >= 0 ? "+" : "−"}${fmtUSD(
                  Math.abs(outcome.marginDelta)
                )}`}
                hint={`Fert savings + ${
                  revenueDelta >= 0 ? "added" : "lost"
                } revenue (${fmtUSD2(Math.abs(revenueDelta))})`}
                accent
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What this means next year
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {outcome.verdict === "validated" ? (
                <>
                  <li>
                    Scale the trial rate to an additional comfortable field
                    next season — don&apos;t move the whole farm at once.
                  </li>
                  <li>
                    Review with your agronomist; refresh the soil test before
                    expanding.
                  </li>
                </>
              ) : outcome.verdict === "inconclusive" ? (
                <>
                  <li>
                    Margin moved a little. Repeat the trial in a different
                    weather year before scaling.
                  </li>
                  <li>
                    Check applicator calibration and pull a mid-season tissue
                    sample next time.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Walk the field with your agronomist before repeating —
                    yield gap exceeds the comfort band.
                  </li>
                  <li>
                    Re-run the recommendation with updated residual N and a
                    more conservative trial rate.
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="mt-4">
            <DemoLabel />
          </div>
        </div>
      </div>
    </section>
  );
}

function VerdictBadge({ verdict }: { verdict: OutcomeData["verdict"] }) {
  if (verdict === "validated")
    return <Badge tone="emerald">Validated · ROI confirmed (modeled)</Badge>;
  if (verdict === "needs_more_data")
    return <Badge tone="rose">Needs review · yield gap</Badge>;
  return <Badge tone="amber">Inconclusive · within noise band</Badge>;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="field-input"
        />
        {suffix ? (
          <span className="text-xs text-slate-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

function ResultStat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/60 p-3 ring-1 ring-white/80">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-xl font-bold ${
          accent ? "text-terracotta-700" : "text-slate-800"
        }`}
      >
        {value}
      </div>
      {hint ? <div className="text-[11px] text-slate-600">{hint}</div> : null}
    </div>
  );
}

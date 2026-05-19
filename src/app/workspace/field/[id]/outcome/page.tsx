"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Stat, StatRow } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Field, NumberField } from "@/components/ui/FieldInput";
import { useFieldState, workspaceActions } from "@/lib/store";
import { runRecommendation } from "@/lib/engine/model";
import { defaultTrialPlan, summarizeOutcome } from "@/lib/engine/trial";
import { fmtAcres, fmtBuAc, fmtLbAc, fmtUSD, signedInt } from "@/lib/format";

export default function OutcomePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);

  const result = useMemo(
    () => (fs ? runRecommendation(fs.inputs, fs.soil, fs.weather) : null),
    [fs]
  );

  if (!fs || !result) return null;
  const rec = result.recommendation;
  const i = fs.inputs;
  const reviewRate = effectiveRate(fs.review, rec);
  const seededTrial = defaultTrialPlan(i, rec, reviewRate);
  const trial = {
    ...seededTrial,
    ...fs.trial,
    trialRate: fs.trial?.trialRate ?? reviewRate,
    controlRate: fs.trial?.controlRate ?? rec.baselineRate,
    trialAcres: fs.trial?.trialAcres ?? seededTrial.trialAcres,
    controlAcres: fs.trial?.controlAcres ?? seededTrial.controlAcres,
  };

  const o = fs.outcome ?? {};
  const yieldTrial = o.yieldTrial ?? rec.expectedYield + 0.6;
  const yieldControl = o.yieldControl ?? rec.expectedYield - 1.2;
  const appliedTrial = o.appliedRateTrial ?? trial.trialRate;
  const appliedControl = o.appliedRateControl ?? trial.controlRate;

  const summary = summarizeOutcome({
    trial,
    yieldTrial,
    yieldControl,
    appliedRateTrial: appliedTrial,
    appliedRateControl: appliedControl,
    cornPrice: i.cornPrice,
    nitrogenPrice: i.nitrogenPrice,
  });

  function patch(p: Partial<typeof o>) {
    workspaceActions.patchOutcome(id, { reported: true, ...p });
  }

  function reset() {
    workspaceActions.patchOutcome(id, {
      reported: false,
      yieldTrial: undefined,
      yieldControl: undefined,
      appliedRateTrial: undefined,
      appliedRateControl: undefined,
    });
  }

  const verdictTone =
    summary.verdict === "validated"
      ? "moss"
      : summary.verdict === "needs_more_data"
      ? "rose"
      : "amber";

  return (
    <div className="space-y-6">
      {/* Verdict hero */}
      <Panel tone="dark">
        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
          <div>
            <Badge tone={verdictTone} dot>
              {verdictLabel(summary.verdict)}
            </Badge>
            <h1 className="mt-4 font-display text-3xl text-paper md:text-4xl">
              {summary.marginDelta >= 0 ? "+" : "−"}
              {fmtUSD(Math.abs(summary.marginDelta))}
              <span className="ml-2 text-base font-normal text-ink-300">
                trial margin vs control
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-200">{summary.note}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-md bg-ink-800 px-2.5 py-1 text-ink-200">
                Yield Δ {summary.yieldDelta > 0 ? "+" : ""}
                {summary.yieldDelta.toFixed(1)} bu/ac
              </span>
              <span className="rounded-md bg-ink-800 px-2.5 py-1 text-ink-200">
                Fertilizer Δ {summary.fertSavings >= 0 ? "+" : "−"}
                {fmtUSD(Math.abs(summary.fertSavings))}
              </span>
              <span className="rounded-md bg-ink-800 px-2.5 py-1 text-ink-200">
                Trial {trial.trialAcres} ac vs control {trial.controlAcres} ac
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-ink-800 p-5">
            <div className="micro text-loam-300">Next-year action</div>
            <p className="mt-2 text-sm text-paper">
              {nextYearText(summary.verdict, summary.yieldDelta, summary.fertSavings)}
            </p>
            <Link
              href={`/workspace/field/${id}/setup`}
              className="btn-accent mt-4 inline-flex"
            >
              Plan next season →
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
        <Panel
          title="Harvest results"
          subtitle="Enter measured yields and applied rates"
          right={
            <button onClick={reset} className="text-[12px] text-ink-500 hover:text-ink-900">
              Reset
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Trial yield" hint="bu/ac, harvested">
              <NumberField
                value={yieldTrial}
                onChange={(n) => patch({ yieldTrial: n })}
                min={50}
                max={300}
                step={0.1}
                suffix="bu/ac"
              />
            </Field>
            <Field label="Control yield" hint="bu/ac, harvested">
              <NumberField
                value={yieldControl}
                onChange={(n) => patch({ yieldControl: n })}
                min={50}
                max={300}
                step={0.1}
                suffix="bu/ac"
              />
            </Field>
            <Field label="Applied N (trial)" hint="actual rate applied">
              <NumberField
                value={appliedTrial}
                onChange={(n) => patch({ appliedRateTrial: n })}
                min={60}
                max={280}
                suffix="lb/ac"
              />
            </Field>
            <Field label="Applied N (control)" hint="actual rate applied">
              <NumberField
                value={appliedControl}
                onChange={(n) => patch({ appliedRateControl: n })}
                min={60}
                max={280}
                suffix="lb/ac"
              />
            </Field>
          </div>

          <div className="mt-6 hairline pt-6">
            <YieldChart
              trialYield={yieldTrial}
              controlYield={yieldControl}
              expected={rec.expectedYield}
              expectedRange={rec.yieldRange}
            />
          </div>
        </Panel>

        <aside className="space-y-6">
          <Panel title="Result summary">
            <StatRow cols={2}>
              <Stat
                label="Yield delta"
                value={`${summary.yieldDelta > 0 ? "+" : ""}${summary.yieldDelta.toFixed(1)}`}
                hint="bu/ac, trial vs control"
                tone={summary.yieldDelta >= -1 ? "good" : "warn"}
              />
              <Stat
                label="Fertilizer Δ"
                value={`${summary.fertSavings >= 0 ? "+" : "−"}${fmtUSD(Math.abs(summary.fertSavings))}`}
                tone={summary.fertSavings >= 0 ? "good" : "bad"}
              />
              <Stat
                label="Yield Δ revenue"
                value={`${summary.yieldRevenueDelta >= 0 ? "+" : "−"}${fmtUSD(Math.abs(summary.yieldRevenueDelta))}`}
              />
              <Stat
                label="Margin Δ"
                value={`${summary.marginDelta >= 0 ? "+" : "−"}${fmtUSD(Math.abs(summary.marginDelta))}`}
                tone={summary.marginDelta >= 0 ? "good" : "bad"}
              />
            </StatRow>
          </Panel>

          <Panel title="Closing the loop">
            <ul className="space-y-2 text-sm text-ink-700">
              <li>· Recommendation: <strong>{rec.recommendedRate}</strong> lb/ac at {Math.round(rec.confidenceScore * 100)}% confidence</li>
              <li>· Applied: <strong>{appliedTrial}</strong> trial, <strong>{appliedControl}</strong> control</li>
              <li>· Outcome: <strong>{verdictLabel(summary.verdict)}</strong></li>
              <li>· Field acres total: <strong>{fmtAcres(i.acres)}</strong></li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function YieldChart({
  trialYield,
  controlYield,
  expected,
  expectedRange,
}: {
  trialYield: number;
  controlYield: number;
  expected: number;
  expectedRange: [number, number];
}) {
  const min = Math.min(trialYield, controlYield, expectedRange[0]) - 4;
  const max = Math.max(trialYield, controlYield, expectedRange[1]) + 4;
  const span = max - min;
  const pct = (v: number) => ((v - min) / span) * 100;

  return (
    <div>
      <div className="label mb-3">Yield comparison</div>
      <div className="relative h-28 w-full rounded-xl bg-canvas">
        {/* Expected range band */}
        <div
          className="absolute top-2 bottom-2 rounded-md bg-moss-100"
          style={{
            left: `${pct(expectedRange[0])}%`,
            width: `${pct(expectedRange[1]) - pct(expectedRange[0])}%`,
          }}
        />
        {/* Control mark (top) */}
        <Marker pct={pct(controlYield)} label={fmtBuAc(controlYield)} color="bg-loam-500" sub="control" align="top" />
        {/* Expected mark (middle) */}
        <Marker pct={pct(expected)} label={fmtBuAc(expected)} color="bg-ink-400" sub="modeled" />
        {/* Trial mark (bottom) */}
        <Marker pct={pct(trialYield)} label={fmtBuAc(trialYield)} color="bg-moss-600" sub="trial" align="bottom" />
      </div>
      <div className="mt-2.5 flex justify-between text-[10px] tabular-nums text-ink-500">
        <span>{Math.round(min)} bu/ac</span>
        <span>{Math.round(max)} bu/ac</span>
      </div>
    </div>
  );
}

function Marker({
  pct,
  label,
  color,
  sub,
  align = "middle",
}: {
  pct: number;
  label: string;
  color: string;
  sub: string;
  align?: "top" | "bottom" | "middle";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const yClass =
    align === "top"
      ? "top-2"
      : align === "bottom"
      ? "bottom-2"
      : "top-1/2 -translate-y-1/2";
  return (
    <div
      className={`pointer-events-none absolute flex items-center gap-2 ${yClass}`}
      style={{
        left: `${clamped}%`,
        transform: `translateX(-50%) ${align === "middle" ? "translateY(-50%)" : ""}`.trim(),
      }}
    >
      <span className={`block h-4 w-1 shrink-0 rounded-full ${color}`} />
      <span className="whitespace-nowrap rounded-md bg-paper px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-800 shadow-card">
        {label}
        <span className="ml-1 font-normal text-ink-400">{sub}</span>
      </span>
    </div>
  );
}

function effectiveRate(
  review: NonNullable<ReturnType<typeof useFieldState>>["review"] | undefined,
  rec: ReturnType<typeof runRecommendation>["recommendation"]
): number {
  if (!review) return rec.recommendedRate;
  if (review.status === "approved_with_note" && review.adjustedRate != null) {
    return review.adjustedRate;
  }
  if (review.status === "needs_revision") {
    return Math.round((rec.recommendedRate + rec.baselineRate) / 2);
  }
  return rec.recommendedRate;
}

function verdictLabel(v: "validated" | "inconclusive" | "needs_more_data") {
  if (v === "validated") return "Validated";
  if (v === "needs_more_data") return "Needs more data";
  return "Inconclusive";
}

function nextYearText(
  v: "validated" | "inconclusive" | "needs_more_data",
  yieldDelta: number,
  fertSavings: number
): string {
  if (v === "validated") {
    return `Scale the trial rate to a larger share of the field next season. Yield held within the noise band and fertilizer ${fertSavings >= 0 ? "saved" : "ran higher"}.`;
  }
  if (v === "needs_more_data") {
    return `Yield dropped meaningfully on the trial strip. Revisit residual N and timing before retrying, and consider a stabilizer.`;
  }
  return `Result is inside the modeled noise band (${yieldDelta.toFixed(1)} bu/ac). Worth a second-year trial before scaling.`;
}

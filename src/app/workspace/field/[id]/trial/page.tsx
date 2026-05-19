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
import { defaultTrialPlan, trialEconomics } from "@/lib/engine/trial";
import { fmtAcres, fmtLbAc, fmtUSD, signedInt } from "@/lib/format";

export default function TrialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);

  const result = useMemo(
    () => (fs ? runRecommendation(fs.inputs, fs.soil, fs.weather) : null),
    [fs]
  );

  if (!fs || !result) return null;
  const field = fs;
  const rec = result.recommendation;
  const i = field.inputs;
  const reviewRate = effectiveRate(field.review, rec);

  const seeded = defaultTrialPlan(i, rec, reviewRate);
  const trial = {
    ...seeded,
    ...field.trial,
    trialRate: field.trial?.trialRate ?? reviewRate,
    controlRate: field.trial?.controlRate ?? rec.baselineRate,
    trialAcres: field.trial?.trialAcres ?? seeded.trialAcres,
    controlAcres: field.trial?.controlAcres ?? seeded.controlAcres,
  };

  const econ = trialEconomics(trial, i.nitrogenPrice, i.cornPrice, 0);

  function patch(p: Partial<typeof trial>) {
    workspaceActions.patchTrial(id, p);
  }

  function exportCsv() {
    const rows = [
      ["field", i.fieldName],
      ["location", i.location.label ?? `${i.location.latitude},${i.location.longitude}`],
      ["total_acres", i.acres.toString()],
      ["trial_acres", trial.trialAcres.toString()],
      ["control_acres", trial.controlAcres.toString()],
      ["control_rate_lb_per_ac", trial.controlRate.toString()],
      ["trial_rate_lb_per_ac", trial.trialRate.toString()],
      ["corn_price", i.cornPrice.toFixed(2)],
      ["nitrogen_price", i.nitrogenPrice.toFixed(2)],
      ["fertilizer_spend_baseline", econ.fertilizerSpendBaseline.toFixed(2)],
      ["fertilizer_spend_trial", econ.fertilizerSpendTrial.toFixed(2)],
      ["expected_fertilizer_savings", econ.fertilizerSavings.toFixed(2)],
      ["recommendation_model", "SoilProve Baseline Heuristic v0.2"],
      ["soil_source", field.soil?.source ?? "n/a"],
      ["weather_source", field.weather?.source ?? "n/a"],
      ["agronomist", field.review?.reviewerName ?? ""],
      ["review_status", field.review?.status ?? "pending"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${i.fieldName.replace(/\s+/g, "_")}_trial_plan.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <Panel
          title="Trial design"
          subtitle="A safe, side-by-side comparison on this field"
          right={<Badge tone="moss" dot>Low-risk pilot</Badge>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Trial strip acres" hint="Where SoilProve's rate is applied">
              <NumberField
                value={trial.trialAcres}
                onChange={(n) => patch({ trialAcres: n })}
                min={2}
                max={Math.max(i.acres, 4)}
                suffix="ac"
              />
            </Field>
            <Field label="Control strip acres" hint="At the farmer's normal rate">
              <NumberField
                value={trial.controlAcres}
                onChange={(n) => patch({ controlAcres: n })}
                min={2}
                max={Math.max(i.acres, 4)}
                suffix="ac"
              />
            </Field>
            <Field label="Trial rate">
              <NumberField
                value={trial.trialRate}
                onChange={(n) => patch({ trialRate: n })}
                min={60}
                max={280}
                suffix="lb/ac"
              />
            </Field>
            <Field label="Control rate">
              <NumberField
                value={trial.controlRate}
                onChange={(n) => patch({ controlRate: n })}
                min={60}
                max={280}
                suffix="lb/ac"
              />
            </Field>
          </div>

          <div className="mt-6">
            <div className="label mb-2">Strip preview</div>
            <StripPreview
              trialAcres={trial.trialAcres}
              controlAcres={trial.controlAcres}
              totalAcres={i.acres}
              trialRate={trial.trialRate}
              controlRate={trial.controlRate}
            />
          </div>

          <div className="mt-6 hairline pt-5">
            <div className="label mb-2">Success metrics</div>
            <ul className="space-y-1.5 text-sm text-ink-700">
              {trial.successMetrics.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-moss-600">·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <aside className="space-y-6">
          <Panel title="Trial economics">
            <StatRow cols={2}>
              <Stat
                label="Trial spend"
                value={fmtUSD(econ.fertilizerSpendTrial)}
                hint={fmtLbAc(trial.trialRate)}
              />
              <Stat
                label="Control spend"
                value={fmtUSD(econ.fertilizerSpendBaseline)}
                hint={fmtLbAc(trial.controlRate)}
              />
              <Stat
                label="Expected savings"
                value={fmtUSD(econ.fertilizerSavings)}
                tone={econ.fertilizerSavings >= 0 ? "good" : "warn"}
                hint={`${signedInt(trial.controlRate - trial.trialRate)} lb/ac on ${trial.trialAcres} ac`}
              />
              <Stat
                label="Acres covered"
                value={fmtAcres(trial.trialAcres + trial.controlAcres)}
                hint={`of ${fmtAcres(i.acres)} total`}
              />
            </StatRow>
          </Panel>

          <Panel title="Export & sign-off">
            <p className="text-sm leading-relaxed text-ink-600">
              Download a clean trial plan with agronomy basis, applied rates,
              prices, and reviewer info for the farm record or the retailer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={exportCsv} className="btn-primary">
                ↓ Export trial plan (CSV)
              </button>
              <Link
                href={`/workspace/field/${id}/outcome`}
                className="btn-ghost"
              >
                Outcome dashboard →
              </Link>
            </div>
          </Panel>

          <Panel tone="dark">
            <div className="micro text-loam-300">Risk posture</div>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-200">
              The trial isolates downside to a single strip. If the trial rate
              underperforms, the financial exposure is bounded to that strip’s
              yield drop, not the whole field.
            </p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function StripPreview({
  trialAcres,
  controlAcres,
  totalAcres,
  trialRate,
  controlRate,
}: {
  trialAcres: number;
  controlAcres: number;
  totalAcres: number;
  trialRate: number;
  controlRate: number;
}) {
  const restAcres = Math.max(0, totalAcres - trialAcres - controlAcres);
  const denom = totalAcres > 0 ? totalAcres : 1;
  const trialPct = (trialAcres / denom) * 100;
  const controlPct = (controlAcres / denom) * 100;
  const restPct = (restAcres / denom) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-20 w-full overflow-hidden rounded-xl border border-ink-100">
        <Segment
          width={trialPct}
          color="bg-moss-500"
          title="Trial strip"
          rate={trialRate}
          acres={trialAcres}
          textOn="text-paper"
        />
        <Segment
          width={controlPct}
          color="bg-loam-300"
          title="Control strip"
          rate={controlRate}
          acres={controlAcres}
          textOn="text-ink-900"
        />
        {restPct > 0 && (
          <Segment
            width={restPct}
            color="bg-canvas"
            title="Rest of field"
            rate={controlRate}
            acres={Math.round(restAcres)}
            textOn="text-ink-700"
            faded
          />
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-[11px]">
        <Legend swatch="bg-moss-500" label="Trial" />
        <Legend swatch="bg-loam-300" label="Control" />
        <Legend swatch="bg-canvas border border-ink-100" label="Rest of field" />
      </div>
    </div>
  );
}

function Segment({
  width,
  color,
  title,
  rate,
  acres,
  textOn,
  faded,
}: {
  width: number;
  color: string;
  title: string;
  rate: number;
  acres: number;
  textOn: string;
  faded?: boolean;
}) {
  if (width <= 0) return null;
  const narrow = width < 14;
  return (
    <div
      className={`flex min-w-0 flex-col justify-between overflow-hidden px-3 py-2 ${color} ${textOn} ${faded ? "opacity-80" : ""}`}
      style={{ width: `${Math.max(width, 5)}%` }}
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em]">
        {narrow ? title.split(" ")[0] : title}
      </div>
      <div className="font-display text-base leading-none tabular-nums">
        {rate}
        <span className="ml-0.5 text-[10px] font-normal">lb</span>
      </div>
      <div className="text-[10px] tabular-nums">{Math.round(acres)} ac</div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-600">
      <span className={`h-2 w-2 rounded-sm ${swatch}`} />
      {label}
    </span>
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

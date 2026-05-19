"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { useFieldState, workspaceActions } from "@/lib/store";
import { runRecommendation } from "@/lib/engine/model";
import { Field, NumberField } from "@/components/ui/FieldInput";
import { fmtUSD, signedInt } from "@/lib/format";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);

  const result = useMemo(
    () => (fs ? runRecommendation(fs.inputs, fs.soil, fs.weather) : null),
    [fs]
  );

  const [adjusting, setAdjusting] = useState(false);

  if (!fs || !result) return null;
  const rec = result.recommendation;
  const review = fs.review!;
  const effective = effectiveRate(review, rec);
  const i = fs.inputs;

  function patch(p: Partial<typeof review>) {
    workspaceActions.patchReview(id, p);
  }

  function stamp(date = new Date()) {
    return date.toISOString();
  }

  function onApprove() {
    patch({
      status: "approved",
      reviewedAt: stamp(),
      adjustedRate: undefined,
    });
  }

  function onApproveWithNote() {
    patch({
      status: "approved_with_note",
      reviewedAt: stamp(),
      adjustedRate: review.adjustedRate ?? Math.round((rec.recommendedRate + rec.baselineRate) / 2),
    });
    setAdjusting(true);
  }

  function onNeedsRevision() {
    patch({
      status: "needs_revision",
      reviewedAt: stamp(),
    });
  }

  function onReset() {
    patch({ status: "pending", adjustedRate: undefined, reviewedAt: undefined });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
      <div className="space-y-6">
        <Panel
          title="Recommendation under review"
          right={<Badge tone={statusTone(review.status)} dot>{statusLabel(review.status)}</Badge>}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <RateTile label="Farmer plan" value={rec.baselineRate} sub="baseline" />
            <RateTile
              label="SoilProve"
              value={rec.recommendedRate}
              sub={`${signedInt(-1 * (rec.baselineRate - rec.recommendedRate))} vs plan`}
              emphasis
            />
            <RateTile
              label={review.status === "approved_with_note" ? "Reviewer rate" : "Effective"}
              value={effective}
              sub={review.status !== "pending" ? "after review" : "no change"}
              tone={effective === rec.recommendedRate ? "moss" : "amber"}
            />
          </div>

          {/* Adjustment slider */}
          {(adjusting || review.status === "approved_with_note") && (
            <div className="mt-6 rounded-xl border border-ink-100 bg-canvas p-4">
              <div className="flex items-baseline justify-between">
                <div className="label">Reviewer-adjusted rate</div>
                <div className="font-display text-xl text-ink-900">
                  {review.adjustedRate ?? rec.recommendedRate} lb/ac
                </div>
              </div>
              <input
                type="range"
                min={Math.max(60, Math.min(rec.recommendedRate, rec.baselineRate) - 30)}
                max={Math.min(300, Math.max(rec.recommendedRate, rec.baselineRate) + 30)}
                step={1}
                value={review.adjustedRate ?? rec.recommendedRate}
                onChange={(e) =>
                  patch({ adjustedRate: Number(e.target.value) })
                }
                className="mt-3 w-full accent-moss-600"
              />
              <div className="mt-2 flex justify-between text-[11px] text-ink-500">
                <span>{rec.recommendedRate} (SoilProve)</span>
                <span>{rec.baselineRate} (plan)</span>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Reviewer notes">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Reviewer">
              <input
                className="field-input"
                value={review.reviewerName}
                onChange={(e) => patch({ reviewerName: e.target.value })}
              />
            </Field>
            <Field label="License">
              <input
                className="field-input"
                value={review.reviewerLicense}
                onChange={(e) => patch({ reviewerLicense: e.target.value })}
              />
            </Field>
            <Field label="Rationale" span={2} hint="Saved to the field record">
              <textarea
                className="field-input min-h-[100px] resize-y"
                value={review.rationale}
                onChange={(e) => patch({ rationale: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={onApprove} className="btn-accent">Approve recommendation</button>
            <button
              onClick={onApproveWithNote}
              className="btn-ghost"
            >
              Approve with adjusted rate
            </button>
            <button onClick={onNeedsRevision} className="btn-ghost">
              Request revision
            </button>
            {review.status !== "pending" && (
              <button onClick={onReset} className="text-[12px] text-ink-500 hover:text-ink-900">
                Reset review
              </button>
            )}
          </div>
        </Panel>
      </div>

      <aside className="space-y-6">
        <Panel title="Decision impact" subtitle="At the effective rate">
          <ImpactRow
            label="Δ vs farmer plan"
            value={`${signedInt(-1 * (rec.baselineRate - effective))} lb/ac`}
            tone={(rec.baselineRate - effective) >= 0 ? "moss" : "amber"}
          />
          <ImpactRow
            label="Per-acre $"
            value={moneySigned((rec.baselineRate - effective) * i.nitrogenPrice)}
          />
          <ImpactRow
            label="Whole-field $"
            value={moneySigned((rec.baselineRate - effective) * i.nitrogenPrice * i.acres)}
          />
          <ImpactRow
            label="Confidence"
            value={`${Math.round(rec.confidenceScore * 100)}% · ${rec.confidence}`}
          />
        </Panel>

        <Panel tone="dark" title="When review is signed">
          <p className="text-sm text-ink-200">
            The trial planner will use the reviewed rate to draft a safe pilot.
            No fertilizer touches the field until the trial is run.
          </p>
          <button
            onClick={() => router.push(`/workspace/field/${id}/trial`)}
            className="btn-accent mt-4 w-full"
          >
            Plan a safe trial →
          </button>
          <Link
            href={`/workspace/field/${id}/recommendation`}
            className="mt-3 block text-center text-[12px] text-ink-300 hover:text-paper"
          >
            ← Back to recommendation
          </Link>
        </Panel>
      </aside>
    </div>
  );
}

function RateTile({
  label,
  value,
  sub,
  emphasis,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  emphasis?: boolean;
  tone?: "moss" | "amber";
}) {
  const ring = emphasis ? "ring-2 ring-ink-900" : "ring-1 ring-ink-200";
  const valueColor =
    tone === "amber" ? "text-amber2-500" : tone === "moss" ? "text-moss-700" : "text-ink-900";
  return (
    <div className={`rounded-2xl bg-canvas px-4 py-5 ${ring}`}>
      <div className="micro text-ink-500">{label}</div>
      <div className={`mt-1 font-display text-3xl tabular-nums ${valueColor}`}>
        {Math.round(value)}
        <span className="ml-1 text-xs text-ink-400">lb/ac</span>
      </div>
      <div className="mt-1 text-[11px] text-ink-500">{sub}</div>
    </div>
  );
}

function ImpactRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "moss" | "amber" | "neutral";
}) {
  const valueColor =
    tone === "amber" ? "text-amber2-500" : tone === "moss" ? "text-moss-700" : "text-ink-900";
  return (
    <div className="flex items-center justify-between border-b border-dashed border-ink-100 py-2 text-sm last:border-b-0">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold tabular-nums ${valueColor}`}>{value}</span>
    </div>
  );
}

function effectiveRate(
  review: NonNullable<ReturnType<typeof useFieldState>>["review"],
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

function statusLabel(s: string) {
  if (s === "approved") return "Approved";
  if (s === "approved_with_note") return "Approved · adjusted";
  if (s === "needs_revision") return "Needs revision";
  return "Pending review";
}

function statusTone(s: string): "moss" | "amber" | "rose" | "neutral" {
  if (s === "approved") return "moss";
  if (s === "approved_with_note") return "amber";
  if (s === "needs_revision") return "rose";
  return "neutral";
}

function moneySigned(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${fmtUSD(Math.abs(n))}`;
}

"use client";

import { AgronomistReview, Recommendation } from "@/lib/types";
import { fmtLb } from "@/lib/format";
import { Badge } from "./Badge";

type Props = {
  rec: Recommendation;
  review: AgronomistReview;
  onChange: (patch: Partial<AgronomistReview>) => void;
  onApprove: () => void;
  onRequestRevision: () => void;
  onApproveWithAdjustment: () => void;
};

export function AgronomistPanel({
  rec,
  review,
  onChange,
  onApprove,
  onRequestRevision,
  onApproveWithAdjustment,
}: Props) {
  const reviewed = review.status !== "pending";
  return (
    <section className="card p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">
            Agronomist review
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            SoilProve augments your agronomist — it does not replace them. The
            reviewer can approve as-is, propose a more conservative rate, or
            request a revision with a rationale note.
          </p>
        </div>
        <StatusBadge status={review.status} />
      </header>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reviewer
            </h3>
            <label className="mt-2 block">
              <span className="field-label">Name</span>
              <input
                className="field-input"
                value={review.reviewerName}
                onChange={(e) => onChange({ reviewerName: e.target.value })}
                placeholder="J. Reyes, CCA"
              />
            </label>
            <label className="mt-3 block">
              <span className="field-label">License / credential</span>
              <input
                className="field-input"
                value={review.reviewerLicense}
                onChange={(e) =>
                  onChange({ reviewerLicense: e.target.value })
                }
                placeholder="CCA #4413 — IA / IL"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Conservative adjustment (optional)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Bump the rate back toward the farmer&apos;s plan if the
              recommendation feels aggressive for this field.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={rec.recommendedRate}
                max={Math.max(rec.recommendedRate + 30, rec.baselineRate)}
                value={review.adjustedRate ?? rec.recommendedRate}
                onChange={(e) =>
                  onChange({ adjustedRate: Number(e.target.value) })
                }
                className="flex-1 accent-terracotta-500"
              />
              <span className="w-20 text-right text-sm font-semibold text-slate-700">
                {fmtLb(review.adjustedRate ?? rec.recommendedRate)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              SoilProve recommended {fmtLb(rec.recommendedRate)} · Farmer plan{" "}
              {fmtLb(rec.baselineRate)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <label className="block">
            <span className="field-label">Reviewer rationale</span>
            <textarea
              className="field-input min-h-[110px]"
              value={review.rationale}
              onChange={(e) => onChange({ rationale: e.target.value })}
              placeholder="Field history, residue load, sidedress plan, anything that changed your call. The farmer will see this."
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn-primary" type="button" onClick={onApprove}>
              Approve recommendation
            </button>
            <button
              className="btn-accent"
              type="button"
              onClick={onApproveWithAdjustment}
            >
              Approve with adjusted rate
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={onRequestRevision}
            >
              Request a more conservative rate
            </button>
          </div>

          {reviewed ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-bold text-emerald-800">
                  Reviewed · {formatStatus(review.status)}
                </div>
                <span className="text-[11px] text-emerald-700">
                  {review.reviewedAt}
                </span>
              </div>
              <p className="mt-1 text-sm text-emerald-900">
                Stamped by {review.reviewerName || "agronomist"} (
                {review.reviewerLicense || "credential"}). Effective rate:{" "}
                <strong>
                  {fmtLb(
                    review.status === "approved_with_note"
                      ? review.adjustedRate ?? rec.recommendedRate
                      : rec.recommendedRate
                  )}
                </strong>
                {review.rationale ? (
                  <>
                    {" "}
                    — &ldquo;{review.rationale}&rdquo;
                  </>
                ) : null}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Review state is unsigned. Once stamped, the trial planner and
              outcome dashboard will use the reviewer-approved rate.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: AgronomistReview["status"];
}) {
  if (status === "approved") return <Badge tone="emerald">Approved</Badge>;
  if (status === "approved_with_note")
    return <Badge tone="terracotta">Approved · adjusted rate</Badge>;
  if (status === "needs_revision")
    return <Badge tone="rose">Revision requested</Badge>;
  return <Badge tone="amber">Awaiting review</Badge>;
}

function formatStatus(s: AgronomistReview["status"]) {
  if (s === "approved") return "Approved as recommended";
  if (s === "approved_with_note") return "Approved with adjusted rate";
  if (s === "needs_revision") return "More conservative rate requested";
  return "Awaiting review";
}

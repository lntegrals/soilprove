"use client";

import { useCallback, useMemo, useState } from "react";
import { ALT_FIELDS, DEFAULT_FIELD } from "@/lib/demo-data";
import {
  AgronomistReview,
  FieldIntake,
  OutcomeData,
  TrialPlan,
} from "@/lib/types";
import {
  buildDefaultTrialPlan,
  buildPeerCohort,
  calculateRecommendation,
  summarizeOutcome,
} from "@/lib/recommend";
import { MobileTabs, StepId, Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { IntakePanel } from "@/components/IntakePanel";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { PeerEvidencePanel } from "@/components/PeerEvidencePanel";
import { AgronomistPanel } from "@/components/AgronomistPanel";
import { TrialPlannerPanel } from "@/components/TrialPlannerPanel";
import { OutcomePanel } from "@/components/OutcomePanel";
import { HonestyFooter } from "@/components/HonestyFooter";
import { FlowFooter } from "@/components/FlowFooter";

const DEFAULT_REVIEW: AgronomistReview = {
  status: "pending",
  reviewerName: "J. Reyes, CCA",
  reviewerLicense: "CCA #4413 — IA / IL",
  rationale:
    "Field history fits the cohort. Comfortable with the recommendation on a trial strip first.",
};

export default function Page() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [intake, setIntake] = useState<FieldIntake>(DEFAULT_FIELD);
  const [review, setReview] = useState<AgronomistReview>(DEFAULT_REVIEW);
  const [trialOverride, setTrialOverride] = useState<Partial<TrialPlan>>({});
  const [outcomeOverride, setOutcomeOverride] = useState<Partial<OutcomeData>>(
    {}
  );
  const [step, setStep] = useState<StepId>("intake");

  const rec = useMemo(() => calculateRecommendation(intake), [intake]);
  const cohort = useMemo(() => buildPeerCohort(intake, rec), [intake, rec]);

  const effectiveRate = useMemo(() => {
    if (review.status === "approved_with_note" && review.adjustedRate != null) {
      return review.adjustedRate;
    }
    if (review.status === "needs_revision") {
      // Halfway back toward the farmer's plan as a conservative ask.
      return Math.round((rec.recommendedRate + intake.currentNRate) / 2);
    }
    return rec.recommendedRate;
  }, [review, rec, intake.currentNRate]);

  const trial = useMemo<TrialPlan>(() => {
    const base = buildDefaultTrialPlan(intake, rec);
    const withApprovedRate: TrialPlan = { ...base, trialRate: effectiveRate };
    return { ...withApprovedRate, ...trialOverride };
  }, [intake, rec, effectiveRate, trialOverride]);

  const outcome = useMemo<OutcomeData>(() => {
    const seededAppliedTrial = trial.trialRate;
    const seededAppliedControl = trial.controlRate;
    const seededYieldControl = rec.expectedYield - 1.2;
    const seededYieldTrial = rec.expectedYield + 0.7;

    const merged: OutcomeData = {
      reported: true,
      appliedRateTrial:
        outcomeOverride.appliedRateTrial ?? seededAppliedTrial,
      appliedRateControl:
        outcomeOverride.appliedRateControl ?? seededAppliedControl,
      yieldTrial: outcomeOverride.yieldTrial ?? seededYieldTrial,
      yieldControl: outcomeOverride.yieldControl ?? seededYieldControl,
      fertilizerSpendActual: 0,
      fertilizerSpendBaseline: 0,
      marginDelta: 0,
      verdict: "inconclusive",
      verdictNote: "",
    };

    const sum = summarizeOutcome({
      trial,
      trialYield: merged.yieldTrial,
      controlYield: merged.yieldControl,
      trialAppliedRate: merged.appliedRateTrial,
      controlAppliedRate: merged.appliedRateControl,
      cornPrice: intake.cornPrice,
      nitrogenPrice: intake.nitrogenPrice,
    });

    return {
      ...merged,
      fertilizerSpendActual: sum.fertilizerSpendActual,
      fertilizerSpendBaseline: sum.fertilizerSpendBaseline,
      marginDelta: sum.marginDelta,
      verdict: sum.verdict,
      verdictNote: sum.verdictNote,
    };
  }, [trial, rec, outcomeOverride, intake.cornPrice, intake.nitrogenPrice]);

  const onLoadScenario = useCallback((idx: number) => {
    setScenarioIndex(idx);
    setIntake(ALT_FIELDS[idx]);
    setReview(DEFAULT_REVIEW);
    setTrialOverride({});
    setOutcomeOverride({});
  }, []);

  const onIntakeChange = useCallback((patch: Partial<FieldIntake>) => {
    setIntake((prev) => ({ ...prev, ...patch }));
  }, []);

  const onReviewChange = useCallback((patch: Partial<AgronomistReview>) => {
    setReview((prev) => ({ ...prev, ...patch }));
  }, []);

  const onApprove = useCallback(() => {
    setReview((prev) => ({
      ...prev,
      status: "approved",
      reviewedAt: new Date().toLocaleDateString(),
      adjustedRate: undefined,
    }));
  }, []);

  const onApproveWithAdjustment = useCallback(() => {
    setReview((prev) => ({
      ...prev,
      status: "approved_with_note",
      reviewedAt: new Date().toLocaleDateString(),
    }));
  }, []);

  const onRequestRevision = useCallback(() => {
    setReview((prev) => ({
      ...prev,
      status: "needs_revision",
      reviewedAt: new Date().toLocaleDateString(),
    }));
  }, []);

  const onTrialChange = useCallback((patch: Partial<TrialPlan>) => {
    setTrialOverride((prev) => ({ ...prev, ...patch }));
  }, []);

  const onOutcomeChange = useCallback((patch: Partial<OutcomeData>) => {
    setOutcomeOverride((prev) => ({ ...prev, ...patch }));
  }, []);

  const onOutcomeReset = useCallback(() => {
    setOutcomeOverride({});
  }, []);

  const onDownloadCsv = useCallback(() => {
    const rows = [
      ["field", intake.fieldName],
      ["county", `${intake.county}, ${intake.state}`],
      ["total_acres", intake.acres.toString()],
      ["previous_crop", intake.previousCrop],
      ["soil_type", intake.soilType],
      ["current_rate_lb_per_ac", intake.currentNRate.toString()],
      ["soilprove_rate_lb_per_ac", rec.recommendedRate.toString()],
      ["effective_rate_lb_per_ac", effectiveRate.toString()],
      ["trial_acres", trial.trialAcres.toString()],
      ["control_acres", trial.controlAcres.toString()],
      ["control_rate", trial.controlRate.toString()],
      ["trial_rate", trial.trialRate.toString()],
      ["corn_price", intake.cornPrice.toFixed(2)],
      ["nitrogen_price", intake.nitrogenPrice.toFixed(2)],
      [
        "expected_fertilizer_savings_trial",
        (
          (trial.controlRate - trial.trialRate) *
          intake.nitrogenPrice *
          trial.trialAcres
        ).toFixed(2),
      ],
      ["reviewer_name", review.reviewerName],
      ["reviewer_license", review.reviewerLicense],
      ["review_status", review.status],
      ["reviewer_rationale", JSON.stringify(review.rationale)],
      ["agronomy_basis", "MRTN-style reference + demo adjustments"],
      ["note", "Prototype demo. Modeled evidence. Not real customer data."],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${intake.fieldName.replace(/\s+/g, "_")}_trial_plan.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [intake, rec, effectiveRate, trial, review]);

  const onStepChange = useCallback((s: StepId) => {
    setStep(s);
    if (typeof window !== "undefined") {
      const el = document.getElementById(`section-${s}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return (
    <main>
      <Topbar step={step} onStepChange={onStepChange} />
      <Hero
        intake={intake}
        rec={rec}
        effectiveRate={effectiveRate}
        onStart={() => onStepChange("intake")}
        reviewStamped={review.status !== "pending"}
      />
      <MobileTabs step={step} onStepChange={onStepChange} />

      <div className="container-page space-y-10 py-10">
        <div id="section-intake" className="scroll-mt-24">
          <IntakePanel
            intake={intake}
            onChange={onIntakeChange}
            onLoadScenario={onLoadScenario}
            scenarioIndex={scenarioIndex}
          />
          <div className="mt-4">
            <FlowFooter step="intake" onStepChange={onStepChange} />
          </div>
        </div>

        <div id="section-recommendation" className="scroll-mt-24">
          <RecommendationPanel
            intake={intake}
            rec={rec}
            effectiveRate={effectiveRate}
            reviewerAdjusted={
              review.status === "approved_with_note" ||
              review.status === "needs_revision"
            }
          />
          <div className="mt-4">
            <FlowFooter step="recommendation" onStepChange={onStepChange} />
          </div>
        </div>

        <div id="section-evidence" className="scroll-mt-24">
          <PeerEvidencePanel intake={intake} rec={rec} cohort={cohort} />
          <div className="mt-4">
            <FlowFooter step="evidence" onStepChange={onStepChange} />
          </div>
        </div>

        <div id="section-review" className="scroll-mt-24">
          <AgronomistPanel
            rec={rec}
            review={review}
            onChange={onReviewChange}
            onApprove={onApprove}
            onApproveWithAdjustment={onApproveWithAdjustment}
            onRequestRevision={onRequestRevision}
          />
          <div className="mt-4">
            <FlowFooter step="review" onStepChange={onStepChange} />
          </div>
        </div>

        <div id="section-trial" className="scroll-mt-24">
          <TrialPlannerPanel
            intake={intake}
            rec={rec}
            trial={trial}
            effectiveRate={effectiveRate}
            onChange={onTrialChange}
            onDownloadCsv={onDownloadCsv}
          />
          <div className="mt-4">
            <FlowFooter step="trial" onStepChange={onStepChange} />
          </div>
        </div>

        <div id="section-outcome" className="scroll-mt-24">
          <OutcomePanel
            intake={intake}
            rec={rec}
            trial={trial}
            outcome={outcome}
            onChange={onOutcomeChange}
            onReset={onOutcomeReset}
          />
          <div className="mt-4">
            <FlowFooter step="outcome" onStepChange={onStepChange} />
          </div>
        </div>
      </div>

      <HonestyFooter />

      <footer className="border-t border-slate-100 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-slate-500">
          <span>
            SoilProve · Vibeathon prototype. Built to demo the
            decision-confidence thesis, not for production agronomy.
          </span>
          <span>
            Tagline:{" "}
            <span className="font-semibold text-slate-700">
              Prove what your soil data is worth.
            </span>
          </span>
        </div>
      </footer>
    </main>
  );
}

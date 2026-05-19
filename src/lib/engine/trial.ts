import { FieldInputs, Recommendation, TrialPlan } from "../types";

export function defaultTrialPlan(
  inputs: FieldInputs,
  rec: Recommendation,
  effectiveRate: number
): TrialPlan {
  const trialAcres = Math.max(8, Math.round(inputs.acres * 0.25));
  const controlAcres = trialAcres;
  return {
    trialAcres,
    controlAcres,
    controlRate: rec.baselineRate,
    trialRate: effectiveRate,
    successMetrics: [
      "Fertilizer spend per acre (trial vs control)",
      "Combine yield monitor delta",
      "Net margin per acre after harvest",
    ],
    notes:
      "Run the trial strip beside a control strip at the farmer's normal rate. Keep all other inputs identical.",
  };
}

export function trialEconomics(
  trial: TrialPlan,
  nitrogenPrice: number,
  cornPrice: number,
  yieldDelta: number = 0
) {
  const fertilizerSpendBaseline = trial.controlRate * nitrogenPrice * trial.trialAcres;
  const fertilizerSpendTrial = trial.trialRate * nitrogenPrice * trial.trialAcres;
  const fertilizerSavings = fertilizerSpendBaseline - fertilizerSpendTrial;
  const yieldRevenueDelta = yieldDelta * cornPrice * trial.trialAcres;
  return {
    fertilizerSpendBaseline,
    fertilizerSpendTrial,
    fertilizerSavings,
    yieldRevenueDelta,
    marginDelta: fertilizerSavings + yieldRevenueDelta,
  };
}

export function summarizeOutcome(args: {
  trial: TrialPlan;
  yieldTrial: number;
  yieldControl: number;
  appliedRateTrial: number;
  appliedRateControl: number;
  cornPrice: number;
  nitrogenPrice: number;
}) {
  const acres = args.trial.trialAcres;
  const fertSpendActual = args.appliedRateTrial * args.nitrogenPrice * acres;
  const fertSpendBaseline = args.appliedRateControl * args.nitrogenPrice * acres;
  const fertSavings = fertSpendBaseline - fertSpendActual;
  const yieldDelta = args.yieldTrial - args.yieldControl;
  const yieldRevenueDelta = yieldDelta * args.cornPrice * acres;
  const marginDelta = fertSavings + yieldRevenueDelta;

  let verdict: "validated" | "inconclusive" | "needs_more_data" = "inconclusive";
  let note =
    "Margin moved, but inside the modeled noise band — run another season before scaling.";

  if (marginDelta > 8 * acres && yieldDelta > -2) {
    verdict = "validated";
    note = "Fertilizer down, yield held — margin improvement clears the noise band.";
  } else if (yieldDelta < -4) {
    verdict = "needs_more_data";
    note = "Yield drop exceeds the comfort band. Walk the field before repeating.";
  }

  return {
    fertSpendActual,
    fertSpendBaseline,
    fertSavings,
    yieldDelta,
    yieldRevenueDelta,
    marginDelta,
    verdict,
    note,
  };
}

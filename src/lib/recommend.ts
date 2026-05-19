import {
  FieldIntake,
  Recommendation,
  RecommendationFactor,
  PeerCohort,
  TrialPlan,
} from "./types";

// MRTN-inspired baseline. NOT a production agronomic model.
// We start from a reference rate, then apply transparent additive adjustments
// from previous crop, residual N, and a seasonal scenario.
const BASE_MRTN_RATE = 165; // lb N / acre — corn-after-soybeans reference

const PREVIOUS_CROP_DELTA: Record<FieldIntake["previousCrop"], number> = {
  soybeans: 0,
  corn: 35, // corn-on-corn typically needs more N
  small_grain: 10,
  alfalfa: -30,
};

const RESIDUAL_N_DELTA: Record<FieldIntake["residualN"], number> = {
  low: 12,
  medium: 0,
  high: -22,
};

const WEATHER_DELTA: Record<FieldIntake["weather"], number> = {
  normal: 0,
  wet_spring: 14, // denitrification / leaching risk
  dry_spring: -8,
  cool_late: 6,
};

const PREVIOUS_CROP_LABELS: Record<FieldIntake["previousCrop"], string> = {
  soybeans: "Soybeans last year",
  corn: "Corn-on-corn rotation",
  small_grain: "Small grain last year",
  alfalfa: "Alfalfa last year",
};

const RESIDUAL_N_LABELS: Record<FieldIntake["residualN"], string> = {
  low: "Low residual soil N",
  medium: "Typical residual soil N",
  high: "Elevated residual soil N",
};

const WEATHER_LABELS: Record<FieldIntake["weather"], string> = {
  normal: "Normal seasonal outlook",
  wet_spring: "Wet spring — leaching risk",
  dry_spring: "Dry spring — lower loss risk",
  cool_late: "Cool, late planting",
};

export function calculateRecommendation(intake: FieldIntake): Recommendation {
  const factors: RecommendationFactor[] = [];

  const cropDelta = PREVIOUS_CROP_DELTA[intake.previousCrop];
  factors.push({
    label: PREVIOUS_CROP_LABELS[intake.previousCrop],
    delta: cropDelta,
    rationale:
      intake.previousCrop === "soybeans"
        ? "Soybean credit already built into the MRTN reference rate."
        : intake.previousCrop === "corn"
        ? "Corn-on-corn fields typically need additional N to offset residue tie-up."
        : intake.previousCrop === "alfalfa"
        ? "Alfalfa provides a meaningful N credit from prior legume biomass."
        : "Small grain residue contributes a modest N drawdown.",
  });

  const residualDelta = RESIDUAL_N_DELTA[intake.residualN];
  factors.push({
    label: RESIDUAL_N_LABELS[intake.residualN],
    delta: residualDelta,
    rationale:
      intake.residualN === "high"
        ? "Higher residual N reduces top-up needs without sacrificing yield."
        : intake.residualN === "low"
        ? "Lower residual N requires modest top-up to stay on the MRTN curve."
        : "Residual N is in the typical range for this region.",
  });

  const weatherDelta = WEATHER_DELTA[intake.weather];
  factors.push({
    label: WEATHER_LABELS[intake.weather],
    delta: weatherDelta,
    rationale:
      intake.weather === "wet_spring"
        ? "Wet conditions raise denitrification and leaching risk — split application is safer."
        : intake.weather === "dry_spring"
        ? "Drier conditions reduce loss risk and let us trim slightly."
        : intake.weather === "cool_late"
        ? "Cool, late starts slow mineralization — small bump keeps yield curve intact."
        : "No weather-driven adjustment applied.",
  });

  // Price ratio nudge — when N is expensive relative to corn, MRTN curve pulls down.
  // For demo we surface this as a transparent factor when it materially changes the rate.
  const priceRatio = intake.nitrogenPrice / intake.cornPrice;
  let priceDelta = 0;
  if (priceRatio >= 0.18) {
    priceDelta = -8;
    factors.push({
      label: "High N-to-corn price ratio",
      delta: priceDelta,
      rationale:
        "When N is expensive relative to corn, the economic optimum shifts down the MRTN curve.",
    });
  } else if (priceRatio <= 0.08) {
    priceDelta = 6;
    factors.push({
      label: "Low N-to-corn price ratio",
      delta: priceDelta,
      rationale:
        "Cheaper N relative to corn lets the economic optimum sit slightly higher.",
    });
  }

  const totalDelta = cropDelta + residualDelta + weatherDelta + priceDelta;
  const recommendedRate = Math.max(
    100,
    Math.min(260, Math.round(BASE_MRTN_RATE + totalDelta))
  );

  const baselineRate = intake.currentNRate;
  const rateDiffPerAcre = baselineRate - recommendedRate;
  const perAcreSavings = rateDiffPerAcre * intake.nitrogenPrice;
  const totalSavings = perAcreSavings * intake.acres;

  // Modeled yield expectation: assume MRTN curve sits flat-ish near the recommended rate.
  // Use a simple parabolic penalty for distance away from the recommended rate, plus
  // a small drag when residual N is mismatched with the applied rate.
  const expectedYield = estimateYield(recommendedRate, recommendedRate, intake);
  const yieldLow = expectedYield - 6;
  const yieldHigh = expectedYield + 6;

  let confidence: Recommendation["confidence"] = "moderate";
  let confidenceReason =
    "Inputs are within the modeled range for Midwest corn after soybeans.";
  const farFromMrtn = Math.abs(recommendedRate - BASE_MRTN_RATE) > 35;
  if (intake.previousCrop === "soybeans" && intake.weather === "normal" && !farFromMrtn) {
    confidence = "high";
    confidenceReason =
      "Inputs line up cleanly with the MRTN reference scenario for this region.";
  } else if (farFromMrtn || intake.weather === "wet_spring") {
    confidence = "moderate";
    confidenceReason =
      "Conditions push the rate away from the regional reference — peer-validate before applying fleet-wide.";
  }
  if (intake.acres < 40) {
    confidence = "low";
    confidenceReason =
      "Small field size means low statistical power on outcome tracking — trial it but treat the savings number as illustrative.";
  }

  return {
    baselineRate,
    recommendedRate,
    baseMrtnRate: BASE_MRTN_RATE,
    factors,
    perAcreSavings,
    totalSavings,
    expectedYield,
    expectedYieldRange: [yieldLow, yieldHigh],
    confidence,
    confidenceReason,
  };
}

function estimateYield(
  appliedRate: number,
  optimalRate: number,
  intake: FieldIntake
): number {
  const distance = appliedRate - optimalRate;
  // Quadratic penalty centered on the optimum, scaled so 30 lb off ≈ 4 bu/ac drop.
  const yieldPenalty = (distance * distance) / 220;
  const base = 198; // bu/ac modeled yield for a healthy corn-after-soybeans Midwest field
  const cropAdj = intake.previousCrop === "corn" ? -6 : 0;
  const weatherAdj =
    intake.weather === "wet_spring"
      ? -3
      : intake.weather === "dry_spring"
      ? -5
      : intake.weather === "cool_late"
      ? -2
      : 0;
  return Math.round((base + cropAdj + weatherAdj - yieldPenalty) * 10) / 10;
}

// "Peer cohort" — clearly labeled as modeled / prototype evidence.
export function buildPeerCohort(
  intake: FieldIntake,
  rec: Recommendation
): PeerCohort {
  const isCornBean = intake.previousCrop === "soybeans";
  const sameRegion = ["IA", "IL", "IN"].includes(intake.state);

  let scenarioCount = 38;
  let confidenceBadge: PeerCohort["confidenceBadge"] = "Modeled — moderate match";
  let cohortNote =
    "Modeled cohort built from MRTN reference scenarios plus synthetic peer profiles. Demo only — not real customer data.";

  if (isCornBean && sameRegion && intake.weather === "normal") {
    scenarioCount = 72;
    confidenceBadge = "Modeled — strong match";
    cohortNote =
      "Modeled peer cohort closely resembles your county, soil profile, and rotation. Demo only — not real customer data.";
  } else if (!sameRegion || intake.previousCrop === "alfalfa") {
    scenarioCount = 18;
    confidenceBadge = "Modeled — limited match";
    cohortNote =
      "Fewer modeled scenarios closely match this rotation — treat the cohort number as illustrative. Demo only — not real customer data.";
  }

  const avgReduction = Math.max(0, Math.round(rec.baselineRate - rec.recommendedRate));
  const avgMargin = Math.round(rec.perAcreSavings * 0.9);
  const yieldDeltaRange: [number, number] = [-1.5, 2.5];

  return {
    scenarioCount,
    avgReductionLbPerAcre: avgReduction,
    avgMarginEffectPerAcre: avgMargin,
    yieldDeltaRange,
    confidenceBadge,
    cohortNote,
  };
}

export function buildDefaultTrialPlan(
  intake: FieldIntake,
  rec: Recommendation
): TrialPlan {
  const trialAcres = Math.max(8, Math.round(intake.acres * 0.25));
  const controlAcres = trialAcres;
  const fertilizerSpendBaseline = rec.baselineRate * intake.nitrogenPrice * trialAcres;
  const fertilizerSpendTrial = rec.recommendedRate * intake.nitrogenPrice * trialAcres;
  const expectedSavings = fertilizerSpendBaseline - fertilizerSpendTrial;

  return {
    enabled: true,
    trialAcres,
    controlAcres,
    controlRate: rec.baselineRate,
    trialRate: rec.recommendedRate,
    fertilizerSpendBaseline,
    fertilizerSpendTrial,
    expectedSavings,
    successMetrics: [
      "Fertilizer spend per acre on trial strip vs control strip",
      "Combine yield monitor delta (bu/ac) trial vs control",
      "Net margin per acre after harvest",
    ],
    notes:
      "Pick one comfortable field. Run the trial strip alongside a control strip at your normal rate. Keep all other inputs identical so the comparison is honest.",
  };
}

export function summarizeOutcome({
  trial,
  trialYield,
  controlYield,
  trialAppliedRate,
  controlAppliedRate,
  cornPrice,
  nitrogenPrice,
}: {
  trial: TrialPlan;
  trialYield: number;
  controlYield: number;
  trialAppliedRate: number;
  controlAppliedRate: number;
  cornPrice: number;
  nitrogenPrice: number;
}) {
  const acres = trial.trialAcres;
  const fertilizerSpendActual = trialAppliedRate * nitrogenPrice * acres;
  const fertilizerSpendBaseline = controlAppliedRate * nitrogenPrice * acres;
  const fertilizerSavings = fertilizerSpendBaseline - fertilizerSpendActual;
  const yieldDelta = trialYield - controlYield;
  const yieldRevenueDelta = yieldDelta * cornPrice * acres;
  const marginDelta = fertilizerSavings + yieldRevenueDelta;

  let verdict: "validated" | "inconclusive" | "needs_more_data" = "inconclusive";
  let verdictNote =
    "Margin moved, but inside the modeled noise band — run another season before scaling.";

  if (marginDelta > 8 * acres && yieldDelta > -2) {
    verdict = "validated";
    verdictNote =
      "Lower fertilizer spend and yield held — margin improvement clears the noise band.";
  } else if (yieldDelta < -4) {
    verdict = "needs_more_data";
    verdictNote =
      "Yield drop exceeds the comfort band. Walk the field with your agronomist before repeating.";
  }

  return {
    fertilizerSpendActual,
    fertilizerSpendBaseline,
    marginDelta,
    yieldDelta,
    verdict,
    verdictNote,
  };
}

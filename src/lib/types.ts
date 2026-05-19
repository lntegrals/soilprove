export type PreviousCrop = "soybeans" | "corn" | "small_grain" | "alfalfa";
export type WeatherScenario = "normal" | "wet_spring" | "dry_spring" | "cool_late";
export type ResidualNLevel = "low" | "medium" | "high";

export type FieldIntake = {
  fieldName: string;
  county: string;
  state: "IA" | "IL" | "IN" | "MO";
  acres: number;
  previousCrop: PreviousCrop;
  currentNRate: number; // lb N / acre, farmer's plan
  cornPrice: number; // $ / bushel
  nitrogenPrice: number; // $ / lb N
  residualN: ResidualNLevel;
  weather: WeatherScenario;
  soilType: string;
};

export type RecommendationFactor = {
  label: string;
  delta: number; // lb N / acre adjustment
  rationale: string;
};

export type Recommendation = {
  baselineRate: number;
  recommendedRate: number;
  baseMrtnRate: number;
  factors: RecommendationFactor[];
  perAcreSavings: number; // $ / acre (positive = savings vs current plan)
  totalSavings: number; // $ across field
  expectedYield: number; // bu/acre
  expectedYieldRange: [number, number];
  confidence: "low" | "moderate" | "high";
  confidenceReason: string;
};

export type PeerCohort = {
  scenarioCount: number;
  avgReductionLbPerAcre: number;
  avgMarginEffectPerAcre: number;
  yieldDeltaRange: [number, number];
  confidenceBadge: "Modeled — strong match" | "Modeled — moderate match" | "Modeled — limited match";
  cohortNote: string;
};

export type AgronomistReviewStatus =
  | "pending"
  | "approved"
  | "needs_revision"
  | "approved_with_note";

export type AgronomistReview = {
  status: AgronomistReviewStatus;
  reviewerName: string;
  reviewerLicense: string;
  adjustedRate?: number;
  rationale: string;
  reviewedAt?: string;
};

export type TrialPlan = {
  enabled: boolean;
  trialAcres: number;
  controlAcres: number;
  controlRate: number;
  trialRate: number;
  fertilizerSpendBaseline: number;
  fertilizerSpendTrial: number;
  expectedSavings: number;
  successMetrics: string[];
  notes: string;
};

export type OutcomeData = {
  reported: boolean;
  appliedRateTrial: number;
  appliedRateControl: number;
  yieldTrial: number; // bu/acre
  yieldControl: number; // bu/acre
  fertilizerSpendActual: number;
  fertilizerSpendBaseline: number;
  marginDelta: number; // $ across trial acres
  verdict: "validated" | "inconclusive" | "needs_more_data";
  verdictNote: string;
};

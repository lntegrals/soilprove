// Core domain models for SoilProve.
// Strong typing across the entire app, including live external data shapes
// and the recommendation feature vector that a future ML model will consume.

export type State = "IA" | "IL" | "IN" | "MO" | "KS" | "NE" | "MN" | "WI" | "OH" | "KY";

export type PreviousCrop = "soybeans" | "corn" | "small_grain" | "alfalfa";
export type ResidualNLevel = "low" | "medium" | "high";

export type FieldLocation = {
  latitude: number;
  longitude: number;
  county?: string;
  state?: State | string;
  label?: string;
};

export type FieldInputs = {
  id: string;
  fieldName: string;
  acres: number;
  location: FieldLocation;
  previousCrop: PreviousCrop;
  currentNRate: number; // lb N / ac
  cornPrice: number;    // $ / bu
  nitrogenPrice: number; // $ / lb N
  residualN: ResidualNLevel;
  targetYield: number;   // bu/ac aspirational
  notes?: string;
};

// ---- Normalized USDA SSURGO soil profile ----
export type SoilTextureClass =
  | "sand" | "loamy sand" | "sandy loam" | "loam"
  | "silt loam" | "silt" | "sandy clay loam" | "clay loam"
  | "silty clay loam" | "sandy clay" | "silty clay" | "clay"
  | "unknown";

export type DrainageClass =
  | "Excessively drained"
  | "Somewhat excessively drained"
  | "Well drained"
  | "Moderately well drained"
  | "Somewhat poorly drained"
  | "Poorly drained"
  | "Very poorly drained"
  | "Unknown";

export type HydrologicGroup = "A" | "B" | "C" | "D" | "A/D" | "B/D" | "C/D" | "Unknown";

export type SoilProfile = {
  mapUnitKey?: string;
  mapUnitName: string;
  componentName: string;
  componentPct?: number;
  textureClass: SoilTextureClass;
  drainageClass: DrainageClass;
  hydrologicGroup: HydrologicGroup;
  organicMatterPct?: number;        // weighted, top 30cm
  availableWaterStorage?: number;   // cm, 0-150cm
  ksatUm?: number;                  // µm/s, surface
  taxonomy?: string;                // taxonomic class
  source: "ssurgo" | "fallback";
  fetchedAt: string;
};

// ---- Normalized National Weather Service forecast ----
export type DailyForecast = {
  date: string;          // YYYY-MM-DD
  tempHighF: number;
  tempLowF: number;
  precipProbPct: number; // 0-100
  shortForecast: string;
  windSpeed?: string;
};

export type WeatherProfile = {
  gridOffice?: string;
  gridX?: number;
  gridY?: number;
  forecastZone?: string;
  near: {
    nextRainProbPct: number;     // max 0..72h precip prob
    next7DayPrecipInches: number; // estimated
    avgHighF: number;
    avgLowF: number;
  };
  daily: DailyForecast[];
  source: "nws" | "fallback";
  fetchedAt: string;
  observedAt?: string;
};

// ---- Decision feature vector (ML-ready) ----
export type DecisionFeatures = {
  // user inputs
  acres: number;
  previousCrop: PreviousCrop;
  residualN: ResidualNLevel;
  currentNRate: number;
  cornPrice: number;
  nitrogenPrice: number;
  priceRatio: number;     // N price / corn price
  targetYield: number;

  // soil-derived
  textureClass: SoilTextureClass;
  drainageClass: DrainageClass;
  hydrologicGroup: HydrologicGroup;
  organicMatterPct: number;       // imputed if unknown
  availableWaterStorageCm: number;
  leachingPotential01: number;    // 0..1, derived
  denitPotential01: number;       // 0..1, derived

  // weather-derived
  nextRainProbPct: number;
  next7DayPrecipInches: number;
  weatherLossRisk01: number;      // 0..1

  // composite
  baseMrtnRate: number;           // regional reference
};

export type FactorImpact = {
  key: string;
  label: string;
  delta: number;        // lb N / ac contribution to recommendation
  rationale: string;
  category: "agronomy" | "soil" | "weather" | "economics";
};

export type Recommendation = {
  baselineRate: number;       // farmer's plan
  baseMrtnRate: number;       // regional reference
  recommendedRate: number;    // engine output
  factors: FactorImpact[];
  perAcreCostDelta: number;   // $/ac difference (positive = savings)
  totalCostDelta: number;     // $ field-wide
  expectedYield: number;
  yieldRange: [number, number];
  confidence: "low" | "moderate" | "high";
  confidenceScore: number;    // 0..1
  riskFlags: string[];
  explainer: string;          // one short sentence
};

// ---- Review / Trial / Outcome ----
export type ReviewStatus = "pending" | "approved" | "approved_with_note" | "needs_revision";

export type AgronomistReview = {
  status: ReviewStatus;
  reviewerName: string;
  reviewerLicense: string;
  adjustedRate?: number;
  rationale: string;
  reviewedAt?: string;
};

export type TrialPlan = {
  trialAcres: number;
  controlAcres: number;
  controlRate: number;
  trialRate: number;
  successMetrics: string[];
  notes: string;
};

export type OutcomeData = {
  reported: boolean;
  yieldTrial: number;
  yieldControl: number;
  appliedRateTrial: number;
  appliedRateControl: number;
  verdict: "validated" | "inconclusive" | "needs_more_data";
  marginDeltaDollars: number;
  note: string;
};

export type FieldState = {
  inputs: FieldInputs;
  soil?: SoilProfile;
  weather?: WeatherProfile;
  review?: AgronomistReview;
  trial?: Partial<TrialPlan>;
  outcome?: Partial<OutcomeData>;
  updatedAt: string;
};

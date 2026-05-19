// Feature extraction layer.
// Pure function: (FieldInputs, SoilProfile?, WeatherProfile?) -> DecisionFeatures
// Centralizing this means the recommendation engine, risk model, and any future
// ML predictor all consume the same typed feature vector.

import {
  DecisionFeatures,
  DrainageClass,
  FieldInputs,
  HydrologicGroup,
  PreviousCrop,
  SoilProfile,
  SoilTextureClass,
  WeatherProfile,
} from "../types";

// Regional baseline MRTN reference rate. Conservative midwestern average for
// corn-after-soybeans at typical price ratios. Used as the "where we start".
const REGIONAL_MRTN: Record<string, number> = {
  IA: 170,
  IL: 175,
  IN: 170,
  MO: 175,
  KS: 160,
  NE: 160,
  MN: 160,
  WI: 155,
  OH: 175,
  KY: 175,
  DEFAULT: 170,
};

// Texture -> leaching potential (0..1). Coarser soils leach more.
const TEXTURE_LEACHING: Record<SoilTextureClass, number> = {
  sand: 0.95,
  "loamy sand": 0.85,
  "sandy loam": 0.7,
  loam: 0.45,
  "silt loam": 0.35,
  silt: 0.3,
  "sandy clay loam": 0.5,
  "clay loam": 0.25,
  "silty clay loam": 0.2,
  "sandy clay": 0.3,
  "silty clay": 0.15,
  clay: 0.15,
  unknown: 0.4,
};

// Drainage -> denitrification potential (0..1). Wetter soils denitrify more.
const DRAINAGE_DENIT: Record<DrainageClass, number> = {
  "Excessively drained": 0.05,
  "Somewhat excessively drained": 0.1,
  "Well drained": 0.2,
  "Moderately well drained": 0.35,
  "Somewhat poorly drained": 0.55,
  "Poorly drained": 0.75,
  "Very poorly drained": 0.85,
  Unknown: 0.4,
};

const HYDRO_RUNOFF: Record<HydrologicGroup, number> = {
  A: 0.1,
  B: 0.25,
  C: 0.5,
  D: 0.8,
  "A/D": 0.6,
  "B/D": 0.65,
  "C/D": 0.7,
  Unknown: 0.4,
};

// Imputation when SSURGO is unavailable.
const DEFAULTS = {
  organicMatterPct: 2.6,
  availableWaterStorageCm: 22,
};

function getMrtn(state?: string): number {
  if (!state) return REGIONAL_MRTN.DEFAULT;
  return REGIONAL_MRTN[state] ?? REGIONAL_MRTN.DEFAULT;
}

export function extractFeatures(
  inputs: FieldInputs,
  soil?: SoilProfile,
  weather?: WeatherProfile
): DecisionFeatures {
  const texture: SoilTextureClass = soil?.textureClass ?? "silt loam";
  const drainage: DrainageClass = soil?.drainageClass ?? "Moderately well drained";
  const hydro: HydrologicGroup = soil?.hydrologicGroup ?? "B";

  const om = soil?.organicMatterPct ?? DEFAULTS.organicMatterPct;
  const aws = soil?.availableWaterStorage ?? DEFAULTS.availableWaterStorageCm;

  const leaching = clamp01(
    TEXTURE_LEACHING[texture] * 0.7 + HYDRO_RUNOFF[hydro] * 0.3 - (om - 2) * 0.04
  );
  const denit = clamp01(
    DRAINAGE_DENIT[drainage] + (texture === "clay" || texture === "silty clay" ? 0.1 : 0)
  );

  const nextRain = weather?.near.nextRainProbPct ?? 30;
  const precip7 = weather?.near.next7DayPrecipInches ?? 0.5;

  // Combine into a 0..1 weather-loss-risk signal.
  // High near-term rain probability * a leaching/denit-prone soil = elevated risk.
  const rainPressure = clamp01(nextRain / 100 * 0.55 + precip7 / 2.5 * 0.45);
  const weatherLossRisk = clamp01(rainPressure * (0.55 + 0.45 * Math.max(leaching, denit)));

  const priceRatio = inputs.nitrogenPrice / inputs.cornPrice;

  return {
    acres: inputs.acres,
    previousCrop: inputs.previousCrop,
    residualN: inputs.residualN,
    currentNRate: inputs.currentNRate,
    cornPrice: inputs.cornPrice,
    nitrogenPrice: inputs.nitrogenPrice,
    priceRatio,
    targetYield: inputs.targetYield,
    textureClass: texture,
    drainageClass: drainage,
    hydrologicGroup: hydro,
    organicMatterPct: om,
    availableWaterStorageCm: aws,
    leachingPotential01: round3(leaching),
    denitPotential01: round3(denit),
    nextRainProbPct: Math.round(nextRain),
    next7DayPrecipInches: Math.round(precip7 * 100) / 100,
    weatherLossRisk01: round3(weatherLossRisk),
    baseMrtnRate: getMrtn(inputs.location.state as string | undefined),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function previousCropDelta(c: PreviousCrop): number {
  switch (c) {
    case "soybeans":
      return 0;
    case "corn":
      return 35;
    case "small_grain":
      return 10;
    case "alfalfa":
      return -30;
  }
}

export function residualNDelta(r: FieldInputs["residualN"]): number {
  switch (r) {
    case "low":
      return 12;
    case "medium":
      return 0;
    case "high":
      return -22;
  }
}

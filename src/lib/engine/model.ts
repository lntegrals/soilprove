// Recommendation model.
// Defines a clean RecommendationModel interface so a future ML predictor
// (gradient-boosted yield response surface, etc.) can drop in cleanly.
// For Prompt 2, the default implementation is a transparent additive
// heuristic over the extracted feature vector.

import {
  DecisionFeatures,
  FactorImpact,
  FieldInputs,
  Recommendation,
  SoilProfile,
  WeatherProfile,
} from "../types";
import { extractFeatures, previousCropDelta, residualNDelta } from "./features";

export interface RecommendationModel {
  /** Stable name shown in /method and provenance metadata. */
  readonly name: string;
  /** Semantic version for traceability when a model is updated. */
  readonly version: string;
  /** Whether predictions come from an ML model or transparent rules. */
  readonly modelClass: "heuristic" | "statistical" | "ml";
  /** Pure function: features -> recommendation. */
  recommend(features: DecisionFeatures, inputs: FieldInputs): Recommendation;
}

// --- Default heuristic implementation ---

const PREVIOUS_CROP_LABELS = {
  soybeans: "Soybean rotation credit",
  corn: "Corn-on-corn rotation",
  small_grain: "Small grain previous crop",
  alfalfa: "Alfalfa rotation credit",
} as const;

const RESIDUAL_N_LABELS = {
  low: "Low residual soil N",
  medium: "Typical residual soil N",
  high: "Elevated residual soil N",
} as const;

class HeuristicModel implements RecommendationModel {
  readonly name = "SoilProve Baseline Heuristic";
  readonly version = "0.2.0";
  readonly modelClass = "heuristic" as const;

  recommend(f: DecisionFeatures, inputs: FieldInputs): Recommendation {
    const factors: FactorImpact[] = [];

    // --- Agronomy: previous crop ---
    const cropDelta = previousCropDelta(f.previousCrop);
    factors.push({
      key: "previous_crop",
      label: PREVIOUS_CROP_LABELS[f.previousCrop],
      delta: cropDelta,
      category: "agronomy",
      rationale:
        f.previousCrop === "soybeans"
          ? "Soybean credit already built into the regional reference."
          : f.previousCrop === "corn"
          ? "Corn-on-corn fields need more N to offset residue tie-up."
          : f.previousCrop === "alfalfa"
          ? "Legume biomass leaves a meaningful N credit."
          : "Small grain residue contributes a modest drawdown.",
    });

    // --- Agronomy: residual N ---
    const residualDelta = residualNDelta(f.residualN);
    factors.push({
      key: "residual_n",
      label: RESIDUAL_N_LABELS[f.residualN],
      delta: residualDelta,
      category: "agronomy",
      rationale:
        f.residualN === "high"
          ? "Higher residual N reduces top-up without sacrificing yield."
          : f.residualN === "low"
          ? "Lower residual N requires top-up to stay on the response curve."
          : "Residual N is in the typical range.",
    });

    // --- Soil: organic matter contribution ---
    // Higher OM mineralizes more N during the season.
    const omDelta = roundInt((f.organicMatterPct - 2.5) * -6); // ~ -6 lb per 1% above reference
    if (Math.abs(omDelta) >= 2) {
      factors.push({
        key: "organic_matter",
        label: `${f.organicMatterPct.toFixed(1)}% organic matter`,
        delta: omDelta,
        category: "soil",
        rationale:
          omDelta < 0
            ? "Higher organic matter mineralizes additional N, trimming fertilizer need."
            : "Lower organic matter offers less seasonal N release.",
      });
    }

    // --- Soil: drainage / texture loss risk ---
    const lossRisk = (f.leachingPotential01 + f.denitPotential01) / 2;
    let lossDelta = 0;
    if (lossRisk >= 0.55) lossDelta = 12;
    else if (lossRisk >= 0.4) lossDelta = 6;
    else if (lossRisk <= 0.18) lossDelta = -4;
    if (lossDelta !== 0) {
      factors.push({
        key: "soil_loss_risk",
        label: `${textureWord(f.textureClass)} · ${f.drainageClass.toLowerCase()}`,
        delta: lossDelta,
        category: "soil",
        rationale:
          lossDelta > 0
            ? "Loss-prone profile. Buffer slightly and prefer split application."
            : "Loss-tolerant profile. Efficient soils let us trim a bit.",
      });
    }

    // --- Weather: rain/loss risk ---
    let weatherDelta = 0;
    if (f.weatherLossRisk01 >= 0.55) weatherDelta = 10;
    else if (f.weatherLossRisk01 >= 0.35) weatherDelta = 5;
    else if (f.weatherLossRisk01 <= 0.15) weatherDelta = -3;
    if (weatherDelta !== 0) {
      factors.push({
        key: "weather_loss_risk",
        label:
          f.nextRainProbPct >= 60
            ? "Wet near-term forecast"
            : f.nextRainProbPct >= 30
            ? "Mixed near-term forecast"
            : "Dry near-term forecast",
        delta: weatherDelta,
        category: "weather",
        rationale:
          weatherDelta > 0
            ? "Forecast precipitation raises leaching and denitrification risk. Favor a split or stabilizer."
            : "Dry near-term outlook lowers loss risk modestly.",
      });
    }

    // --- Economics: price ratio nudge ---
    let priceDelta = 0;
    if (f.priceRatio >= 0.18) priceDelta = -8;
    else if (f.priceRatio <= 0.08) priceDelta = 6;
    if (priceDelta !== 0) {
      factors.push({
        key: "price_ratio",
        label: priceDelta < 0 ? "High N : corn price ratio" : "Low N : corn price ratio",
        delta: priceDelta,
        category: "economics",
        rationale:
          priceDelta < 0
            ? "Expensive N shifts the economic optimum down the curve."
            : "Cheaper N lets the economic optimum sit slightly higher.",
      });
    }

    const sumDelta = factors.reduce((s, x) => s + x.delta, 0);
    const recommendedRate = clamp(Math.round(f.baseMrtnRate + sumDelta), 100, 260);

    const baselineRate = inputs.currentNRate;
    const perAcreCostDelta = (baselineRate - recommendedRate) * inputs.nitrogenPrice;
    const totalCostDelta = perAcreCostDelta * inputs.acres;

    const expectedYield = yieldEstimate(recommendedRate, recommendedRate, f);
    const yieldRange: [number, number] = [
      Math.round((expectedYield - 6) * 10) / 10,
      Math.round((expectedYield + 6) * 10) / 10,
    ];

    const { confidence, score, flags } = confidenceFor(f, recommendedRate);

    const explainer = buildExplainer(f, factors, recommendedRate, baselineRate);

    return {
      baselineRate,
      baseMrtnRate: f.baseMrtnRate,
      recommendedRate,
      factors,
      perAcreCostDelta,
      totalCostDelta,
      expectedYield,
      yieldRange,
      confidence,
      confidenceScore: score,
      riskFlags: flags,
      explainer,
    };
  }
}

function buildExplainer(
  f: DecisionFeatures,
  factors: FactorImpact[],
  rec: number,
  baseline: number
) {
  const diff = baseline - rec;
  const top = [...factors]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2)
    .map((x) => x.label.toLowerCase())
    .join(" and ");
  if (Math.abs(diff) < 5) {
    return `Confirms your plan near the regional reference. ${capitalize(top)} are the main drivers.`;
  }
  if (diff > 0) {
    return `Trims ${Math.round(diff)} lb/ac vs your plan. ${capitalize(top)} carry the move.`;
  }
  return `Bumps ${Math.abs(Math.round(diff))} lb/ac above your plan. ${capitalize(top)} drive the increase.`;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function confidenceFor(f: DecisionFeatures, rec: number): {
  confidence: Recommendation["confidence"];
  score: number;
  flags: string[];
} {
  const flags: string[] = [];
  let score = 0.85; // start optimistic
  const offRef = Math.abs(rec - f.baseMrtnRate);
  if (offRef > 35) {
    score -= 0.2;
    flags.push("Rate moved far from regional reference");
  }
  if (f.weatherLossRisk01 >= 0.55) {
    score -= 0.12;
    flags.push("Near-term loss risk elevated");
  }
  if (f.leachingPotential01 >= 0.7) {
    score -= 0.08;
    flags.push("Coarse / leachy soil profile");
  }
  if (f.acres < 40) {
    score -= 0.1;
    flags.push("Small field, outcome tracking noisier");
  }
  if (f.previousCrop === "soybeans" && f.weatherLossRisk01 < 0.3) {
    score += 0.05;
  }
  score = Math.max(0.1, Math.min(0.98, score));
  const confidence: Recommendation["confidence"] =
    score >= 0.78 ? "high" : score >= 0.55 ? "moderate" : "low";
  return { confidence, score, flags };
}

function yieldEstimate(applied: number, optimal: number, f: DecisionFeatures): number {
  const distance = applied - optimal;
  const yieldPenalty = (distance * distance) / 220;
  let base = 198;
  if (f.previousCrop === "corn") base -= 6;
  if (f.weatherLossRisk01 > 0.55) base -= 3;
  if (f.organicMatterPct >= 3.2) base += 2;
  if (f.organicMatterPct < 1.8) base -= 4;
  if (f.availableWaterStorageCm < 15) base -= 3;
  return Math.round((base - yieldPenalty) * 10) / 10;
}

function textureWord(t: DecisionFeatures["textureClass"]): string {
  if (t === "unknown") return "Soil";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundInt(n: number) {
  return Math.round(n);
}

// Exported singleton — easy to swap with a real model later.
export const recommendationModel: RecommendationModel = new HeuristicModel();

// Convenience: full pipeline from raw state.
export function runRecommendation(
  inputs: FieldInputs,
  soil?: SoilProfile,
  weather?: WeatherProfile
): { recommendation: Recommendation; features: DecisionFeatures } {
  const features = extractFeatures(inputs, soil, weather);
  const recommendation = recommendationModel.recommend(features, inputs);
  return { recommendation, features };
}

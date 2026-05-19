import { FieldIntake } from "./types";

export const DEFAULT_FIELD: FieldIntake = {
  fieldName: "North 80 — Holcomb",
  county: "Story",
  state: "IA",
  acres: 78,
  previousCrop: "soybeans",
  currentNRate: 195,
  cornPrice: 4.4,
  nitrogenPrice: 0.62,
  residualN: "medium",
  weather: "wet_spring",
  soilType: "Webster silty clay loam",
};

export const ALT_FIELDS: FieldIntake[] = [
  DEFAULT_FIELD,
  {
    fieldName: "South Pivot — Linn 12",
    county: "Linn",
    state: "IA",
    acres: 132,
    previousCrop: "corn",
    currentNRate: 220,
    cornPrice: 4.55,
    nitrogenPrice: 0.58,
    residualN: "low",
    weather: "normal",
    soilType: "Tama silty clay loam",
  },
  {
    fieldName: "River Bottoms — Champaign 4",
    county: "Champaign",
    state: "IL",
    acres: 96,
    previousCrop: "soybeans",
    currentNRate: 205,
    cornPrice: 4.3,
    nitrogenPrice: 0.71,
    residualN: "high",
    weather: "dry_spring",
    soilType: "Drummer silty clay loam",
  },
];

export const STATES: Array<{ value: FieldIntake["state"]; label: string }> = [
  { value: "IA", label: "Iowa" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "MO", label: "Missouri" },
];

export const PREVIOUS_CROP_OPTIONS: Array<{
  value: FieldIntake["previousCrop"];
  label: string;
}> = [
  { value: "soybeans", label: "Soybeans" },
  { value: "corn", label: "Corn (corn-on-corn)" },
  { value: "small_grain", label: "Small grain (oats/wheat)" },
  { value: "alfalfa", label: "Alfalfa" },
];

export const RESIDUAL_N_OPTIONS: Array<{
  value: FieldIntake["residualN"];
  label: string;
  hint: string;
}> = [
  { value: "low", label: "Low", hint: "Soil test under regional median" },
  { value: "medium", label: "Typical", hint: "Soil test near regional median" },
  { value: "high", label: "Elevated", hint: "Soil test above regional median" },
];

export const WEATHER_OPTIONS: Array<{
  value: FieldIntake["weather"];
  label: string;
  hint: string;
}> = [
  { value: "normal", label: "Normal", hint: "Typical Midwest pattern" },
  { value: "wet_spring", label: "Wet spring", hint: "Higher leaching/denit risk" },
  { value: "dry_spring", label: "Dry spring", hint: "Lower loss risk" },
  { value: "cool_late", label: "Cool, late", hint: "Delayed mineralization" },
];

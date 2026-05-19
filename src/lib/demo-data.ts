import { FieldInputs } from "./types";

// Flagship demo field: Cape Girardeau County, MO — picks up the Vibeathon location.
// Coordinates resolve to a real corn field on Menfro silt loam.
export const DEMO_FIELD: FieldInputs = {
  id: "north-bend-cape",
  fieldName: "North Bend — Cape Girardeau",
  acres: 132,
  location: {
    latitude: 37.4002,
    longitude: -89.6001,
    county: "Cape Girardeau",
    state: "MO",
    label: "Cape Girardeau County, MO",
  },
  previousCrop: "soybeans",
  currentNRate: 200,
  cornPrice: 4.4,
  nitrogenPrice: 0.62,
  residualN: "medium",
  targetYield: 200,
};

export const ALT_FIELDS: FieldInputs[] = [
  {
    id: "linn-12-pivot",
    fieldName: "Linn 12 — South Pivot",
    acres: 96,
    location: {
      latitude: 42.05,
      longitude: -91.85,
      county: "Linn",
      state: "IA",
      label: "Linn County, IA",
    },
    previousCrop: "corn",
    currentNRate: 220,
    cornPrice: 4.55,
    nitrogenPrice: 0.58,
    residualN: "low",
    targetYield: 215,
  },
  {
    id: "champaign-river",
    fieldName: "Champaign 4 — North 80",
    acres: 78,
    location: {
      latitude: 40.08,
      longitude: -88.05,
      county: "Champaign",
      state: "IL",
      label: "Champaign County, IL",
    },
    previousCrop: "soybeans",
    currentNRate: 205,
    cornPrice: 4.3,
    nitrogenPrice: 0.71,
    residualN: "high",
    targetYield: 208,
  },
];

export const PREVIOUS_CROP_OPTIONS = [
  { value: "soybeans" as const, label: "Soybeans" },
  { value: "corn" as const, label: "Corn (corn-on-corn)" },
  { value: "small_grain" as const, label: "Small grain (oats/wheat)" },
  { value: "alfalfa" as const, label: "Alfalfa" },
];

export const RESIDUAL_N_OPTIONS = [
  { value: "low" as const, label: "Low", hint: "Below regional median" },
  { value: "medium" as const, label: "Typical", hint: "Near regional median" },
  { value: "high" as const, label: "Elevated", hint: "Above regional median" },
];

export const STATES = [
  { value: "IA", label: "Iowa" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "MO", label: "Missouri" },
  { value: "KS", label: "Kansas" },
  { value: "NE", label: "Nebraska" },
  { value: "MN", label: "Minnesota" },
  { value: "WI", label: "Wisconsin" },
  { value: "OH", label: "Ohio" },
  { value: "KY", label: "Kentucky" },
];

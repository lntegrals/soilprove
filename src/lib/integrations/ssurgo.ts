// USDA NRCS Soil Data Access (SSURGO) integration.
// Endpoint:
//   https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest
//
// Strategy: a small, robust two-step query.
//   1. Resolve the dominant component at the field coordinate (mapunit + component).
//   2. Pull a depth-weighted (0–30cm) average of organic matter, plus surface texture
//      and saturated hydraulic conductivity for the same component (single round trip).
// Falls back to a clearly labelled regional estimate when SDA is unreachable or returns water.

import { DrainageClass, HydrologicGroup, SoilProfile, SoilTextureClass } from "../types";

const SDA_ENDPOINT =
  "https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest";

type SdaResponse = {
  Table?: string[][];
};

function buildQuery(lat: number, lon: number): string {
  // ~55m polygon around the point — large enough to always land in a polygon.
  const d = 0.0005;
  const minLat = lat - d;
  const maxLat = lat + d;
  const minLon = lon - d;
  const maxLon = lon + d;
  const wkt =
    `POLYGON((${minLon} ${minLat}, ${maxLon} ${minLat}, ` +
    `${maxLon} ${maxLat}, ${minLon} ${maxLat}, ${minLon} ${minLat}))`;
  // One round trip: dominant component, depth-weighted OM (0-30cm), surface texture, ksat.
  return `WITH dominant AS (
  SELECT TOP 1 mu.mukey, mu.muname, c.cokey, c.compname, c.comppct_r,
    c.taxclname, c.drainagecl, c.hydgrp, mag.aws0150wta
  FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${wkt}') i
  INNER JOIN mapunit mu ON mu.mukey = i.mukey
  LEFT JOIN muaggatt mag ON mag.mukey = mu.mukey
  INNER JOIN component c ON c.mukey = mu.mukey AND c.majcompflag = 'Yes'
  WHERE c.compname <> 'Water'
  ORDER BY c.comppct_r DESC
), top_horizon AS (
  SELECT TOP 1 ch.chkey, ch.ksat_r
  FROM dominant d
  INNER JOIN chorizon ch ON ch.cokey = d.cokey
  WHERE ch.hzdept_r <= 15
  ORDER BY ch.hzdept_r ASC
), top_texture AS (
  SELECT TOP 1 ct.texcl
  FROM top_horizon h
  INNER JOIN chtexturegrp ctg ON ctg.chkey = h.chkey AND ctg.rvindicator = 'Yes'
  INNER JOIN chtexture ct ON ct.chtgkey = ctg.chtgkey
), om_w AS (
  SELECT
    SUM((CASE WHEN ch.hzdepb_r > 30 THEN 30 ELSE ch.hzdepb_r END
         - CASE WHEN ch.hzdept_r < 0 THEN 0 ELSE ch.hzdept_r END) * ch.om_r) AS num,
    SUM(CASE WHEN ch.om_r IS NULL THEN 0 ELSE
        (CASE WHEN ch.hzdepb_r > 30 THEN 30 ELSE ch.hzdepb_r END
         - CASE WHEN ch.hzdept_r < 0 THEN 0 ELSE ch.hzdept_r END) END) AS denom
  FROM dominant d
  INNER JOIN chorizon ch ON ch.cokey = d.cokey
  WHERE ch.hzdept_r < 30 AND ch.hzdepb_r > 0
)
SELECT d.mukey, d.muname, d.compname, d.comppct_r, d.taxclname, d.drainagecl, d.hydgrp,
       d.aws0150wta, h.ksat_r, t.texcl AS surface_texture,
       CASE WHEN o.denom > 0 THEN o.num / o.denom ELSE NULL END AS om_top30
FROM dominant d
LEFT JOIN top_horizon h ON 1=1
LEFT JOIN top_texture t ON 1=1
LEFT JOIN om_w o ON 1=1`;
}

function normalizeTexture(input: string | null | undefined): SoilTextureClass {
  if (!input) return "unknown";
  const s = input.toLowerCase().trim();
  const aliases: [RegExp, SoilTextureClass][] = [
    [/silty\s*clay\s*loam/, "silty clay loam"],
    [/silty\s*clay/, "silty clay"],
    [/silt\s*loam/, "silt loam"],
    [/clay\s*loam/, "clay loam"],
    [/sandy\s*clay\s*loam/, "sandy clay loam"],
    [/sandy\s*clay/, "sandy clay"],
    [/sandy\s*loam/, "sandy loam"],
    [/loamy\s*sand/, "loamy sand"],
    [/^silt$/, "silt"],
    [/^clay$/, "clay"],
    [/^loam$/, "loam"],
    [/^sand$/, "sand"],
  ];
  for (const [re, t] of aliases) if (re.test(s)) return t;
  return "unknown";
}

function normalizeDrainage(input: string | null | undefined): DrainageClass {
  if (!input) return "Unknown";
  const s = input.toLowerCase();
  if (s.includes("very poorly")) return "Very poorly drained";
  if (s.includes("somewhat poorly")) return "Somewhat poorly drained";
  if (s.includes("poorly")) return "Poorly drained";
  if (s.includes("moderately well")) return "Moderately well drained";
  if (s.includes("somewhat excessively")) return "Somewhat excessively drained";
  if (s.includes("excessively")) return "Excessively drained";
  if (s.includes("well")) return "Well drained";
  return "Unknown";
}

function normalizeHydro(input: string | null | undefined): HydrologicGroup {
  if (!input) return "Unknown";
  const s = input.toUpperCase().trim();
  const allowed: HydrologicGroup[] = ["A", "B", "C", "D", "A/D", "B/D", "C/D"];
  return (allowed.find((g) => g === s) as HydrologicGroup) ?? "Unknown";
}

function toNumber(v: string | undefined | null): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetchSsurgoProfile(
  lat: number,
  lon: number
): Promise<SoilProfile> {
  const query = buildQuery(lat, lon);
  let json: SdaResponse | null = null;
  try {
    const res = await fetch(SDA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "JSON+COLUMNNAME", query }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`SDA HTTP ${res.status}`);
    json = (await res.json()) as SdaResponse;
  } catch (e) {
    console.warn("[ssurgo] fetch failed:", e);
    return fallbackProfile(lat, lon);
  }

  const table = json?.Table;
  if (!table || table.length < 2) return fallbackProfile(lat, lon);

  const headers = table[0];
  const row = table[1];
  const get = (col: string): string | undefined => {
    const i = headers.findIndex((h) => h.toLowerCase() === col.toLowerCase());
    return i >= 0 ? row[i] : undefined;
  };

  return {
    mapUnitKey: get("mukey"),
    mapUnitName: get("muname") || "Unnamed map unit",
    componentName: get("compname") || "Unnamed component",
    componentPct: toNumber(get("comppct_r")),
    textureClass: normalizeTexture(get("surface_texture")),
    drainageClass: normalizeDrainage(get("drainagecl")),
    hydrologicGroup: normalizeHydro(get("hydgrp")),
    organicMatterPct: toNumber(get("om_top30")),
    availableWaterStorage: toNumber(get("aws0150wta")),
    ksatUm: toNumber(get("ksat_r")),
    taxonomy: get("taxclname") ?? undefined,
    source: "ssurgo",
    fetchedAt: new Date().toISOString(),
  };
}

export function fallbackProfile(lat: number, lon: number): SoilProfile {
  return {
    mapUnitName: "Regional estimate (SSURGO unavailable)",
    componentName: "Typical Midwest silt loam",
    textureClass: "silt loam",
    drainageClass: "Moderately well drained",
    hydrologicGroup: "B",
    organicMatterPct: 2.6,
    availableWaterStorage: 23,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
    taxonomy: `lat ${lat.toFixed(3)}, lon ${lon.toFixed(3)}`,
  };
}

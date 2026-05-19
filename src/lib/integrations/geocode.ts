// Free US Census geocoder. No API key required.
// https://geocoding.geo.census.gov/geocoder

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  matchedAddress: string;
  county?: string;
  state?: string;
};

type CensusMatch = {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  addressComponents?: { state?: string };
  geographies?: {
    Counties?: Array<{ NAME?: string; STATE?: string; BASENAME?: string }>;
  };
};

export async function geocodeOneline(q: string): Promise<GeocodeResult | null> {
  const url =
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress" +
    `?address=${encodeURIComponent(q)}` +
    "&benchmark=Public_AR_Current&vintage=Current_Current&layers=Counties&format=json";
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: { addressMatches?: CensusMatch[] };
    };
    const m = data.result?.addressMatches?.[0];
    if (!m) return null;
    return {
      latitude: m.coordinates.y,
      longitude: m.coordinates.x,
      matchedAddress: m.matchedAddress,
      county: m.geographies?.Counties?.[0]?.BASENAME,
      state: m.addressComponents?.state,
    };
  } catch {
    return null;
  }
}

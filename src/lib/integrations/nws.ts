// National Weather Service API integration.
// NWS pattern: /points/{lat},{lon} -> forecast URL, then GET that URL.
// Docs: https://www.weather.gov/documentation/services-web-api

import { DailyForecast, WeatherProfile } from "../types";

const USER_AGENT =
  process.env.NWS_USER_AGENT ??
  "SoilProve (hackathon prototype, contact@soilprove.demo)";

type NwsPointsResponse = {
  properties?: {
    forecast?: string;
    forecastHourly?: string;
    gridId?: string;
    gridX?: number;
    gridY?: number;
    forecastZone?: string;
    relativeLocation?: {
      properties?: { city?: string; state?: string };
    };
  };
};

type NwsForecastPeriod = {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: "F" | "C";
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
  windSpeed?: string;
};

type NwsForecastResponse = {
  properties?: {
    updated?: string;
    periods?: NwsForecastPeriod[];
  };
};

async function nwsGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/geo+json",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NWS ${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function fetchNwsForecast(
  lat: number,
  lon: number
): Promise<WeatherProfile> {
  try {
    const points = await nwsGet<NwsPointsResponse>(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`
    );

    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) throw new Error("NWS points: no forecast URL");

    const forecast = await nwsGet<NwsForecastResponse>(forecastUrl);
    const periods = forecast.properties?.periods ?? [];

    // Periods are 12-hour day/night blocks. Pair them by date.
    const byDay = new Map<
      string,
      {
        date: string;
        day?: NwsForecastPeriod;
        night?: NwsForecastPeriod;
      }
    >();
    for (const p of periods) {
      const key = dayKey(p.startTime);
      const entry = byDay.get(key) ?? { date: key };
      if (p.isDaytime) entry.day = p;
      else entry.night = p;
      byDay.set(key, entry);
    }

    const daily: DailyForecast[] = [];
    for (const entry of Array.from(byDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )) {
      if (daily.length >= 7) break;
      const dayP = entry.day;
      const nightP = entry.night;
      const tempHigh =
        dayP?.temperature ??
        // fall back: if no daytime block (later in the day), use night high
        nightP?.temperature ??
        0;
      const tempLow =
        nightP?.temperature ?? dayP?.temperature ?? 0;
      const popDay = dayP?.probabilityOfPrecipitation?.value ?? null;
      const popNight = nightP?.probabilityOfPrecipitation?.value ?? null;
      const pop = Math.max(popDay ?? 0, popNight ?? 0);
      const short = dayP?.shortForecast ?? nightP?.shortForecast ?? "—";
      daily.push({
        date: entry.date,
        tempHighF: tempHigh,
        tempLowF: tempLow,
        precipProbPct: pop,
        shortForecast: short,
        windSpeed: dayP?.windSpeed ?? nightP?.windSpeed,
      });
    }

    const next72h = periods.slice(0, 6);
    const nextRainProb = Math.max(
      0,
      ...next72h.map((p) => p.probabilityOfPrecipitation?.value ?? 0)
    );

    // Crude precip-inches estimate: count "rain"/"showers"/"storm" periods, weight by POP.
    let estPrecip = 0;
    for (const d of daily) {
      const t = d.shortForecast.toLowerCase();
      const intensity = /thunder|heavy/.test(t)
        ? 0.7
        : /showers|rain/.test(t)
        ? 0.35
        : /light|drizzle/.test(t)
        ? 0.1
        : 0;
      estPrecip += intensity * (d.precipProbPct / 100);
    }

    const avgHigh =
      daily.reduce((s, d) => s + d.tempHighF, 0) / Math.max(1, daily.length);
    const avgLow =
      daily.reduce((s, d) => s + d.tempLowF, 0) / Math.max(1, daily.length);

    return {
      gridOffice: points.properties?.gridId,
      gridX: points.properties?.gridX,
      gridY: points.properties?.gridY,
      forecastZone: points.properties?.forecastZone,
      near: {
        nextRainProbPct: Math.round(nextRainProb),
        next7DayPrecipInches: Math.round(estPrecip * 100) / 100,
        avgHighF: Math.round(avgHigh),
        avgLowF: Math.round(avgLow),
      },
      daily,
      source: "nws",
      fetchedAt: new Date().toISOString(),
      observedAt: forecast.properties?.updated,
    };
  } catch (e) {
    console.warn("[nws] fetch failed:", e);
    return fallbackWeather();
  }
}

export function fallbackWeather(): WeatherProfile {
  const today = new Date();
  const daily: DailyForecast[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      tempHighF: 78,
      tempLowF: 58,
      precipProbPct: 20,
      shortForecast: "Partly Cloudy",
    };
  });
  return {
    near: { nextRainProbPct: 20, next7DayPrecipInches: 0.35, avgHighF: 78, avgLowF: 58 },
    daily,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

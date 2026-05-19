"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Stat, StatRow } from "@/components/ui/Stat";
import { MiniMap } from "@/components/ui/MiniMap";
import {
  useFieldState,
  useEnsureIntelligence,
} from "@/lib/store";
import { extractFeatures } from "@/lib/engine/features";
import { fmtInches, fmtPct, fmtTempF, titleCase } from "@/lib/format";

export default function IntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);
  const { soilFetcher, weatherFetcher } = useEnsureIntelligence(id);

  const features = useMemo(
    () => (fs ? extractFeatures(fs.inputs, fs.soil, fs.weather) : null),
    [fs]
  );

  if (!fs) return null;
  const { inputs, soil, weather } = fs;

  return (
    <div className="grid gap-6">
      {/* Top status strip */}
      <div className="grid gap-4 md:grid-cols-3">
        <SourceCard
          label="Location"
          status={inputs.location.label ?? "—"}
          sub={`${inputs.location.latitude.toFixed(4)}, ${inputs.location.longitude.toFixed(4)}`}
          tone="loam"
        />
        <SourceCard
          label="USDA SSURGO"
          status={
            soilFetcher.loading
              ? "Fetching…"
              : soil?.source === "ssurgo"
              ? "Live · NRCS"
              : soil
              ? "Fallback estimate"
              : "Not loaded"
          }
          sub={soil?.mapUnitName ?? "Pull live soil"}
          tone={soil?.source === "ssurgo" ? "moss" : "neutral"}
          onAction={soilFetcher.refresh}
          actionLabel={soilFetcher.loading ? "…" : "Refresh"}
        />
        <SourceCard
          label="NWS Forecast"
          status={
            weatherFetcher.loading
              ? "Fetching…"
              : weather?.source === "nws"
              ? `Live · ${weather.gridOffice ?? ""}`
              : weather
              ? "Fallback estimate"
              : "Not loaded"
          }
          sub={weather ? `${fmtTempF(weather.near.avgHighF)} / ${fmtTempF(weather.near.avgLowF)} avg` : "Pull live forecast"}
          tone={weather?.source === "nws" ? "sky" : "neutral"}
          onAction={weatherFetcher.refresh}
          actionLabel={weatherFetcher.loading ? "…" : "Refresh"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr),minmax(0,1fr)]">
        {/* Soil */}
        <Panel
          title="Soil profile"
          subtitle="USDA Natural Resources Conservation Service, SSURGO"
          right={
            <Badge tone={soil?.source === "ssurgo" ? "moss" : "neutral"} dot>
              {soil?.source === "ssurgo" ? "Live SSURGO" : "Fallback"}
            </Badge>
          }
          className="min-w-0"
        >
          {soilFetcher.loading && !soil ? (
            <SoilSkeleton />
          ) : !soil ? (
            <EmptyData label="No soil profile yet" onAction={soilFetcher.refresh} />
          ) : (
            <>
              <div>
                <div className="label">Map unit</div>
                <div className="mt-1.5 font-display text-lg leading-snug text-ink-900">
                  {soil.mapUnitName}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-ink-500">
                  {soil.componentName}
                  {typeof soil.componentPct === "number" && (
                    <>
                      <span className="mx-1.5 text-ink-300">·</span>
                      <span>{soil.componentPct}% of unit</span>
                    </>
                  )}
                </div>
                {soil.taxonomy && (
                  <div className="mt-2 text-[11px] text-ink-500">
                    {soil.taxonomy}
                  </div>
                )}
              </div>

              <div className="mt-6 hairline pt-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  <SoilFact label="Texture" value={titleCase(soil.textureClass)} />
                  <SoilFact label="Drainage" value={soil.drainageClass.replace(" drained", "")} />
                  <SoilFact label="Hydro group" value={soil.hydrologicGroup} />
                  <SoilFact
                    label="Organic matter"
                    value={soil.organicMatterPct ? `${soil.organicMatterPct.toFixed(1)}%` : "—"}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <RiskBar
                  label="Leaching potential"
                  value={features?.leachingPotential01 ?? 0}
                  hint="Coarser, more permeable profiles lose more N to drainage"
                />
                <RiskBar
                  label="Denitrification potential"
                  value={features?.denitPotential01 ?? 0}
                  hint="Wetter or heavier soils denitrify more when saturated"
                />
              </div>
            </>
          )}
        </Panel>

        {/* Location panel */}
        <Panel
          title="Geospatial"
          subtitle="The point queried against USDA and NWS"
          className="min-w-0"
        >
          <MiniMap
            lat={inputs.location.latitude}
            lon={inputs.location.longitude}
            zoom={13}
            size={3}
            className="aspect-[4/3] w-full"
          />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <div className="label">County</div>
              <div className="mt-1 text-ink-900">{inputs.location.county ?? "—"}</div>
            </div>
            <div>
              <div className="label">State</div>
              <div className="mt-1 text-ink-900">{inputs.location.state ?? "—"}</div>
            </div>
            <div>
              <div className="label">Coordinate</div>
              <div className="mt-1 font-mono text-[12px] text-ink-700">
                {inputs.location.latitude.toFixed(4)}, {inputs.location.longitude.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="label">NWS grid</div>
              <div className="mt-1 font-mono text-[12px] text-ink-700">
                {weather?.gridOffice ?? "—"}
                {weather?.gridX != null && ` · ${weather.gridX},${weather.gridY}`}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Weather */}
      <Panel
        title="Forecast & loss risk"
        subtitle="National Weather Service, 7-day outlook for the field coordinate"
        right={
          <Badge tone={weather?.source === "nws" ? "sky" : "neutral"} dot>
            {weather?.source === "nws" ? "Live NWS" : "Fallback"}
          </Badge>
        }
      >
        {weatherFetcher.loading && !weather ? (
          <WeatherSkeleton />
        ) : !weather ? (
          <EmptyData label="No forecast yet" onAction={weatherFetcher.refresh} />
        ) : (
          <>
            <StatRow>
              <Stat
                label="Next 72h rain"
                value={`${weather.near.nextRainProbPct}%`}
                hint="max precip probability"
                tone={
                  weather.near.nextRainProbPct >= 60
                    ? "warn"
                    : weather.near.nextRainProbPct >= 30
                    ? "neutral"
                    : "good"
                }
              />
              <Stat
                label="7-day precip"
                value={fmtInches(weather.near.next7DayPrecipInches)}
                hint="modeled accumulation"
              />
              <Stat
                label="Avg high"
                value={fmtTempF(weather.near.avgHighF)}
                hint="7-day mean"
              />
              <Stat
                label="Weather loss risk"
                value={fmtPct((features?.weatherLossRisk01 ?? 0) * 100)}
                tone={
                  (features?.weatherLossRisk01 ?? 0) >= 0.55
                    ? "warn"
                    : (features?.weatherLossRisk01 ?? 0) <= 0.2
                    ? "good"
                    : "neutral"
                }
                hint="rain × soil sensitivity"
              />
            </StatRow>
            <div className="mt-7 hairline pt-6">
              <div className="label mb-3">7-day forecast</div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {weather.daily.slice(0, 7).map((d) => (
                  <div
                    key={d.date}
                    className="flex min-w-0 flex-col rounded-lg border border-ink-100 bg-canvas px-3 py-3"
                  >
                    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500">
                      {dayLabel(d.date)}
                    </div>
                    <div className="mt-1.5 font-display text-lg leading-none text-ink-900">
                      {Math.round(d.tempHighF)}°
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        / {Math.round(d.tempLowF)}°
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-ink-500" title={d.shortForecast}>
                      {d.shortForecast}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="h-1 flex-1 rounded-full bg-ink-100">
                        <span
                          className="block h-1 rounded-full bg-sky2-400"
                          style={{ width: `${Math.max(2, d.precipProbPct)}%` }}
                        />
                      </span>
                      <span className="text-[10px] font-semibold tabular-nums text-sky2-500">
                        {Math.round(d.precipProbPct)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {weather.observedAt && (
                <div className="mt-4 text-[11px] text-ink-500">
                  Forecast issued {new Date(weather.observedAt).toLocaleString()}
                  <span className="mx-1.5 text-ink-300">·</span>
                  Source: api.weather.gov
                </div>
              )}
            </div>
          </>
        )}
      </Panel>

      {/* Footer next step */}
      <Panel tone="dark">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-8">
          <div className="min-w-0">
            <div className="micro text-loam-300">Next</div>
            <h3 className="mt-1 text-paper">Translate this into a defensible N number</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-200">
              SoilProve uses the soil profile and weather loss risk to move the
              recommendation off the regional MRTN reference.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/workspace/field/${id}/recommendation`)}
            className="btn-accent shrink-0"
          >
            Generate recommendation →
          </button>
        </div>
      </Panel>

      <div className="text-[11px] text-ink-400">
        Soil data via{" "}
        <Link href="https://sdmdataaccess.nrcs.usda.gov/" className="underline">
          USDA NRCS Soil Data Access (SSURGO)
        </Link>
        . Weather via{" "}
        <Link href="https://www.weather.gov/documentation/services-web-api" className="underline">
          api.weather.gov
        </Link>
        .
      </div>
    </div>
  );
}

function SourceCard({
  label,
  status,
  sub,
  tone,
  onAction,
  actionLabel,
}: {
  label: string;
  status: string;
  sub: string;
  tone: "moss" | "loam" | "sky" | "neutral";
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="micro">{label}</div>
        <Badge tone={tone} dot className="shrink-0">
          {status}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm text-ink-700" title={sub}>{sub}</div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2.5 text-[12px] font-semibold text-moss-700 hover:text-moss-800"
        >
          ↻ {actionLabel ?? "Refresh"}
        </button>
      )}
    </div>
  );
}

function SoilFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="stat-label">{label}</span>
      <span className="font-display text-lg leading-tight text-ink-900">
        {value}
      </span>
    </div>
  );
}

function RiskBar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  const pct = Math.round(value * 100);
  const tone = pct >= 60 ? "bg-clay-400" : pct >= 35 ? "bg-loam-400" : "bg-moss-400";
  return (
    <div className="rounded-xl border border-ink-100 bg-canvas p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold text-ink-800">{label}</div>
        <div className="font-display text-xl tabular-nums text-ink-900">{pct}%</div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {hint && <div className="mt-2 text-[11px] text-ink-500">{hint}</div>}
    </div>
  );
}

function EmptyData({ label, onAction }: { label: string; onAction: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-canvas p-8 text-center">
      <div className="font-display text-ink-800">{label}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        Live data hasn’t loaded yet. Try a manual fetch.
      </p>
      <button onClick={onAction} className="btn-soft mt-4">Fetch now</button>
    </div>
  );
}

function SoilSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-20 shimmer rounded" />
        <div className="h-5 w-3/4 shimmer rounded" />
        <div className="h-3 w-1/2 shimmer rounded" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 shimmer rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-24 shimmer rounded-xl" />
        <div className="h-24 shimmer rounded-xl" />
      </div>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 shimmer rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 shimmer rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function dayLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

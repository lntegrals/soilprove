"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  PREVIOUS_CROP_OPTIONS,
  RESIDUAL_N_OPTIONS,
  STATES,
} from "@/lib/demo-data";
import { useFieldState, workspaceActions } from "@/lib/store";
import { Panel } from "@/components/ui/Panel";
import { Field, NumberField, Segmented } from "@/components/ui/FieldInput";
import { MiniMap } from "@/components/ui/MiniMap";
import { Badge } from "@/components/ui/Badge";

export default function SetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);
  const [geo, setGeo] = useState<{ q: string; busy: boolean; err?: string }>({
    q: "",
    busy: false,
  });

  if (!fs) return null;
  const i = fs.inputs;

  function patch(patch: Partial<typeof i>) {
    workspaceActions.patchInputs(id, patch);
  }

  async function runGeocode() {
    if (!geo.q.trim()) return;
    setGeo((g) => ({ ...g, busy: true, err: undefined }));
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(geo.q)}`);
      if (!res.ok) throw new Error("No match");
      const data = (await res.json()) as {
        latitude: number;
        longitude: number;
        county?: string;
        state?: string;
        matchedAddress: string;
      };
      patch({
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          county: data.county,
          state: data.state ?? i.location.state,
          label: data.matchedAddress,
        },
      });
      // Clear cached soil/weather so the new location triggers fresh fetches.
      workspaceActions.setSoil(id, undefined);
      workspaceActions.setWeather(id, undefined);
      setGeo({ q: "", busy: false });
    } catch (e: unknown) {
      setGeo((g) => ({
        ...g,
        busy: false,
        err: e instanceof Error ? e.message : "Lookup failed",
      }));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
      <div className="space-y-6">
        <Panel
          title="Field identity"
          subtitle="Persisted across all pages. Edit and we re-fetch live data when needed."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Field name" span={2}>
              <input
                className="field-input"
                value={i.fieldName}
                onChange={(e) => patch({ fieldName: e.target.value })}
              />
            </Field>
            <Field label="Acres" hint="Total productive acres in this field">
              <NumberField
                value={i.acres}
                onChange={(n) => patch({ acres: n })}
                min={1}
                step={1}
                suffix="ac"
              />
            </Field>
            <Field label="Target yield" hint="bu/ac aspirational">
              <NumberField
                value={i.targetYield}
                onChange={(n) => patch({ targetYield: n })}
                min={120}
                max={260}
                suffix="bu/ac"
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Location"
          subtitle="The exact coordinate is sent to USDA SSURGO and the National Weather Service."
          right={
            <Badge tone="moss" dot>
              Drives live data
            </Badge>
          }
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Latitude">
                <NumberField
                  value={i.location.latitude}
                  onChange={(n) =>
                    patch({ location: { ...i.location, latitude: n } })
                  }
                  step={0.0001}
                />
              </Field>
              <Field label="Longitude">
                <NumberField
                  value={i.location.longitude}
                  onChange={(n) =>
                    patch({ location: { ...i.location, longitude: n } })
                  }
                  step={0.0001}
                />
              </Field>
              <Field label="County">
                <input
                  className="field-input"
                  value={i.location.county ?? ""}
                  onChange={(e) =>
                    patch({ location: { ...i.location, county: e.target.value } })
                  }
                />
              </Field>
              <Field label="State">
                <select
                  className="field-input"
                  value={(i.location.state as string) ?? ""}
                  onChange={(e) =>
                    patch({ location: { ...i.location, state: e.target.value } })
                  }
                >
                  <option value="">—</option>
                  {STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Free-text lookup" span={2} hint="Optional, uses the US Census geocoder">
                <div className="flex gap-2">
                  <input
                    className="field-input flex-1"
                    placeholder='e.g. "Cape Girardeau, MO"'
                    value={geo.q}
                    onChange={(e) => setGeo((g) => ({ ...g, q: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runGeocode();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={runGeocode}
                    disabled={geo.busy || !geo.q.trim()}
                    className="btn-soft"
                  >
                    {geo.busy ? "Looking…" : "Resolve"}
                  </button>
                </div>
                {geo.err && (
                  <span className="mt-1.5 text-[11px] text-rose2-500">{geo.err}</span>
                )}
              </Field>
            </div>
            <div className="flex flex-col gap-3">
              <MiniMap lat={i.location.latitude} lon={i.location.longitude} zoom={12} size={3} />
              <div className="text-[11px] leading-relaxed text-ink-500">
                <span>{i.location.label ?? "—"}</span>
                <span className="mx-1.5 text-ink-300">·</span>
                <span className="font-mono text-ink-600">
                  {i.location.latitude.toFixed(4)}, {i.location.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Agronomy & economics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Previous crop" hint="Rotation history">
              <Segmented
                value={i.previousCrop}
                options={PREVIOUS_CROP_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label.split(" ")[0],
                }))}
                onChange={(v) => patch({ previousCrop: v })}
              />
            </Field>
            <Field label="Residual soil N" hint="Based on most recent soil test">
              <Segmented
                value={i.residualN}
                options={RESIDUAL_N_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                onChange={(v) => patch({ residualN: v })}
              />
            </Field>
            <Field label="Current planned N rate" hint="Your baseline plan">
              <NumberField
                value={i.currentNRate}
                onChange={(n) => patch({ currentNRate: n })}
                min={50}
                max={300}
                suffix="lb/ac"
              />
            </Field>
            <Field label="Corn price">
              <NumberField
                value={i.cornPrice}
                onChange={(n) => patch({ cornPrice: n })}
                min={2}
                max={10}
                step={0.05}
                prefix="$"
                suffix="/bu"
              />
            </Field>
            <Field label="Nitrogen price">
              <NumberField
                value={i.nitrogenPrice}
                onChange={(n) => patch({ nitrogenPrice: n })}
                min={0.2}
                max={1.5}
                step={0.01}
                prefix="$"
                suffix="/lb N"
              />
            </Field>
          </div>
        </Panel>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <Panel title="Next step" tone="dark">
          <p className="text-sm text-ink-200">
            With identity and location set, pull live USDA soil + NWS weather to
            ground the recommendation.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/workspace/field/${id}/intelligence`)}
            className="btn-accent mt-4 w-full"
          >
            Fetch field intelligence →
          </button>
        </Panel>

        <Panel title="Status" subtitle="Persistence is local-first">
          <ul className="space-y-2 text-sm text-ink-700">
            <Status ok label="Field identity saved" />
            <Status ok={fs.soil ? true : false} label={fs.soil ? "Soil profile cached" : "Soil profile not fetched"} />
            <Status ok={fs.weather ? true : false} label={fs.weather ? "Weather forecast cached" : "Weather not fetched"} />
            <Status
              ok={fs.review?.status !== "pending"}
              label={fs.review?.status !== "pending" ? "Agronomist reviewed" : "Agronomist review pending"}
            />
          </ul>
          <div className="mt-4 flex items-center justify-between text-[11px] text-ink-500">
            <span>Last edited {timeAgo(fs.updatedAt)}</span>
            <Link
              href="/method"
              className="font-semibold text-moss-700 hover:text-moss-800"
            >
              About the model
            </Link>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-paper ${
          ok ? "bg-moss-500" : "bg-ink-200 text-ink-500"
        }`}
      >
        {ok ? "✓" : "•"}
      </span>
      <span className={ok ? "text-ink-800" : "text-ink-500"}>{label}</span>
    </li>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

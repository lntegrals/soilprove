"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Stat, StatRow } from "@/components/ui/Stat";
import { useEnsureIntelligence, useFieldState } from "@/lib/store";
import { runRecommendation, recommendationModel } from "@/lib/engine/model";
import {
  fmtAcres,
  fmtBuAc,
  fmtLbAc,
  fmtUSD,
  fmtPctFrac,
  signedInt,
} from "@/lib/format";
import type { FactorImpact } from "@/lib/types";

export default function RecommendationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fs = useFieldState(id);
  // Ensure live data is at least attempted.
  useEnsureIntelligence(id);

  const result = useMemo(
    () => (fs ? runRecommendation(fs.inputs, fs.soil, fs.weather) : null),
    [fs]
  );

  if (!fs || !result) return null;
  const { recommendation: rec, features } = result;
  const i = fs.inputs;
  const trimmed = rec.baselineRate - rec.recommendedRate;
  const factorsSorted = [...rec.factors].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
  );

  return (
    <div className="space-y-6">
      {/* Decision hero */}
      <Panel tone="dark" className="overflow-hidden">
        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="moss" dot>
                Decision · {confidenceLabel(rec.confidence)} confidence
              </Badge>
              <Badge tone="ink" className="bg-ink-800 ring-ink-700">
                {recommendationModel.name} v{recommendationModel.version}
              </Badge>
            </div>
            <h1 className="mt-4 font-display text-[40px] leading-[1.04] text-paper md:text-[52px]">
              {rec.recommendedRate}
              <span className="text-base font-normal text-ink-300"> lb N / ac</span>
            </h1>
            <p className="mt-1 text-sm text-ink-200">{rec.explainer}</p>

            <div className="mt-7 flex flex-wrap items-center gap-6">
              <CompareTile
                label="Current plan"
                value={rec.baselineRate}
                sub="Farmer baseline"
              />
              <Arrow />
              <CompareTile
                label="SoilProve"
                value={rec.recommendedRate}
                sub={`${signedInt(-trimmed)} lb/ac vs plan`}
                emphasis
              />
              <Arrow />
              <CompareTile
                label="Reference"
                value={rec.baseMrtnRate}
                sub="Regional MRTN"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-ink-800 p-5">
            <div className="micro text-loam-300">Economics</div>
            <div className="mt-2 grid grid-cols-2 gap-y-3 gap-x-6">
              <NumTile
                label="Per acre"
                value={moneySigned(rec.perAcreCostDelta)}
                good={rec.perAcreCostDelta >= 0}
              />
              <NumTile
                label="Whole-field"
                value={moneySigned(rec.totalCostDelta)}
                good={rec.totalCostDelta >= 0}
              />
              <NumTile
                label="Expected yield"
                value={fmtBuAc(rec.expectedYield)}
              />
              <NumTile
                label="Yield range"
                value={`${rec.yieldRange[0].toFixed(0)}–${rec.yieldRange[1].toFixed(0)} bu`}
              />
            </div>
            <div className="mt-5 border-t border-ink-700 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                  Confidence
                </span>
                <span className="text-sm font-semibold text-paper">
                  {fmtPctFrac(rec.confidenceScore)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className={`h-1.5 rounded-full ${confidenceFill(rec.confidence)}`}
                  style={{ width: `${Math.round(rec.confidenceScore * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-ink-300">
                {rec.riskFlags.length === 0
                  ? "No notable risk flags."
                  : rec.riskFlags.map((f) => `· ${f}`).join("  ")}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        {/* Drivers */}
        <Panel
          title="What moved the recommendation"
          subtitle={`Reference rate is ${rec.baseMrtnRate} lb/ac for ${i.location.state ?? "the region"}. Drivers add or subtract from that.`}
        >
          <Waterfall
            base={rec.baseMrtnRate}
            factors={factorsSorted}
            final={rec.recommendedRate}
          />
        </Panel>

        {/* Inputs snapshot */}
        <Panel title="Feature snapshot" subtitle="The vector fed into the model">
          <ul className="space-y-2.5 text-sm">
            <KV label="Acres" value={fmtAcres(i.acres)} />
            <KV label="Previous crop" value={i.previousCrop.replace("_", " ")} />
            <KV label="Residual N" value={i.residualN} />
            <KV label="Price ratio N : corn" value={features.priceRatio.toFixed(3)} />
            <KV label="Soil texture" value={features.textureClass} />
            <KV label="Drainage" value={features.drainageClass} />
            <KV label="Organic matter" value={`${features.organicMatterPct.toFixed(1)}%`} />
            <KV
              label="Leaching potential"
              value={`${Math.round(features.leachingPotential01 * 100)}%`}
            />
            <KV
              label="Denit potential"
              value={`${Math.round(features.denitPotential01 * 100)}%`}
            />
            <KV
              label="Next-72h rain"
              value={`${features.nextRainProbPct}%`}
            />
            <KV
              label="Weather loss risk"
              value={`${Math.round(features.weatherLossRisk01 * 100)}%`}
            />
          </ul>
          <Link
            href="/method"
            className="mt-4 inline-block text-[12px] font-semibold text-moss-700 hover:text-moss-800"
          >
            How features translate into a rate →
          </Link>
        </Panel>
      </div>

      <Panel
        title="Take this to your agronomist"
        right={
          <div className="flex gap-2">
            <Link
              href={`/workspace/field/${id}/intelligence`}
              className="btn-ghost"
            >
              ← Field intelligence
            </Link>
            <button
              onClick={() => router.push(`/workspace/field/${id}/review`)}
              className="btn-accent"
            >
              Open agronomist review →
            </button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          SoilProve generates the number — your agronomist owns the decision.
          The review surface lets them approve, adjust, or send back for revision
          with rationale.
        </p>
      </Panel>
    </div>
  );
}

function CompareTile({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: number;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="micro text-loam-300">{label}</div>
      <div
        className={`font-display text-3xl tabular-nums ${
          emphasis ? "text-paper" : "text-ink-100"
        }`}
      >
        {Math.round(value)}
        <span className="ml-1 text-[11px] text-ink-300">lb</span>
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-300">{sub}</div>}
    </div>
  );
}

function Arrow() {
  return <span className="text-ink-500">→</span>;
}

function NumTile({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-300">{label}</div>
      <div
        className={`mt-0.5 font-display text-xl tabular-nums ${
          good === undefined
            ? "text-paper"
            : good
            ? "text-moss-300"
            : "text-clay-300"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-dashed border-ink-100 pb-1.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800 tabular-nums">{value}</span>
    </li>
  );
}

function moneySigned(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${fmtUSD(Math.abs(n))}`;
}

function confidenceLabel(c: "high" | "moderate" | "low") {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function confidenceFill(c: "high" | "moderate" | "low") {
  if (c === "high") return "bg-moss-400";
  if (c === "moderate") return "bg-loam-400";
  return "bg-clay-400";
}

/** Waterfall-style driver visualization: base reference + deltas → final rate */
function Waterfall({
  base,
  factors,
  final,
}: {
  base: number;
  factors: FactorImpact[];
  final: number;
}) {
  // Compute a sensible visual scale.
  const allValues = [base, final, ...factors.map((f) => Math.abs(f.delta))];
  const maxAbs = Math.max(40, ...allValues);
  const colorFor = (cat: FactorImpact["category"], delta: number) => {
    if (delta === 0) return "bg-ink-300";
    if (cat === "soil") return delta > 0 ? "bg-loam-400" : "bg-moss-400";
    if (cat === "weather") return delta > 0 ? "bg-sky2-400" : "bg-sky2-300";
    if (cat === "agronomy") return delta > 0 ? "bg-clay-400" : "bg-moss-400";
    if (cat === "economics") return delta > 0 ? "bg-amber2-400" : "bg-moss-400";
    return "bg-ink-300";
  };

  let running = base;
  return (
    <div className="space-y-2.5">
      <Row
        label={`Regional reference (${base} lb/ac)`}
        deltaLabel="base"
        category="agronomy"
        bar={
          <div className="relative h-7 flex-1 rounded-md bg-ink-50">
            <div
              className="absolute left-0 top-0 h-7 rounded-md bg-ink-200"
              style={{ width: `${(base / maxAbs) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center px-2 font-display text-xs font-semibold text-ink-800">
              {base}
            </span>
          </div>
        }
      />
      {factors.map((f, idx) => {
        const start = running;
        const end = start + f.delta;
        running = end;
        const wPct = (Math.abs(f.delta) / maxAbs) * 100;
        const leftPct = (Math.min(start, end) / maxAbs) * 100;
        return (
          <Row
            key={`${f.key}-${idx}`}
            label={f.label}
            sub={f.rationale}
            deltaLabel={`${f.delta > 0 ? "+" : f.delta < 0 ? "−" : ""}${Math.abs(f.delta)} lb`}
            category={f.category}
            bar={
              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-ink-50">
                {f.delta !== 0 && (
                  <div
                    className={`absolute top-0 h-7 ${colorFor(f.category, f.delta)} rounded-md`}
                    style={{
                      width: `${Math.max(2, wPct)}%`,
                      left: `${leftPct}%`,
                    }}
                  />
                )}
                <div
                  className="absolute top-0 h-7 border-l border-dashed border-ink-300"
                  style={{ left: `${(start / maxAbs) * 100}%` }}
                />
              </div>
            }
          />
        );
      })}
      <Row
        label={`SoilProve recommendation`}
        deltaLabel={`${final} lb`}
        category="agronomy"
        emphasis
        bar={
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-ink-50">
            <div
              className="absolute left-0 top-0 h-7 rounded-md bg-moss-500"
              style={{ width: `${(final / maxAbs) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center px-2 font-display text-xs font-semibold text-paper">
              {final}
            </span>
          </div>
        }
      />
    </div>
  );
}

function Row({
  label,
  sub,
  deltaLabel,
  bar,
  emphasis,
  category,
}: {
  label: string;
  sub?: string;
  deltaLabel: string;
  bar: React.ReactNode;
  emphasis?: boolean;
  category: FactorImpact["category"];
}) {
  const catTone =
    category === "soil"
      ? "loam"
      : category === "weather"
      ? "sky"
      : category === "economics"
      ? "amber"
      : "neutral";
  return (
    <div className="grid grid-cols-[200px,1fr,80px] items-center gap-3">
      <div className="min-w-0">
        <div className={`truncate text-[13px] ${emphasis ? "font-semibold text-ink-900" : "text-ink-700"}`}>{label}</div>
        {sub && (
          <div className="truncate text-[11px] text-ink-500" title={sub}>{sub}</div>
        )}
        {!sub && (
          <Badge tone={catTone as "loam" | "sky" | "amber" | "neutral"} className="mt-0.5">
            {category}
          </Badge>
        )}
      </div>
      {bar}
      <div
        className={`text-right text-[12px] font-semibold tabular-nums ${
          emphasis ? "text-moss-700" : "text-ink-700"
        }`}
      >
        {deltaLabel}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { useFieldList } from "@/lib/store";
import { runRecommendation } from "@/lib/engine/model";
import { fmtAcres, fmtLbAc, fmtUSD, signedInt, signedUSD } from "@/lib/format";

export default function WorkspaceHome() {
  const fields = useFieldList();

  const cards = useMemo(
    () =>
      fields.map((fs) => {
        const { recommendation } = runRecommendation(fs.inputs, fs.soil, fs.weather);
        return { fs, rec: recommendation };
      }),
    [fields]
  );

  const totals = cards.reduce(
    (acc, c) => {
      acc.acres += c.fs.inputs.acres;
      acc.savings += c.rec.totalCostDelta;
      acc.rateDelta += c.rec.baselineRate - c.rec.recommendedRate;
      return acc;
    },
    { acres: 0, savings: 0, rateDelta: 0 }
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Workspace top bar (no field context — global) */}
      <header className="border-b border-ink-100 bg-paper">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/"><Logo /></Link>
          <div className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
            <Link href="/workspace" className="font-semibold text-ink-900">Workspace</Link>
            <Link href="/method" className="hover:text-ink-900">Method</Link>
          </div>
          <Badge tone="moss" dot>Live USDA + NWS</Badge>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="label">Workspace</div>
            <h1 className="mt-1">Fields under SoilProve</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-600">
              Each field carries a live soil profile, weather context, and a
              defensible nitrogen recommendation.
            </p>
          </div>
          <Link
            href={`/workspace/field/${cards[0]?.fs.inputs.id}/setup`}
            className="btn-primary"
          >
            Open flagship field →
          </Link>
        </div>

        {/* Aggregate */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Fields"
            value={cards.length}
            hint="In workspace"
          />
          <SummaryCard
            label="Total acres"
            value={fmtAcres(totals.acres)}
            hint="Across all fields"
          />
          <SummaryCard
            label="Projected savings"
            value={totals.savings >= 0 ? fmtUSD(totals.savings) : `−${fmtUSD(Math.abs(totals.savings))}`}
            hint="vs farmer baseline"
            tone={totals.savings >= 0 ? "good" : "bad"}
          />
          <SummaryCard
            label="Avg rate delta"
            value={`${signedInt(totals.rateDelta / Math.max(1, cards.length))} lb/ac`}
            hint="Mean trim vs plan"
            tone={totals.rateDelta >= 0 ? "good" : "warn"}
          />
        </div>

        {/* Field cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ fs, rec }, idx) => (
            <FieldCard key={fs.inputs.id} fs={fs} rec={rec} flagship={idx === 0} />
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link
            href="/method"
            className="surface panel-pad transition hover:shadow-lift"
          >
            <div className="label">Method</div>
            <div className="mt-2 font-display text-xl">How the engine produces this number</div>
            <p className="mt-2 text-sm text-ink-600">
              Data sources, feature extraction, recommendation model, and how the
              ML interface is wired for the next pass.
            </p>
            <div className="mt-3 text-sm font-semibold text-moss-700">Read method →</div>
          </Link>
          <div className="surface panel-pad">
            <div className="label">Data freshness</div>
            <div className="mt-2 font-display text-xl">Updated on each visit</div>
            <p className="mt-2 text-sm text-ink-600">
              Live soil and weather are fetched against the field coordinate.
              Cached in this browser and re-fetched on the Intelligence page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "good" | "bad" | "warn";
}) {
  return (
    <div className="surface panel-pad">
      <Stat label={label} value={value} hint={hint} tone={tone} />
    </div>
  );
}

function FieldCard({
  fs,
  rec,
  flagship,
}: {
  fs: ReturnType<typeof useFieldList>[number];
  rec: ReturnType<typeof runRecommendation>["recommendation"];
  flagship?: boolean;
}) {
  const i = fs.inputs;
  const id = i.id;
  const reviewStatus = fs.review?.status ?? "pending";
  const trimmed = rec.baselineRate - rec.recommendedRate;
  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <div className="min-w-0">
          <div className="micro">{flagship ? "Flagship" : "Field"}</div>
          <div className="truncate font-display text-lg text-ink-900">
            {i.fieldName}
          </div>
        </div>
        <Badge tone={reviewBadgeTone(reviewStatus)} dot>
          {reviewLabel(reviewStatus)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-5 px-5 py-4">
        <Stat
          label="Recommended"
          value={
            <>
              {Math.round(rec.recommendedRate)}
              <span className="ml-1 text-base text-ink-400">lb/ac</span>
            </>
          }
          hint={`vs ${rec.baselineRate} lb/ac plan`}
          tone="good"
        />
        <Stat
          label="Whole-field"
          value={trimmed >= 0 ? `${signedUSD(rec.totalCostDelta)}` : signedUSD(rec.totalCostDelta)}
          hint={`${signedInt(trimmed)} lb/ac · ${fmtAcres(i.acres)}`}
          tone={trimmed >= 0 ? "good" : "warn"}
        />
      </div>
      <div className="border-t border-ink-100 px-5 py-3 text-[12px] text-ink-500">
        <div className="flex items-center justify-between">
          <span>{i.location.label ?? `${i.location.latitude.toFixed(2)}, ${i.location.longitude.toFixed(2)}`}</span>
          <span>{rec.confidence === "high" ? "High" : rec.confidence === "moderate" ? "Moderate" : "Low"} confidence</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone={fs.soil ? "moss" : "neutral"} dot>{fs.soil ? "Soil" : "No soil yet"}</Badge>
          <Badge tone={fs.weather ? "sky" : "neutral"} dot>{fs.weather ? "Weather" : "No weather yet"}</Badge>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-ink-100 px-5 py-3">
        <Link
          href={`/workspace/field/${id}/recommendation`}
          className="text-[13px] font-semibold text-moss-700 hover:text-moss-800"
        >
          Open recommendation →
        </Link>
        <Link href={`/workspace/field/${id}/setup`} className="text-[12px] text-ink-500 hover:text-ink-900">
          Edit setup
        </Link>
      </div>
    </div>
  );
}

function reviewBadgeTone(s: string): "moss" | "amber" | "rose" | "neutral" {
  if (s === "approved") return "moss";
  if (s === "approved_with_note") return "amber";
  if (s === "needs_revision") return "rose";
  return "neutral";
}

function reviewLabel(s: string): string {
  if (s === "approved") return "Approved";
  if (s === "approved_with_note") return "Adjusted";
  if (s === "needs_revision") return "Needs revision";
  return "Review pending";
}

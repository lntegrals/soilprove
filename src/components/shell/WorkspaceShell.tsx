"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { useFieldState, useFieldList, workspaceActions } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";

type StepKey =
  | "setup"
  | "intelligence"
  | "recommendation"
  | "review"
  | "trial"
  | "outcome";

export const STEPS: Array<{
  key: StepKey;
  label: string;
  hint: string;
  num: string;
}> = [
  { key: "setup", label: "Field Setup", hint: "Identity & economics", num: "01" },
  { key: "intelligence", label: "Field Intelligence", hint: "Live soil & weather", num: "02" },
  { key: "recommendation", label: "Recommendation", hint: "Nitrogen decision", num: "03" },
  { key: "review", label: "Agronomist Review", hint: "Sign-off", num: "04" },
  { key: "trial", label: "Trial Planner", hint: "Low-risk pilot", num: "05" },
  { key: "outcome", label: "Outcome", hint: "ROI & validation", num: "06" },
];

export function WorkspaceShell({
  fieldId,
  children,
}: {
  fieldId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const fields = useFieldList();
  const field = useFieldState(fieldId);

  const activeStep: StepKey | null = (() => {
    const m = pathname.match(/\/field\/[^/]+\/(\w+)/);
    return (m?.[1] as StepKey) ?? null;
  })();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 z-30 hidden h-screen w-[260px] shrink-0 border-r border-ink-100 bg-paper/95 backdrop-blur md:flex md:flex-col">
          <div className="px-5 py-5 hairline">
            <Link href="/workspace" className="block">
              <Logo />
            </Link>
            <div className="mt-1 text-[11px] text-ink-500">
              Field intelligence workspace
            </div>
          </div>

          <div className="px-5 py-4 hairline">
            <div className="label mb-2">Active field</div>
            <select
              value={fieldId}
              onChange={(e) => {
                workspaceActions.setActive(e.target.value);
                window.location.href = `/workspace/field/${e.target.value}/setup`;
              }}
              className="field-input"
              aria-label="Active field selector"
            >
              {fields.map((f) => (
                <option key={f.inputs.id} value={f.inputs.id}>
                  {f.inputs.fieldName}
                </option>
              ))}
            </select>
            {field && (
              <div className="mt-2 text-[11px] text-ink-500">
                {field.inputs.location.label ?? "—"} ·{" "}
                {field.inputs.acres.toLocaleString()} ac
              </div>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-4 hairline">
            {STEPS.map((step, i) => {
              const isActive = activeStep === step.key;
              const href = `/workspace/field/${fieldId}/${step.key}`;
              const done = isStepDone(step.key, field);
              return (
                <Link key={step.key} href={href} className={`nav-link ${isActive ? "active" : ""}`}>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                      isActive
                        ? "bg-paper text-ink-900"
                        : done
                        ? "bg-moss-500 text-paper"
                        : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    {done ? "✓" : step.num}
                  </span>
                  <span className="flex flex-col">
                    <span className="leading-tight">{step.label}</span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.1em] ${
                        isActive ? "text-paper/70" : "text-ink-400"
                      }`}
                    >
                      {step.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-5 py-4">
            <Link
              href="/method"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 hover:text-ink-900"
            >
              Method &amp; data sources →
            </Link>
            <div className="mt-2 text-[10px] text-ink-400">
              Prototype build · v0.2
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="min-w-0 flex-1">
          <FieldHeader fieldId={fieldId} activeStep={activeStep} />
          <div className="px-6 pb-16 pt-6 md:px-10">
            <MobileStepNav fieldId={fieldId} activeStep={activeStep} />
            <div className="appear">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function FieldHeader({
  fieldId,
  activeStep,
}: {
  fieldId: string;
  activeStep: StepKey | null;
}) {
  const field = useFieldState(fieldId);
  if (!field) return null;
  const i = field.inputs;
  const soilFresh = !!field.soil;
  const weatherFresh = !!field.weather;
  const reviewStatus = field.review?.status ?? "pending";
  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-paper/85 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5 md:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <div className="md:hidden">
            <Link href="/workspace">
              <Logo />
            </Link>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-400">
              <Link href="/workspace" className="hover:text-ink-900">Workspace</Link>
              <span>/</span>
              <span className="truncate text-ink-700">{i.fieldName}</span>
            </div>
            <h2 className="mt-0.5 truncate text-lg md:text-xl">
              {activeStep
                ? STEPS.find((s) => s.key === activeStep)?.label
                : i.fieldName}
            </h2>
          </div>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Badge tone={soilFresh ? "moss" : "neutral"} dot>
            {soilFresh ? "Soil live" : "Soil pending"}
          </Badge>
          <Badge tone={weatherFresh ? "sky" : "neutral"} dot>
            {weatherFresh ? "Weather live" : "Weather pending"}
          </Badge>
          <Badge tone={reviewBadgeTone(reviewStatus)} dot>
            {reviewLabel(reviewStatus)}
          </Badge>
        </div>
      </div>
    </header>
  );
}

function MobileStepNav({
  fieldId,
  activeStep,
}: {
  fieldId: string;
  activeStep: StepKey | null;
}) {
  return (
    <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto md:hidden">
      {STEPS.map((s) => {
        const isActive = activeStep === s.key;
        return (
          <Link
            key={s.key}
            href={`/workspace/field/${fieldId}/${s.key}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
              isActive
                ? "border-ink-900 bg-ink-900 text-paper"
                : "border-ink-200 bg-paper text-ink-700"
            }`}
          >
            {s.num} · {s.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}

function isStepDone(key: StepKey, fs: ReturnType<typeof useFieldState>): boolean {
  if (!fs) return false;
  switch (key) {
    case "setup":
      return true;
    case "intelligence":
      return !!fs.soil && !!fs.weather;
    case "recommendation":
      return !!fs.soil && !!fs.weather;
    case "review":
      return fs.review?.status !== "pending";
    case "trial":
      return !!fs.trial?.trialAcres;
    case "outcome":
      return !!fs.outcome?.reported;
    default:
      return false;
  }
}

function reviewBadgeTone(s: string): "moss" | "amber" | "rose" | "neutral" {
  if (s === "approved") return "moss";
  if (s === "approved_with_note") return "amber";
  if (s === "needs_revision") return "rose";
  return "neutral";
}

function reviewLabel(s: string): string {
  if (s === "approved") return "Approved";
  if (s === "approved_with_note") return "Approved (adjusted)";
  if (s === "needs_revision") return "Needs revision";
  return "Review pending";
}

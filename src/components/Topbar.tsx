"use client";

import { Logo } from "./Logo";

export type StepId =
  | "intake"
  | "recommendation"
  | "evidence"
  | "review"
  | "trial"
  | "outcome";

export const STEPS: Array<{
  id: StepId;
  label: string;
  short: string;
  hint: string;
}> = [
  {
    id: "intake",
    label: "Field intake",
    short: "Intake",
    hint: "Tell us about the field.",
  },
  {
    id: "recommendation",
    label: "Recommendation",
    short: "Recommend",
    hint: "Compare current plan vs SoilProve rate.",
  },
  {
    id: "evidence",
    label: "Peer evidence",
    short: "Evidence",
    hint: "How comparable fields fared.",
  },
  {
    id: "review",
    label: "Agronomist review",
    short: "Review",
    hint: "Stamp, adjust, or push back.",
  },
  {
    id: "trial",
    label: "Trial planner",
    short: "Trial",
    hint: "Plan a low-risk side-by-side test.",
  },
  {
    id: "outcome",
    label: "Outcome & ROI",
    short: "Outcome",
    hint: "Did it actually pay off?",
  },
];

export function Topbar({
  step,
  onStepChange,
}: {
  step: StepId;
  onStepChange: (s: StepId) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => onStepChange(s.id)}
                className={`group relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-slate-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title={s.hint}
              >
                <span className="hidden lg:inline">
                  {i + 1}. {s.label}
                </span>
                <span className="lg:hidden">{s.short}</span>
              </button>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Built for Vibeathon
          </a>
        </div>
      </div>
    </header>
  );
}

export function MobileTabs({
  step,
  onStepChange,
}: {
  step: StepId;
  onStepChange: (s: StepId) => void;
}) {
  return (
    <div className="md:hidden">
      <div className="container-page py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => onStepChange(s.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {i + 1}. {s.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

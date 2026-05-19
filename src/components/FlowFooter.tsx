"use client";

import { STEPS, StepId } from "./Topbar";

export function FlowFooter({
  step,
  onStepChange,
}: {
  step: StepId;
  onStepChange: (s: StepId) => void;
}) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="text-xs text-slate-500">
        Step {idx + 1} of {STEPS.length} · {STEPS[idx].hint}
      </div>
      <div className="flex flex-wrap gap-2">
        {prev ? (
          <button
            className="btn-ghost"
            type="button"
            onClick={() => onStepChange(prev.id)}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12.7 15.7a1 1 0 01-1.4 0l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 1.4L8.4 10l4.3 4.3a1 1 0 010 1.4z" />
            </svg>
            Back · {prev.short}
          </button>
        ) : null}
        {next ? (
          <button
            className="btn-primary"
            type="button"
            onClick={() => onStepChange(next.id)}
          >
            Continue · {next.short}
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7.3 4.3a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 11-1.4-1.4L11.6 10 7.3 5.7a1 1 0 010-1.4z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

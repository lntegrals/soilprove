import { ReactNode } from "react";

type Tone = "slate" | "terracotta" | "amber" | "emerald" | "rose" | "indigo";

const TONE_CLASS: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  terracotta: "bg-terracotta-50 text-terracotta-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

export function Badge({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`pill ${TONE_CLASS[tone]} ${className}`}>{children}</span>
  );
}

export function DemoLabel({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  if (variant === "compact") {
    return (
      <span className="pill bg-amber-50 text-amber-800 ring-1 ring-amber-200">
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 10-1.5 0v4a.75.75 0 00.22.53l2.5 2.5a.75.75 0 101.06-1.06l-2.28-2.28V6.75z" />
        </svg>
        Modeled — demo data
      </span>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <strong className="font-semibold">Prototype evidence.</strong> Cohort
      numbers and post-season results below are modeled from MRTN-style
      reference scenarios for the demo. They are not real customer outcomes.
    </div>
  );
}

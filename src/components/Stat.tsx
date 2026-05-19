import { ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
  emphasis = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: "primary" | "accent" | "muted";
}) {
  const valueClass =
    emphasis === "accent"
      ? "text-terracotta-600"
      : emphasis === "muted"
      ? "text-slate-500"
      : "text-slate-800";
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${valueClass}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}

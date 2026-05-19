import { ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  delta,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn";
  delta?: ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-moss-700"
      : tone === "bad"
      ? "text-rose2-500"
      : tone === "warn"
      ? "text-amber2-500"
      : "text-ink-900";
  return (
    <div className="flex flex-col gap-1">
      <span className="stat-label">{label}</span>
      <span className={`stat-num ${toneClass}`}>{value}</span>
      {(hint || delta) && (
        <span className="text-xs text-ink-500 flex items-center gap-2">
          {delta}
          {hint}
        </span>
      )}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
      {children}
    </div>
  );
}

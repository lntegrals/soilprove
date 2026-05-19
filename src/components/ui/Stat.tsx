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
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="stat-label">{label}</span>
      <span
        className={`stat-num leading-[1.05] break-words tabular-nums ${toneClass}`}
      >
        {value}
      </span>
      {(hint || delta) && (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-snug text-ink-500">
          {delta}
          {hint}
        </span>
      )}
    </div>
  );
}

type StatRowCols = 2 | 3 | 4;

export function StatRow({
  children,
  cols = 4,
}: {
  children: ReactNode;
  cols?: StatRowCols;
}) {
  const grid =
    cols === 2
      ? "grid-cols-2 md:grid-cols-2"
      : cols === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid ${grid} gap-x-6 gap-y-5`}>
      {children}
    </div>
  );
}

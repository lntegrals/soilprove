import { ReactNode } from "react";

type Tone = "neutral" | "moss" | "loam" | "clay" | "sky" | "ink" | "amber" | "rose";

const TONES: Record<Tone, { bg: string; fg: string; ring: string; dot: string }> = {
  neutral: { bg: "bg-ink-50", fg: "text-ink-700", ring: "ring-ink-200", dot: "bg-ink-400" },
  moss:    { bg: "bg-moss-50", fg: "text-moss-700", ring: "ring-moss-200", dot: "bg-moss-500" },
  loam:    { bg: "bg-loam-50", fg: "text-loam-700", ring: "ring-loam-200", dot: "bg-loam-500" },
  clay:    { bg: "bg-clay-50", fg: "text-clay-700", ring: "ring-clay-200", dot: "bg-clay-500" },
  sky:     { bg: "bg-sky2-50", fg: "text-sky2-700", ring: "ring-sky2-200", dot: "bg-sky2-500" },
  amber:   { bg: "bg-amber2-50", fg: "text-amber2-500", ring: "ring-amber2-400/40", dot: "bg-amber2-400" },
  rose:    { bg: "bg-rose2-50", fg: "text-rose2-500", ring: "ring-rose2-400/40", dot: "bg-rose2-400" },
  ink:     { bg: "bg-ink-900", fg: "text-paper", ring: "ring-ink-900", dot: "bg-loam-300" },
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${t.bg} ${t.fg} ${t.ring} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

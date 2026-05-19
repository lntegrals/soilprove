import { SVGProps } from "react";

export function Logo(props: { className?: string; mono?: boolean }) {
  const { className, mono } = props;
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Mark mono={mono} />
      <span
        className={`font-display text-[15px] font-semibold tracking-tightish ${
          mono ? "text-paper" : "text-ink-900"
        }`}
      >
        SoilProve
      </span>
    </span>
  );
}

function Mark({ mono }: { mono?: boolean }) {
  const fill = mono ? "#ffffff" : "#0F1410";
  const accent = mono ? "#CFB385" : "#557A42";
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15.5" stroke={fill} strokeOpacity={0.18} />
      <path
        d="M5 22.5C9 14 13 11 16 11s7 3 11 11.5"
        stroke={fill}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 22.5c3-5 4.5-8 7-8s4 3 7 8"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="9.5" r="1.8" fill={accent} />
    </svg>
  );
}

export function SoilGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 10c4-5 14-5 18 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M2 14h20" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 18h20" stroke="currentColor" strokeWidth="1.2" opacity={0.6} />
      <path d="M2 21h20" stroke="currentColor" strokeWidth="1.2" opacity={0.35} />
    </svg>
  );
}

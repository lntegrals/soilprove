"use client";

import { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
}) {
  const colSpan = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
  }[span];
  return (
    <label className={`flex flex-col ${colSpan}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 text-[11px] text-ink-500">{hint}</span>}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-ink-200 bg-paper p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition ${
            value === o.value
              ? "bg-ink-900 text-paper"
              : "text-ink-600 hover:bg-ink-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  prefix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className={`field-input ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.1em] text-ink-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

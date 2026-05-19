import { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  pad = true,
  tone = "default",
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  pad?: boolean;
  tone?: "default" | "dark";
  className?: string;
}) {
  const base =
    tone === "dark"
      ? "rounded-2xl border border-ink-800 bg-ink-900 text-paper shadow-lift"
      : "rounded-2xl border border-ink-100 bg-paper shadow-card";
  return (
    <section className={`${base} ${className}`}>
      {(title || right) && (
        <header
          className={`flex items-start justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 ${
            children ? "pb-3" : "pb-5"
          }`}
        >
          <div>
            {title && (
              <h3 className={tone === "dark" ? "text-paper" : "text-ink-900"}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className={`mt-1 text-sm ${
                  tone === "dark" ? "text-ink-200" : "text-ink-500"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className={pad ? "px-5 pb-5 md:px-6 md:pb-6" : ""}>{children}</div>
    </section>
  );
}

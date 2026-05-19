export const fmtUSD = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n);

export const fmtUSD2 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

export const fmtLb = (n: number) => `${Math.round(n)} lb`;
export const fmtLbAc = (n: number) => `${Math.round(n)} lb/ac`;
export const fmtBuAc = (n: number) => `${n.toFixed(1)} bu/ac`;
export const fmtAcres = (n: number) => `${n.toLocaleString()} ac`;
export const fmtPct = (n: number) => `${Math.round(n)}%`;
export const fmtPctFrac = (n: number) => `${Math.round(n * 100)}%`;
export const fmtInches = (n: number) => `${n.toFixed(2)} in`;
export const fmtTempF = (n: number) => `${Math.round(n)}°F`;

export const signedInt = (n: number, suffix = "") => {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(Math.round(n))}${suffix}`;
};

export const signedUSD = (n: number) => {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${fmtUSD(Math.abs(n))}`;
};

export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export const shortDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

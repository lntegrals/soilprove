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

export const fmtLb = (n: number) => `${Math.round(n)} lb N / ac`;

export const fmtBu = (n: number) => `${n.toFixed(1)} bu / ac`;

export const fmtPct = (n: number) => `${(n * 100).toFixed(0)}%`;

export const signed = (n: number, suffix = "") =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n))}${suffix}`;

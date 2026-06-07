export type Currency = "USDC" | "EURC";
export type Status = "Active" | "Tripped" | "Released";

export interface Beneficiary {
  account: string;
  shares: number; // basis points (10000 = 100%)
  label?: string;
}

export interface Switch {
  id: number;
  owner: string;
  currency: Currency;
  balance: number; // human units
  checkInInterval: number; // seconds
  lastCheckIn: number; // unix seconds
  status: Status;
  beneficiaries: Beneficiary[];
}

export function fmtMoney(n: number, c: Currency = "USDC") {
  const sym = c === "USDC" ? "$" : "€";
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function fmtCountdown(secs: number) {
  if (secs <= 0) return "00:00:00";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (x: number) => String(x).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function intervalLabel(secs: number) {
  if (secs >= 86400 * 365) return `${Math.round(secs / (86400 * 365))} year`;
  if (secs >= 86400 * 7) return `${Math.round(secs / (86400 * 7))} week${secs > 86400 * 7 ? "s" : ""}`;
  if (secs >= 86400) return `${Math.round(secs / 86400)} day${secs > 86400 ? "s" : ""}`;
  if (secs >= 3600) return `${Math.round(secs / 3600)} hour${secs > 3600 ? "s" : ""}`;
  return `${Math.round(secs / 60)} min`;
}

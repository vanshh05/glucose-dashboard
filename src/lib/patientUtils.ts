// Patient-side helpers. Zone classification uses friendly, round-number
// ranges (not Clarke) because this is a consumer view. Clarke zones are for
// the research dashboard.

export type GlucoseZone = "low" | "normal" | "elevated" | "high";

export function glucoseZone(mgdl: number): GlucoseZone {
  if (mgdl < 70) return "low";
  if (mgdl <= 140) return "normal";
  if (mgdl <= 180) return "elevated";
  return "high";
}

export function zoneColor(z: GlucoseZone): string {
  switch (z) {
    case "low":      return "#E63946";
    case "normal":   return "#02C39A";
    case "elevated": return "#F5A623";
    case "high":     return "#E63946";
  }
}

export function zoneLabel(z: GlucoseZone): string {
  switch (z) {
    case "low":      return "Below normal range";
    case "normal":   return "Within normal range";
    case "elevated": return "Elevated";
    case "high":     return "Above normal range";
  }
}

export function fmtMgdl(v: number | null | undefined): string {
  return v == null ? "—" : `${Number(v).toFixed(0)} mg/dL`;
}

// Friendly relative time: "just now", "5 min ago", "2 h ago", "yesterday", "Sep 12".
export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);

  if (diff < 45) return "just now";
  if (diff < 90) return "a minute ago";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 5400) return "an hour ago";
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  if (diff < 172800) return "yesterday";
  if (diff < 7 * 86400) return `${Math.round(diff / 86400)} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

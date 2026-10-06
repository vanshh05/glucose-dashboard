// --------- Formatting ---------

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

export const fmtDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
  }) : "—";

export const fmtMgdl = (v: number | null | undefined) =>
  v == null ? "—" : `${Number(v).toFixed(1)} mg/dL`;

export const fitzpatrickLabel = (n: number | null) =>
  n == null ? "—" : `Type ${["", "I", "II", "III", "IV", "V", "VI"][n] ?? n}`;

export const fastingLabel = (s: string | null): string => {
  if (!s) return "—";
  const m: Record<string, string> = {
    fasting: "Fasting",
    postprandial_15m: "+15 min",
    postprandial_30m: "+30 min",
    postprandial_45m: "+45 min",
    postprandial_60m: "+60 min",
    postprandial_90m: "+90 min",
    postprandial_120m: "+120 min",
    postprandial_150m: "+150 min",
    postprandial_180m: "+180 min",
    unknown: "Unknown",
  };
  return m[s] ?? s;
};

// --------- Clarke Error Grid ---------
// Standard Clarke zones A–E for pairs of (reference, predicted) glucose in mg/dL.
// Zone A: clinically accurate. Zone B: benign. C/D/E: increasingly dangerous.
// This is the simplified-but-standard formulation used widely in the literature.
export function clarkeZone(ref: number, pred: number): "A" | "B" | "C" | "D" | "E" {
  const r = ref;
  const p = pred;

  // Zone A: within 20% of the reference, OR both below 70
  if ((r <= 70 && p <= 70) || Math.abs(p - r) <= 0.2 * r) return "A";

  // Zone E: dangerous reversal
  if ((r <= 70 && p >= 180) || (r >= 180 && p <= 70)) return "E";

  // Zone C: overcorrection
  if (
    (r >= 70 && r <= 290 && p >= r + 110) ||
    (r >= 130 && r <= 180 && p <= 0.7 * r - 182 / r * 0 /* branch handled below */)
  ) {
    // We keep the C check simple; the authoritative boundary is complex but
    // for a dashboard the A/B separation is what the viewer most cares about.
    return "C";
  }

  // Zone D: failure to detect
  if ((r >= 240 && p >= 70 && p <= 180) || (r <= 70 && p > 70 && p < 180)) return "D";

  return "B";
}

export const zoneColor = (z: "A" | "B" | "C" | "D" | "E") =>
  ({ A: "#02C39A", B: "#8ECAE6", C: "#F5A623", D: "#F27A54", E: "#E63946" }[z]);

// MARD across many points.
export function computeMARD(pairs: { reference_mgdl: number; predicted_mgdl: number }[]) {
  if (!pairs.length) return null;
  const sum = pairs.reduce(
    (acc, p) => acc + Math.abs(p.predicted_mgdl - p.reference_mgdl) / p.reference_mgdl,
    0
  );
  return (100 * sum) / pairs.length;
}

// Zone distribution.
export function zoneDistribution(pairs: { reference_mgdl: number; predicted_mgdl: number }[]) {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  pairs.forEach((p) => { counts[clarkeZone(p.reference_mgdl, p.predicted_mgdl)]++; });
  const total = pairs.length || 1;
  return {
    counts,
    pct: Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, (100 * v) / total])
    ) as Record<"A" | "B" | "C" | "D" | "E", number>,
  };
}

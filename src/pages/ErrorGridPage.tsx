import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from "recharts";
import { supabase, ErrorGridPoint } from "../lib/supabase";
import { PageHeader, Card, Stat, LoadingBlock, ErrorBlock } from "../components/ui";
import { clarkeZone, computeMARD, zoneColor, zoneDistribution } from "../lib/utils";

export default function ErrorGridPage() {
  const [points, setPoints] = useState<ErrorGridPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("v_error_grid_points").select("*");
      if (error) setErr(error.message); else setPoints((data || []) as ErrorGridPoint[]);
      setLoading(false);
    })();
  }, []);

  const mard = useMemo(() => computeMARD(points), [points]);
  const dist = useMemo(() => zoneDistribution(points), [points]);

  // Group by zone for colored scatter.
  const byZone = useMemo(() => {
    const g: Record<string, { x: number; y: number }[]> = { A: [], B: [], C: [], D: [], E: [] };
    for (const p of points) {
      const z = clarkeZone(p.reference_mgdl, p.predicted_mgdl);
      g[z].push({ x: p.reference_mgdl, y: p.predicted_mgdl });
    }
    return g;
  }, [points]);

  // Diagonal reference line data.
  const diag = [{ x: 0, y: 0 }, { x: 400, y: 400 }];

  return (
    <>
      <PageHeader
        kicker="Credibility"
        title="Clarke Error Grid"
        subtitle="Predicted vs reference glucose over clinical zones. Zones A and B are clinically acceptable; C–E are increasingly dangerous errors."
      />

      {err && <ErrorBlock error={err} />}
      {loading ? <LoadingBlock /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Stat label="Pairs" value={points.length} />
            <Stat label="MARD" value={mard == null ? "—" : `${mard.toFixed(1)}%`} tone="mint" />
            <Stat label="Zone A" value={`${dist.pct.A.toFixed(0)}%`} tone="mint" hint={`${dist.counts.A} pts`} />
            <Stat label="Zone B" value={`${dist.pct.B.toFixed(0)}%`} hint={`${dist.counts.B} pts`} />
            <Stat label="Zones C–E"
                  value={`${(dist.pct.C + dist.pct.D + dist.pct.E).toFixed(0)}%`}
                  tone={(dist.pct.C + dist.pct.D + dist.pct.E) > 5 ? "danger" : "default"}
                  hint={`${dist.counts.C + dist.counts.D + dist.counts.E} pts`} />
          </div>

          <Card>
            <div style={{ width: "100%", height: 500 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid stroke="#E3EBEB" />
                  <XAxis
                    type="number" dataKey="x"
                    name="Reference" unit=" mg/dL"
                    domain={[0, 400]} stroke="#5B7A82" fontSize={11}
                    label={{ value: "Reference glucose (mg/dL)", position: "insideBottom", offset: -15, fill: "#5B7A82", fontSize: 12 }}
                  />
                  <YAxis
                    type="number" dataKey="y"
                    name="Predicted" unit=" mg/dL"
                    domain={[0, 400]} stroke="#5B7A82" fontSize={11}
                    label={{ value: "Predicted glucose (mg/dL)", angle: -90, position: "insideLeft", fill: "#5B7A82", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(v: any) => (typeof v === "number" ? v.toFixed(1) : v)}
                  />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 400, y: 400 }]} stroke="#5B7A82" strokeDasharray="4 4" />
                  <ReferenceLine x={70} stroke="#F5A623" strokeDasharray="4 4" />
                  <ReferenceLine x={180} stroke="#F5A623" strokeDasharray="4 4" />
                  <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="4 4" />
                  <ReferenceLine y={180} stroke="#F5A623" strokeDasharray="4 4" />
                  {(["A", "B", "C", "D", "E"] as const).map((z) => (
                    <Scatter key={z} name={`Zone ${z}`} data={byZone[z]} fill={zoneColor(z)} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {/* Hidden series carrying the diagonal so Recharts registers the domain */}
                  <Scatter name="y=x" data={diag} fill="transparent" legendType="none" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-mute mt-2">
              This is a simplified Clarke-zone visualization. Full A/B/C/D/E boundaries are approximated for display;
              the authoritative per-paper boundary analysis belongs in the model evaluation report, not the dashboard.
            </p>
          </Card>
        </>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { supabase, DataQualityRow } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Stat } from "../components/ui";
import { fitzpatrickLabel } from "../lib/utils";

export default function DataQualityPage() {
  const [rows, setRows] = useState<DataQualityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("v_data_quality").select("*").order("pseudonym");
      if (error) setErr(error.message); else setRows((data || []) as DataQualityRow[]);
      setLoading(false);
    })();
  }, []);

  const barData = useMemo(() =>
    rows.map((r) => ({
      pseudonym: r.pseudonym,
      ok: Number(r.sessions_ok) || 0,
      rejected: Number(r.sessions_rejected) || 0,
    })),
    [rows]
  );

  const fitzBreakdown = useMemo(() => {
    const buckets: Record<number, number> = {};
    rows.forEach((r) => {
      const k = r.fitzpatrick ?? 0;
      buckets[k] = (buckets[k] || 0) + 1;
    });
    return Object.entries(buckets).map(([k, v]) => ({
      label: Number(k) === 0 ? "Unknown" : fitzpatrickLabel(Number(k)),
      count: v,
    }));
  }, [rows]);

  const totals = useMemo(() => ({
    subjects: rows.length,
    sessions: rows.reduce((s, r) => s + Number(r.total_sessions || 0), 0),
    rejected: rows.reduce((s, r) => s + Number(r.sessions_rejected || 0), 0),
    paired:   rows.reduce((s, r) => s + Number(r.sessions_with_ground_truth || 0), 0),
  }), [rows]);

  return (
    <>
      <PageHeader kicker="Honesty panel" title="Data Quality" subtitle="Coverage, rejections, and per-group distribution. This is what surfaces bias instead of hiding it." />

      {err && <ErrorBlock error={err} />}
      {loading ? <LoadingBlock /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="Subjects" value={totals.subjects} />
            <Stat label="Sessions" value={totals.sessions} />
            <Stat label="Rejected" value={totals.rejected} tone={totals.rejected ? "amber" : "default"} hint={`${((100 * totals.rejected) / (totals.sessions || 1)).toFixed(1)}%`} />
            <Stat label="Paired ground truth" value={totals.paired} hint={`${((100 * totals.paired) / (totals.sessions || 1)).toFixed(0)}% of sessions`} />
          </div>

          <Card className="mb-6">
            <h2 className="font-serif text-lg font-bold text-ink mb-1">Sessions per subject</h2>
            <p className="text-xs text-mute mb-4">OK captures vs quality-rejected, per subject.</p>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#E3EBEB" strokeDasharray="3 3" />
                  <XAxis dataKey="pseudonym" stroke="#5B7A82" fontSize={11} />
                  <YAxis stroke="#5B7A82" fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="ok" stackId="a" fill="#02C39A" name="Quality OK" />
                  <Bar dataKey="rejected" stackId="a" fill="#F5A623" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-ink mb-1">Fitzpatrick coverage</h2>
            <p className="text-xs text-mute mb-4">Subject count by skin type — needed for bias reporting.</p>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={fitzBreakdown} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#E3EBEB" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#5B7A82" fontSize={11} />
                  <YAxis stroke="#5B7A82" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#028090" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

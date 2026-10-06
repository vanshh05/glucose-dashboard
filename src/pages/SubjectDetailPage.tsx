import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  Area, Line, Scatter, ReferenceLine, Legend,
} from "recharts";
import { supabase, SessionOverview, Subject } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Stat, Badge } from "../components/ui";
import { fastingLabel, fitzpatrickLabel, fmtDate, fmtMgdl } from "../lib/utils";

export default function SubjectDetailPage() {
  const { pseudonym } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<SessionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!pseudonym) return;
    (async () => {
      try {
        const { data: subj, error: eSubj } = await supabase
          .from("subjects").select("*").eq("pseudonym", pseudonym).single();
        if (eSubj) throw eSubj;
        setSubject(subj as Subject);

        const { data: sess, error: eSess } = await supabase
          .from("v_session_overview").select("*")
          .eq("subject_pseudonym", pseudonym)
          .order("captured_at", { ascending: true });
        if (eSess) throw eSess;
        setSessions((sess || []) as SessionOverview[]);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [pseudonym]);

  // Chart data: use ms-timestamp as X so OGTT ordering is correct.
  const chartData = useMemo(
    () => sessions
      .filter((s) => s.predicted_mgdl != null || s.ground_truth_mgdl != null)
      .map((s) => ({
        t: new Date(s.captured_at).getTime(),
        predicted: s.predicted_mgdl != null ? Number(s.predicted_mgdl) : null,
        ciLow: s.predicted_ci_low != null ? Number(s.predicted_ci_low) : null,
        ciHigh: s.predicted_ci_high != null ? Number(s.predicted_ci_high) : null,
        band: s.predicted_ci_low != null && s.predicted_ci_high != null
          ? [Number(s.predicted_ci_low), Number(s.predicted_ci_high)]
          : null,
        reference: s.ground_truth_mgdl != null ? Number(s.ground_truth_mgdl) : null,
        label: fmtDate(s.captured_at),
      })),
    [sessions]
  );

  const okCount = sessions.filter((s) => s.quality_ok).length;
  const gtCount = sessions.filter((s) => s.ground_truth_mgdl != null).length;

  if (loading) return <LoadingBlock />;
  if (err) return <ErrorBlock error={err} />;
  if (!subject) return <ErrorBlock error="Subject not found." />;

  return (
    <>
      <div className="mb-4 text-sm">
        <Link to="/subjects" className="text-teal hover:underline">← Subjects</Link>
      </div>

      <PageHeader
        kicker={`Subject ${subject.pseudonym}`}
        title={subject.pseudonym}
        subtitle={`${subject.age_band ?? "age ?"} · ${fitzpatrickLabel(subject.fitzpatrick)} · ${subject.sex_at_birth ?? "—"}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Sessions" value={sessions.length} />
        <Stat label="OK" value={okCount} tone="mint" />
        <Stat label="Rejected" value={sessions.length - okCount} tone={sessions.length - okCount > 0 ? "amber" : "default"} />
        <Stat label="Paired ground truth" value={gtCount} />
      </div>

      <Card className="mb-6">
        <h2 className="font-serif text-lg font-bold text-ink mb-1">Glucose trend</h2>
        <p className="text-xs text-mute mb-4">
          Shaded band is the model's confidence interval. Dots are paired finger-prick readings (ground truth).
        </p>

        {chartData.length === 0 ? (
          <div className="text-mute text-sm py-8 text-center">No predictions yet for this subject.</div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3EBEB" />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  stroke="#5B7A82"
                  fontSize={11}
                />
                <YAxis
                  stroke="#5B7A82"
                  fontSize={11}
                  domain={[40, 220]}
                  label={{ value: "mg/dL", angle: -90, position: "insideLeft", style: { fill: "#5B7A82", fontSize: 11 } }}
                />
                <Tooltip
                  labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  formatter={(value: any, name: string) => {
                    if (name === "band") return null;
                    return [typeof value === "number" ? value.toFixed(1) : value, name];
                  }}
                />
                <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="4 4" label={{ value: "70", position: "right", fill: "#F5A623", fontSize: 10 }} />
                <ReferenceLine y={180} stroke="#F5A623" strokeDasharray="4 4" label={{ value: "180", position: "right", fill: "#F5A623", fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="band"
                  stroke="none"
                  fill="#028090"
                  fillOpacity={0.15}
                  isAnimationActive={false}
                  name="CI band"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#028090"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#028090" }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  name="Predicted"
                />
                <Scatter dataKey="reference" fill="#E63946" shape="circle" name="Reference" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-bold text-ink mb-4">All sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-mute border-b border-[#E3EBEB]">
              <tr>
                <th className="text-left py-2 pr-4">Captured</th>
                <th className="text-left py-2 pr-4">State</th>
                <th className="text-left py-2 pr-4">Reference</th>
                <th className="text-left py-2 pr-4">Predicted</th>
                <th className="text-left py-2 pr-4">Quality</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} className="border-b border-[#F0F4F4] last:border-0">
                  <td className="py-2 pr-4">
                    <Link to={`/sessions/${s.session_id}`} className="hover:text-teal">{fmtDate(s.captured_at)}</Link>
                  </td>
                  <td className="py-2 pr-4 text-mute">{fastingLabel(s.fasting_state)}</td>
                  <td className="py-2 pr-4">{fmtMgdl(s.ground_truth_mgdl)}</td>
                  <td className="py-2 pr-4">{fmtMgdl(s.predicted_mgdl)}</td>
                  <td className="py-2 pr-4">
                    {s.quality_ok ? <Badge tone="ok">OK</Badge> : <Badge tone="warn">{s.quality_reason}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

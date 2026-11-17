import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { supabase, SessionOverview } from "../../lib/supabase";
import { formatRelative, glucoseZone, zoneColor } from "../../lib/patientUtils";

const CURRENT_SUBJECT = "S007";
type Range = "day" | "week" | "month" | "all";

export default function MeHistoryPage() {
  const [sessions, setSessions] = useState<SessionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("week");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("v_session_overview")
        .select("*")
        .eq("subject_pseudonym", CURRENT_SUBJECT)
        .not("predicted_mgdl", "is", null)
        .order("captured_at", { ascending: true });
      setSessions((data || []) as SessionOverview[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (range === "all") return sessions;
    const cutoff = new Date();
    if (range === "day")   cutoff.setDate(cutoff.getDate() - 1);
    if (range === "week")  cutoff.setDate(cutoff.getDate() - 7);
    if (range === "month") cutoff.setMonth(cutoff.getMonth() - 1);
    return sessions.filter((s) => new Date(s.captured_at) >= cutoff);
  }, [sessions, range]);

  const chartData = useMemo(
    () => filtered.map((s) => ({
      t: new Date(s.captured_at).getTime(),
      value: s.predicted_mgdl != null ? Number(s.predicted_mgdl) : null,
    })),
    [filtered]
  );

  const stats = useMemo(() => {
    const vals = filtered.map((s) => Number(s.predicted_mgdl)).filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const inRange = vals.filter((v) => v >= 70 && v <= 180).length;
    return {
      count: vals.length,
      avg: Math.round(avg),
      min: Math.min(...vals),
      max: Math.max(...vals),
      inRangePct: Math.round((100 * inRange) / vals.length),
    };
  }, [filtered]);

  if (loading) return <div className="px-5 py-16 text-center text-mute text-sm">Loading…</div>;

  return (
    <div>
      <section className="px-5 pt-6 pb-4 bg-white">
        <h1 className="font-serif text-2xl font-bold text-ink">History</h1>
        <p className="text-xs text-mute mt-1">All your past readings, by range.</p>

        <div className="mt-4 flex gap-1 bg-panel p-1 rounded-lg">
          {(["day", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize ${
                range === r ? "bg-white text-teal shadow-sm" : "text-mute"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {stats ? (
          <>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              <Stat label="Avg" value={`${stats.avg}`} />
              <Stat label="Min" value={`${stats.min.toFixed(0)}`} />
              <Stat label="Max" value={`${stats.max.toFixed(0)}`} />
              <Stat label="In range" value={`${stats.inRangePct}%`} tone="mint" />
            </div>

            <div className="mt-5" style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -26 }}>
                  <CartesianGrid stroke="#F0F4F4" vertical={false} />
                  <XAxis
                    dataKey="t" type="number" domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    tick={{ fill: "#5B7A82", fontSize: 10 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis domain={[40, 220]} tick={{ fill: "#5B7A82", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v as number).toLocaleString()}
                    formatter={(v: any) => [typeof v === "number" ? v.toFixed(0) + " mg/dL" : v, "Estimate"]}
                  />
                  <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="3 3" strokeOpacity={0.6} />
                  <ReferenceLine y={180} stroke="#F5A623" strokeDasharray="3 3" strokeOpacity={0.6} />
                  <Line type="monotone" dataKey="value" stroke="#028090" strokeWidth={2} dot={{ r: 2.5, fill: "#028090" }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="mt-6 text-sm text-mute text-center py-6">
            No readings in this range yet.
          </div>
        )}
      </section>

      <section className="mt-3 px-5 pt-4 pb-6 bg-white">
        <h2 className="font-serif text-base font-bold text-ink mb-3">All readings</h2>
        {filtered.length === 0 ? (
          <div className="text-xs text-mute text-center py-6">Nothing in this range.</div>
        ) : (
          <div className="divide-y divide-[#F0F4F4]">
            {[...filtered].reverse().map((s) => {
              const v = s.predicted_mgdl != null ? Number(s.predicted_mgdl) : null;
              const z = v != null ? glucoseZone(v) : null;
              return (
                <Link
                  to={`/me/session/${s.session_id}`}
                  key={s.session_id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {v != null ? v.toFixed(0) : "—"} <span className="text-xs text-mute font-normal">mg/dL</span>
                    </div>
                    <div className="text-[11px] text-mute mt-0.5">
                      {formatRelative(s.captured_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {z && (
                      <span className="w-2 h-2 rounded-full" style={{ background: zoneColor(z) }} />
                    )}
                    <span className="text-mute text-xs">›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "mint" }) {
  const color = tone === "mint" ? "text-mint" : "text-ink";
  return (
    <div className="bg-panel rounded-lg p-2.5">
      <div className={`font-serif text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-mute mt-0.5">{label}</div>
    </div>
  );
}

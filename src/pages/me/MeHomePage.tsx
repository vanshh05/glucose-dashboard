import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { supabase, SessionOverview } from "../../lib/supabase";
import { glucoseZone, formatRelative, zoneColor, zoneLabel } from "../../lib/patientUtils";
// For demo purposes we treat S007 as "the signed-in subject." A real app would
// resolve this from an auth session; see note in the About page.
const CURRENT_SUBJECT = "S007";

export default function MeHomePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionOverview[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("v_session_overview")
        .select("*")
        .eq("subject_pseudonym", CURRENT_SUBJECT)
        .not("predicted_mgdl", "is", null)
        .order("captured_at", { ascending: false })
        .limit(30);
      if (error) setErr(error.message);
      else setSessions((data || []) as SessionOverview[]);
      setLoading(false);
    })();
  }, []);

  const latest = sessions[0];
  const latestValue = latest?.predicted_mgdl != null ? Number(latest.predicted_mgdl) : null;
  const latestZone = latestValue != null ? glucoseZone(latestValue) : null;

  // For the mini trend, we want oldest → newest.
  const trendData = useMemo(() => {
    return [...sessions]
      .reverse()
      .slice(-20)
      .map((s) => ({
        t: new Date(s.captured_at).getTime(),
        value: s.predicted_mgdl != null ? Number(s.predicted_mgdl) : null,
      }));
  }, [sessions]);

  if (loading) {
    return <div className="px-5 py-16 text-center text-mute text-sm">Loading…</div>;
  }
  if (err) {
    return <div className="px-5 py-6 text-danger text-sm">{err}</div>;
  }
  if (!latest || latestValue == null) {
    return <EmptyHome />;
  }

  return (
    <div>
      {/* Hero — current estimate */}
      <section className="px-5 pt-6 pb-4 bg-white">
        <div className="text-[11px] uppercase tracking-widest text-mute mb-2">
          Current estimate
        </div>

        <div className="flex items-baseline gap-2">
          <div
            className="font-serif text-6xl font-bold"
            style={{ color: zoneColor(latestZone!) }}
          >
            {latestValue.toFixed(0)}
          </div>
          <div className="text-mute text-sm">mg/dL</div>
        </div>

        <div className="mt-1 text-xs text-ink">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
            style={{ background: zoneColor(latestZone!) }}
          />
          {zoneLabel(latestZone!)}
          {latest.predicted_ci_low != null && latest.predicted_ci_high != null && (
            <span className="text-mute ml-2">
              estimate range {latest.predicted_ci_low?.toFixed(0)}–{latest.predicted_ci_high?.toFixed(0)}
            </span>
          )}
        </div>

        <div className="mt-2 text-xs text-mute">
          Measured {formatRelative(latest.captured_at)}
        </div>

        <div className="mt-5 flex gap-2">
          <Link
            to="/me/capture"
            className="flex-1 bg-teal text-white text-sm font-semibold py-3 rounded-xl text-center shadow-sm active:scale-[0.99] transition"
          >
            Take a new reading
          </Link>
          <Link
            to={`/me/session/${latest.session_id}`}
            className="px-4 py-3 border border-[#D8E4E4] rounded-xl text-sm font-medium text-ink"
          >
            Details
          </Link>
        </div>
      </section>

      {/* Mini trend */}
      <section className="mt-3 px-5 pt-4 pb-5 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-base font-bold text-ink">Recent trend</h2>
          <Link to="/me/history" className="text-xs text-teal font-semibold">See all →</Link>
        </div>

        {trendData.length < 2 ? (
          <div className="text-xs text-mute text-center py-8">
            Take a few readings to see your trend.
          </div>
        ) : (
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 5, right: 0, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#028090" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#028090" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} hide />
                <YAxis domain={[40, 220]} tick={{ fill: "#5B7A82", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  formatter={(v: any) => [typeof v === "number" ? v.toFixed(0) + " mg/dL" : v, "Estimate"]}
                />
                <ReferenceLine y={70}  stroke="#F5A623" strokeDasharray="3 3" strokeOpacity={0.6} />
                <ReferenceLine y={180} stroke="#F5A623" strokeDasharray="3 3" strokeOpacity={0.6} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#028090"
                  strokeWidth={2}
                  fill="url(#g1)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex gap-4 mt-1 text-[11px] text-mute">
          <span className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-amber opacity-80"/> clinical bounds 70 · 180
          </span>
        </div>
      </section>

      {/* Research reminder */}
      <section className="mt-3 mx-4 mb-6 p-3.5 bg-amber/10 border border-amber/25 rounded-xl text-[11px] text-[#8A5A00] leading-relaxed">
        These numbers are <strong>experimental estimates</strong>, not medical measurements.
        Do not use them to decide insulin, food, or any treatment. Confirm with your usual
        glucometer if something seems off.
      </section>
    </div>
  );
}

function EmptyHome() {
  return (
    <div className="px-6 pt-20 text-center">
      <div className="text-5xl mb-4">🩸</div>
      <h2 className="font-serif text-xl font-bold text-ink mb-2">No readings yet</h2>
      <p className="text-sm text-mute mb-6">
        Take your first measurement to start tracking.
      </p>
      <Link
        to="/me/capture"
        className="inline-block bg-teal text-white font-semibold py-3 px-6 rounded-xl"
      >
        Take a reading
      </Link>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase, SessionOverview } from "../../lib/supabase";
import { formatRelative, glucoseZone, zoneColor, zoneLabel } from "../../lib/patientUtils";

export default function MeSessionDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sess, setSess] = useState<SessionOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("v_session_overview").select("*").eq("session_id", id).single();
      setSess(data as SessionOverview);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="px-5 py-16 text-center text-mute text-sm">Loading…</div>;
  if (!sess) return <div className="px-5 py-10 text-danger text-sm">Reading not found.</div>;

  const value = sess.predicted_mgdl != null ? Number(sess.predicted_mgdl) : null;
  const zone = value != null ? glucoseZone(value) : null;

  return (
    <div>
      <div className="px-5 pt-4">
        <button onClick={() => nav(-1)} className="text-sm text-teal font-semibold">← Back</button>
      </div>

      <section className="px-5 pt-4 pb-5 bg-white">
        <div className="text-[11px] uppercase tracking-widest text-mute mb-2">Reading</div>
        {value != null && zone ? (
          <>
            <div className="flex items-baseline gap-2">
              <div className="font-serif text-5xl font-bold" style={{ color: zoneColor(zone) }}>
                {value.toFixed(0)}
              </div>
              <div className="text-mute text-sm">mg/dL</div>
            </div>
            <div className="mt-1 text-xs text-ink">
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: zoneColor(zone) }}/>
              {zoneLabel(zone)}
            </div>
            {sess.predicted_ci_low != null && sess.predicted_ci_high != null && (
              <div className="mt-2 text-xs text-mute">
                Estimate range: {sess.predicted_ci_low?.toFixed(0)}–{sess.predicted_ci_high?.toFixed(0)} mg/dL
              </div>
            )}
          </>
        ) : (
          <div className="text-mute text-sm">No prediction for this reading.</div>
        )}

        <div className="mt-3 text-xs text-mute">
          Taken {formatRelative(sess.captured_at)} · model {sess.model_version ?? "—"}
        </div>
      </section>

      <section className="mt-3 px-5 pt-4 pb-5 bg-white">
        <h2 className="font-serif text-base font-bold text-ink mb-3">Capture details</h2>
        <KV k="Device" v={sess.device_code} />
        <KV k="Quality" v={sess.quality_ok ? "Good" : `Rejected (${sess.quality_reason ?? "unknown"})`} />
        <KV k="Skin temp" v={sess.skin_temp_c != null ? `${sess.skin_temp_c} °C` : "—"} />
        <KV k="Contact" v={sess.pressure_raw != null ? `${sess.pressure_raw}` : "—"} />
        <KV k="Motion" v={sess.motion_index_max != null ? `${sess.motion_index_max}` : "—"} />
        <KV k="Blood-flow index" v={sess.perfusion_index != null ? `${sess.perfusion_index}` : "—"} />
      </section>

      {sess.ground_truth_mgdl != null && (
        <section className="mt-3 px-5 pt-4 pb-5 bg-white">
          <h2 className="font-serif text-base font-bold text-ink mb-1">Reference reading</h2>
          <p className="text-xs text-mute mb-3">A paired finger-prick reading was recorded for this session.</p>
          <div className="flex items-baseline gap-2">
            <div className="font-serif text-2xl font-bold text-ink">{Number(sess.ground_truth_mgdl).toFixed(0)}</div>
            <div className="text-mute text-sm">mg/dL · finger-prick</div>
          </div>
        </section>
      )}

      <section className="mx-4 mt-3 mb-6 p-3.5 bg-amber/10 border border-amber/25 rounded-xl text-[11px] text-[#8A5A00] leading-relaxed">
        Reminder: this is an <strong>experimental estimate</strong>, not a medical measurement.
      </section>

      <div className="px-5 pb-6">
        <Link to="/me/capture" className="block w-full bg-teal text-white font-semibold py-3 rounded-xl text-center">
          Take another reading
        </Link>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-[#F0F4F4] last:border-0">
      <span className="text-mute">{k}</span>
      <span className="text-ink font-medium">{v}</span>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase, SessionOverview } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Badge, EmptyBlock } from "../components/ui";
import { fastingLabel, fmtDate, fmtMgdl } from "../lib/utils";

type RawCount = { channel: string; sample_count: number };

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<SessionOverview | null>(null);
  const [rawCounts, setRawCounts] = useState<RawCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: s, error: eSess } = await supabase
          .from("v_session_overview").select("*").eq("session_id", id).single();
        if (eSess) throw eSess;
        setSession(s as SessionOverview);

        const { data: raws } = await supabase
          .from("raw_windows").select("channel, sample_count").eq("session_id", id);
        setRawCounts((raws || []) as RawCount[]);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingBlock />;
  if (err) return <ErrorBlock error={err} />;
  if (!session) return <ErrorBlock error="Session not found." />;

  return (
    <>
      <div className="mb-4 text-sm">
        <Link to="/sessions" className="text-teal hover:underline">← Sessions</Link>
      </div>

      <PageHeader
        kicker="Session detail"
        title={fmtDate(session.captured_at)}
        subtitle={`Subject ${session.subject_pseudonym} · Device ${session.device_code} · ${fastingLabel(session.fasting_state)}`}
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs uppercase text-mute tracking-wide">Predicted</div>
          <div className="font-serif text-3xl font-bold text-teal mt-1">
            {fmtMgdl(session.predicted_mgdl)}
          </div>
          {session.predicted_ci_low != null && session.predicted_ci_high != null && (
            <div className="text-sm text-mute mt-1">
              95% CI: {session.predicted_ci_low} – {session.predicted_ci_high} mg/dL
            </div>
          )}
          <div className="text-xs text-mute mt-2">Model: {session.model_version || "—"}</div>
        </Card>

        <Card>
          <div className="text-xs uppercase text-mute tracking-wide">Reference (finger-prick)</div>
          <div className="font-serif text-3xl font-bold text-ink mt-1">
            {fmtMgdl(session.ground_truth_mgdl)}
          </div>
          {session.ground_truth_at && (
            <div className="text-sm text-mute mt-1">Drawn at {fmtDate(session.ground_truth_at)}</div>
          )}
        </Card>

        <Card>
          <div className="text-xs uppercase text-mute tracking-wide">Quality</div>
          <div className="mt-2">
            {session.quality_ok
              ? <Badge tone="ok">Passed QC</Badge>
              : <Badge tone="warn">{session.quality_reason || "rejected"}</Badge>}
          </div>
          <div className="text-xs text-mute mt-3">
            Perfusion {session.perfusion_index ?? "—"} · Motion {session.motion_index_max ?? "—"}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="font-serif text-base font-bold text-ink mb-3">Covariates</h3>
          <KV k="Skin temp" v={session.skin_temp_c != null ? `${session.skin_temp_c} °C` : "—"} />
          <KV k="Contact pressure (raw)" v={session.pressure_raw ?? "—"} />
          <KV k="Motion index (max)" v={session.motion_index_max ?? "—"} />
          <KV k="Perfusion index" v={session.perfusion_index ?? "—"} />
          <KV k="Battery" v={session.battery_pct != null ? `${session.battery_pct}%` : "—"} />
        </Card>

        <Card>
          <h3 className="font-serif text-base font-bold text-ink mb-3">Raw waveform</h3>
          {rawCounts.length === 0 ? (
            <EmptyBlock label="No raw window stored yet. The ESP32 will populate this on first capture." />
          ) : (
            <div className="space-y-2 text-sm">
              {rawCounts.map((r) => (
                <div key={r.channel} className="flex justify-between border-b border-[#F0F4F4] pb-2 last:border-0">
                  <span className="font-mono">{r.channel}</span>
                  <span className="text-mute">{r.sample_count.toLocaleString()} samples</span>
                </div>
              ))}
              <p className="text-xs text-mute pt-2">Full waveform plot available once feature extractor is wired.</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-serif text-base font-bold text-ink mb-3">Provenance</h3>
        <KV k="Session ID" v={<span className="font-mono text-xs">{session.session_id}</span>} />
        <KV k="Device" v={session.device_code} />
        <KV k="Subject" v={<Link to={`/subjects/${session.subject_pseudonym}`} className="text-teal hover:underline">{session.subject_pseudonym}</Link>} />
        <KV k="Captured at" v={fmtDate(session.captured_at)} />
        <KV k="Fasting state" v={fastingLabel(session.fasting_state)} />
      </Card>
    </>
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

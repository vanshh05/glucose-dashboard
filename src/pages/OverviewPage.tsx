import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, SessionOverview, DataQualityRow, ModelVersion } from "../lib/supabase";
import { PageHeader, Card, Stat, Badge, LoadingBlock, ErrorBlock } from "../components/ui";
import { fmtDate, fmtMgdl, computeMARD } from "../lib/utils";

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<SessionOverview[]>([]);
  const [quality, setQuality] = useState<DataQualityRow[]>([]);
  const [activeModel, setActiveModel] = useState<ModelVersion | null>(null);
  const [pairs, setPairs] = useState<{ reference_mgdl: number; predicted_mgdl: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: r, error: e1 }, { data: q, error: e2 }, { data: m, error: e3 }, { data: p, error: e4 }] =
          await Promise.all([
            supabase.from("v_session_overview").select("*").order("captured_at", { ascending: false }).limit(8),
            supabase.from("v_data_quality").select("*"),
            supabase.from("model_versions").select("*").eq("is_active", true).maybeSingle(),
            supabase.from("v_error_grid_points").select("reference_mgdl, predicted_mgdl"),
          ]);
        if (e1 || e2 || e3 || e4) throw e1 || e2 || e3 || e4;
        setRecent((r || []) as SessionOverview[]);
        setQuality((q || []) as DataQualityRow[]);
        setActiveModel((m as ModelVersion) || null);
        setPairs((p || []) as any);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalSubjects = quality.length;
  const totalSessions = quality.reduce((s, r) => s + Number(r.total_sessions || 0), 0);
  const totalRejects = quality.reduce((s, r) => s + Number(r.sessions_rejected || 0), 0);
  const totalGt = quality.reduce((s, r) => s + Number(r.sessions_with_ground_truth || 0), 0);
  const mard = computeMARD(pairs);

  return (
    <>
      <PageHeader
        kicker="Project Overview"
        title="Non-Invasive Glucose Monitoring"
        subtitle="Experimental optical sensing + machine-learning pipeline. All values are research estimates — not for clinical decisions."
      />

      {err && <ErrorBlock error={err} />}
      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat label="Subjects" value={totalSubjects} />
            <Stat label="Sessions" value={totalSessions} hint={`${totalRejects} rejected on QC`} />
            <Stat label="Ground-truth pairs" value={totalGt} />
            <Stat
              label="Active model MARD"
              value={mard == null ? "—" : `${mard.toFixed(1)}%`}
              hint={activeModel ? `v: ${activeModel.version}` : "no active model"}
              tone="mint"
            />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink">Recent sessions</h2>
              <Link to="/sessions" className="text-sm text-teal font-semibold hover:underline">
                See all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-mute border-b border-[#E3EBEB]">
                  <tr>
                    <th className="text-left py-2 pr-4">Captured</th>
                    <th className="text-left py-2 pr-4">Subject</th>
                    <th className="text-left py-2 pr-4">Reference</th>
                    <th className="text-left py-2 pr-4">Predicted (±CI)</th>
                    <th className="text-left py-2 pr-4">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.session_id} className="border-b border-[#F0F4F4] last:border-0">
                      <td className="py-2 pr-4">
                        <Link to={`/sessions/${s.session_id}`} className="text-ink hover:text-teal">
                          {fmtDate(s.captured_at)}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <Link to={`/subjects/${s.subject_pseudonym}`} className="font-medium text-teal hover:underline">
                          {s.subject_pseudonym}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{fmtMgdl(s.ground_truth_mgdl)}</td>
                      <td className="py-2 pr-4">
                        {s.predicted_mgdl == null ? "—" : (
                          <span>
                            {fmtMgdl(s.predicted_mgdl)}{" "}
                            <span className="text-mute text-xs">
                              [{s.predicted_ci_low?.toFixed(0)}–{s.predicted_ci_high?.toFixed(0)}]
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {s.quality_ok
                          ? <Badge tone="ok">OK</Badge>
                          : <Badge tone="warn">{s.quality_reason || "rejected"}</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

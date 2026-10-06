import { useEffect, useState } from "react";
import { supabase, ModelVersion } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Badge } from "../components/ui";
import { fmtDate } from "../lib/utils";

export default function ModelsPage() {
  const [rows, setRows] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("model_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message); else setRows((data || []) as ModelVersion[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PageHeader
        kicker="Audit trail"
        title="Model registry"
        subtitle="Every version that has ever scored a session, with its held-out metrics. Only one is active at a time."
      />
      {err && <ErrorBlock error={err} />}
      {loading ? <LoadingBlock /> : (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-mute border-b border-[#E3EBEB] bg-panel/60">
                <tr>
                  <th className="text-left py-3 pl-5 pr-4">Version</th>
                  <th className="text-left py-3 pr-4">Type</th>
                  <th className="text-left py-3 pr-4">Features</th>
                  <th className="text-left py-3 pr-4">Trained</th>
                  <th className="text-left py-3 pr-4">Subjects</th>
                  <th className="text-left py-3 pr-4">MARD</th>
                  <th className="text-left py-3 pr-4">RMSE</th>
                  <th className="text-left py-3 pr-4">Zone A</th>
                  <th className="text-left py-3 pr-4">Shuffle test</th>
                  <th className="text-left py-3 pr-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.version} className="border-b border-[#F0F4F4] last:border-0">
                    <td className="py-3 pl-5 pr-4 font-mono font-semibold">{m.version}</td>
                    <td className="py-3 pr-4 text-mute">{m.model_type || "—"}</td>
                    <td className="py-3 pr-4 text-mute">{m.feature_set_version}</td>
                    <td className="py-3 pr-4 text-mute">{m.trained_at ? fmtDate(m.trained_at) : "—"}</td>
                    <td className="py-3 pr-4">{m.training_subjects ?? "—"}</td>
                    <td className="py-3 pr-4">{m.mard_pct != null ? `${m.mard_pct}%` : "—"}</td>
                    <td className="py-3 pr-4">{m.rmse_mgdl ?? "—"}</td>
                    <td className="py-3 pr-4">{m.clarke_zone_a_pct != null ? `${m.clarke_zone_a_pct}%` : "—"}</td>
                    <td className="py-3 pr-4">
                      {m.passed_shuffle_test == null
                        ? <span className="text-mute">—</span>
                        : m.passed_shuffle_test
                          ? <Badge tone="ok">passed</Badge>
                          : <Badge tone="danger">FAILED</Badge>}
                    </td>
                    <td className="py-3 pr-5">
                      {m.is_active ? <Badge tone="ok">ACTIVE</Badge> : <Badge>archived</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

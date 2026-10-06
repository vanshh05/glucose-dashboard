import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, DataQualityRow } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Badge } from "../components/ui";
import { fmtDay, fitzpatrickLabel } from "../lib/utils";

export default function SubjectsPage() {
  const [rows, setRows] = useState<DataQualityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("v_data_quality")
        .select("*")
        .order("pseudonym");
      if (error) setErr(error.message); else setRows((data || []) as DataQualityRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PageHeader kicker="Study participants" title="Subjects" subtitle="Pseudonymised subjects contributing paired optical captures and finger-prick ground truth." />
      {err && <ErrorBlock error={err} />}
      {loading ? <LoadingBlock /> : (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-mute border-b border-[#E3EBEB] bg-panel/60">
                <tr>
                  <th className="text-left py-3 pl-5 pr-4">Pseudonym</th>
                  <th className="text-left py-3 pr-4">Fitzpatrick</th>
                  <th className="text-left py-3 pr-4">Sessions</th>
                  <th className="text-left py-3 pr-4">Rejected</th>
                  <th className="text-left py-3 pr-4">Paired GT</th>
                  <th className="text-left py-3 pr-4">First</th>
                  <th className="text-left py-3 pr-5">Last</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subject_id} className="border-b border-[#F0F4F4] last:border-0 hover:bg-panel/40">
                    <td className="py-3 pl-5 pr-4">
                      <Link to={`/subjects/${r.pseudonym}`} className="font-semibold text-teal hover:underline">
                        {r.pseudonym}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{fitzpatrickLabel(r.fitzpatrick)}</td>
                    <td className="py-3 pr-4">{r.total_sessions}</td>
                    <td className="py-3 pr-4">
                      {Number(r.sessions_rejected) > 0
                        ? <Badge tone="warn">{r.sessions_rejected}</Badge>
                        : <span className="text-mute">0</span>}
                    </td>
                    <td className="py-3 pr-4">{r.sessions_with_ground_truth}</td>
                    <td className="py-3 pr-4 text-mute">{fmtDay(r.first_session_at)}</td>
                    <td className="py-3 pr-5 text-mute">{fmtDay(r.last_session_at)}</td>
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

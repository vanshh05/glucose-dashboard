import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, SessionOverview } from "../lib/supabase";
import { PageHeader, Card, LoadingBlock, ErrorBlock, Badge } from "../components/ui";
import { fastingLabel, fmtDate, fmtMgdl } from "../lib/utils";

export default function SessionsPage() {
  const [rows, setRows] = useState<SessionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showOnlyRejected, setShowOnlyRejected] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("v_session_overview")
        .select("*")
        .order("captured_at", { ascending: false });
      if (error) setErr(error.message); else setRows((data || []) as SessionOverview[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (showOnlyRejected && r.quality_ok) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        r.subject_pseudonym?.toLowerCase().includes(needle) ||
        r.device_code?.toLowerCase().includes(needle) ||
        r.fasting_state?.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, showOnlyRejected]);

  return (
    <>
      <PageHeader kicker="Captures" title="Sessions" subtitle={`${rows.length} total · ${filtered.length} shown.`} />

      <Card className="mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <input
            type="text"
            placeholder="Search by subject, device, or state…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full md:w-96 border border-[#D8E4E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
          />
          <label className="text-sm flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              checked={showOnlyRejected}
              onChange={(e) => setShowOnlyRejected(e.target.checked)}
              className="rounded"
            />
            Only quality-rejected
          </label>
        </div>
      </Card>

      {err && <ErrorBlock error={err} />}
      {loading ? <LoadingBlock /> : (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-mute border-b border-[#E3EBEB] bg-panel/60">
                <tr>
                  <th className="text-left py-3 pl-5 pr-4">Captured</th>
                  <th className="text-left py-3 pr-4">Subject</th>
                  <th className="text-left py-3 pr-4">Device</th>
                  <th className="text-left py-3 pr-4">State</th>
                  <th className="text-left py-3 pr-4">Reference</th>
                  <th className="text-left py-3 pr-4">Predicted</th>
                  <th className="text-left py-3 pr-5">Quality</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.session_id} className="border-b border-[#F0F4F4] last:border-0 hover:bg-panel/40">
                    <td className="py-2.5 pl-5 pr-4">
                      <Link to={`/sessions/${r.session_id}`} className="hover:text-teal">{fmtDate(r.captured_at)}</Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Link to={`/subjects/${r.subject_pseudonym}`} className="font-medium text-teal hover:underline">
                        {r.subject_pseudonym}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-mute">{r.device_code}</td>
                    <td className="py-2.5 pr-4 text-mute">{fastingLabel(r.fasting_state)}</td>
                    <td className="py-2.5 pr-4">{fmtMgdl(r.ground_truth_mgdl)}</td>
                    <td className="py-2.5 pr-4">{fmtMgdl(r.predicted_mgdl)}</td>
                    <td className="py-2.5 pr-5">
                      {r.quality_ok
                        ? <Badge tone="ok">OK</Badge>
                        : <Badge tone="warn">{r.quality_reason || "rejected"}</Badge>}
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

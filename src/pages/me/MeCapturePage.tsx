import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { glucoseZone, zoneColor, zoneLabel } from "../../lib/patientUtils";

/**
 * MeCapturePage — guided capture flow.
 *
 * In real life this is where the ESP32 streams a 30-second window and the
 * backend returns a prediction. For now we simulate it against the seeded
 * database: we pick a plausible random fake prediction, insert a session +
 * covariates + prediction into Supabase, then show the result.
 *
 * Steps:
 *   1. Instructions  — "place finger, stay still"
 *   2. Countdown     — animated 30s ring (sped up to ~6s for demo)
 *   3. Processing    — brief "analyzing" state while we POST
 *   4. Result        — the number + CI + zone + disclaimer
 */

const CURRENT_SUBJECT = "S007";
type Stage = "ready" | "counting" | "processing" | "done" | "error";

// Demo-mode: shorten the 30 s capture to 6 s on screen so the flow is testable.
// Flip this to 30000 when wired to the real device.
const CAPTURE_MS = 6000;

export default function MeCapturePage() {
  const nav = useNavigate();
  const [stage, setStage] = useState<Stage>("ready");
  const [progress, setProgress] = useState(0); // 0 → 1
  const [result, setResult] = useState<{ value: number; low: number; high: number; id: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Clean up animation frame on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  async function startCapture() {
    setStage("counting");
    setProgress(0);
    const startedAt = performance.now();

    // Animate progress ring
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / CAPTURE_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function finish() {
    setStage("processing");
    try {
      // Look up subject + a device to attach to
      const [{ data: subj, error: eSubj }, { data: devs, error: eDev }] = await Promise.all([
        supabase.from("subjects").select("id").eq("pseudonym", CURRENT_SUBJECT).single(),
        supabase.from("devices").select("id,device_code").limit(1),
      ]);
      if (eSubj || eDev || !subj || !devs?.length) throw (eSubj || eDev || new Error("missing subject or device"));

      // Simulate a plausible reading. Weighted toward normal range.
      const biasedRand = () => {
        const r = Math.random();
        // 70% normal (85-140), 20% elevated (140-180), 10% other
        if (r < 0.7) return 85 + Math.random() * 55;
        if (r < 0.9) return 140 + Math.random() * 40;
        return 60 + Math.random() * 20 + (Math.random() < 0.3 ? 120 : 0);
      };
      const value = Math.round(biasedRand() * 10) / 10;
      const low  = Math.max(40, Math.round((value - 15) * 10) / 10);
      const high = Math.min(400, Math.round((value + 15) * 10) / 10);

      const now = new Date().toISOString();

      // Insert session
      const { data: sess, error: eSess } = await supabase
        .from("sessions")
        .insert({
          subject_id: subj.id,
          device_id: devs[0].id,
          capture_uuid: crypto.randomUUID(),
          captured_at: now,
          fw_version: "1.0.0",
          sample_rate_hz: 100,
          window_seconds: 30,
          pga_gain: 4,
          led_currents_ma: { "530": 12, "660": 10, "940": 20 },
          fasting_state: "unknown",
          hand: Math.random() < 0.5 ? "left" : "right",
          finger: "index",
          ambient_temp_c: 24.0,
          quality_ok: true,
        })
        .select("id")
        .single();
      if (eSess || !sess) throw eSess || new Error("session insert failed");

      // Insert covariates + prediction in parallel
      const [{ error: eCov }, { error: ePred }] = await Promise.all([
        supabase.from("covariates").insert({
          session_id: sess.id,
          skin_temp_c: 32.4,
          pressure_raw: 410,
          motion_index_max: 0.03,
          perfusion_index: 1.4,
          battery_pct: 88,
        }),
        supabase.from("predictions").insert({
          session_id: sess.id,
          model_version: "v0_stub",
          glucose_mgdl: value,
          ci_low: low,
          ci_high: high,
          calibration_applied: false,
        }),
      ]);
      if (eCov || ePred) throw eCov || ePred;

      setResult({ value, low, high, id: sess.id });
      setStage("done");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setStage("error");
    }
  }

  // ---------- RENDER STAGES ----------

  if (stage === "ready") {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-serif text-2xl font-bold text-ink">Take a reading</h1>
        <p className="text-sm text-mute mt-1">
          A single reading takes about 30 seconds. Hold still for the best result.
        </p>

        <div className="mt-6 space-y-3">
          <Step n={1} title="Place your index finger" body="Rest it flat on the sensor window. Light pressure, nothing forced." />
          <Step n={2} title="Keep your hand steady" body="Movement will cause the reading to be rejected. Rest your hand on a table if you can." />
          <Step n={3} title="Wait for the countdown" body="You'll feel a short vibration when the reading is complete." />
        </div>

        <div className="mt-6 p-3.5 bg-amber/10 border border-amber/25 rounded-xl text-[11px] text-[#8A5A00] leading-relaxed">
          This produces an <strong>experimental estimate</strong>. Do not use it to decide
          insulin, food, or any treatment. If something seems wrong, confirm with your
          usual glucometer.
        </div>

        <button
          onClick={startCapture}
          className="mt-6 w-full bg-teal text-white font-semibold py-4 rounded-xl text-base active:scale-[0.99] transition shadow-sm"
        >
          Start reading
        </button>
      </div>
    );
  }

  if (stage === "counting" || stage === "processing") {
    const pct = stage === "processing" ? 1 : progress;
    const secondsLeft = Math.max(0, Math.ceil((CAPTURE_MS * (1 - progress)) / 1000));
    return (
      <div className="px-5 pt-14 flex flex-col items-center">
        <ProgressRing progress={pct} />
        <div className="mt-8 text-center">
          <div className="font-serif text-xl text-ink font-bold">
            {stage === "processing" ? "Analyzing…" : "Reading in progress"}
          </div>
          <div className="text-sm text-mute mt-1">
            {stage === "processing"
              ? "Just a moment while we compute the estimate."
              : `Hold still · ${secondsLeft}s remaining`}
          </div>
        </div>

        <div className="mt-10 text-xs text-mute max-w-xs text-center">
          Any motion detected during the reading will cause it to be flagged for quality review.
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="px-5 pt-10">
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-[#8A1F27]">
          <strong>Something went wrong</strong>
          <div className="mt-1 text-xs opacity-80">{err}</div>
        </div>
        <button
          onClick={() => { setErr(null); setStage("ready"); }}
          className="mt-4 w-full bg-teal text-white font-semibold py-3 rounded-xl"
        >
          Try again
        </button>
      </div>
    );
  }

  // done
  const z = result ? glucoseZone(result.value) : "normal";
  return (
    <div className="px-5 pt-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-mute mb-2">Your estimate</div>
        <div className="font-serif text-7xl font-bold" style={{ color: zoneColor(z) }}>
          {result?.value.toFixed(0)}
        </div>
        <div className="text-sm text-mute mt-1">mg/dL · estimate range {result?.low.toFixed(0)}–{result?.high.toFixed(0)}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink">
          <span className="w-2 h-2 rounded-full" style={{ background: zoneColor(z) }} />
          {zoneLabel(z)}
        </div>
      </div>

      <div className="mt-6 p-3.5 bg-amber/10 border border-amber/25 rounded-xl text-[11px] text-[#8A5A00] leading-relaxed">
        Remember: this is an <strong>experimental estimate</strong>, not a medical measurement.
        If you feel unwell or this number surprises you, confirm with your finger-prick glucometer.
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => nav("/me")}
          className="w-full bg-teal text-white font-semibold py-3 rounded-xl"
        >
          Done
        </button>
        {result && (
          <button
            onClick={() => nav(`/me/session/${result.id}`)}
            className="w-full py-3 rounded-xl border border-[#D8E4E4] text-sm font-medium text-ink"
          >
            See details
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3 p-3.5 bg-white border border-[#E3EBEB] rounded-xl">
      <div className="w-7 h-7 shrink-0 rounded-full bg-teal/10 text-teal text-sm font-serif font-bold flex items-center justify-center">
        {n}
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs text-mute mt-0.5 leading-snug">{body}</div>
      </div>
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const r = 86;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - progress);
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={r} stroke="#E3EBEB" strokeWidth="10" fill="none" />
      <circle
        cx="100" cy="100" r={r}
        stroke="#028090"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={dash}
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 80ms linear" }}
      />
      <text x="100" y="108" textAnchor="middle" fontFamily="Cambria,serif" fontSize="36" fontWeight="bold" fill="#13343B">
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

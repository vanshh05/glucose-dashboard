import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Visible early error beats a mysterious 401 later.
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — copy .env.example to .env and fill them in."
  );
}

export const supabase = createClient(url, anonKey);

// ---------- Types matching the DB views ----------

export type SessionOverview = {
  session_id: string;
  subject_id: string;
  subject_pseudonym: string;
  device_id: string;
  device_code: string;
  captured_at: string;
  fasting_state: string | null;
  quality_ok: boolean;
  quality_reason: string | null;
  skin_temp_c: number | null;
  pressure_raw: number | null;
  motion_index_max: number | null;
  perfusion_index: number | null;
  battery_pct: number | null;
  ground_truth_mgdl: number | null;
  ground_truth_at: string | null;
  predicted_mgdl: number | null;
  predicted_ci_low: number | null;
  predicted_ci_high: number | null;
  model_version: string | null;
};

export type ErrorGridPoint = {
  session_id: string;
  subject_id: string;
  pseudonym: string;
  fitzpatrick: number | null;
  captured_at: string;
  reference_mgdl: number;
  predicted_mgdl: number;
  model_version: string;
};

export type DataQualityRow = {
  subject_id: string;
  pseudonym: string;
  fitzpatrick: number | null;
  total_sessions: number;
  sessions_ok: number;
  sessions_rejected: number;
  sessions_with_ground_truth: number;
  first_session_at: string | null;
  last_session_at: string | null;
};

export type Subject = {
  id: string;
  pseudonym: string;
  age_band: string | null;
  fitzpatrick: number | null;
  sex_at_birth: string | null;
  enrolled_at: string;
};

export type ModelVersion = {
  version: string;
  model_type: string | null;
  feature_set_version: string;
  trained_at: string | null;
  training_subjects: number | null;
  training_sessions: number | null;
  mard_pct: number | null;
  rmse_mgdl: number | null;
  r_squared: number | null;
  clarke_zone_a_pct: number | null;
  clarke_zone_b_pct: number | null;
  passed_shuffle_test: boolean | null;
  is_active: boolean;
  notes: string | null;
};

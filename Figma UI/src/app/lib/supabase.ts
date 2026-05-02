// Tek Supabase istemcisi — tüm uygulamadan import edilir.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (import.meta.env.PROD && (!url || !anonKey)) {
  throw new Error(
    "VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY production build için zorunludur.",
  );
}
if (!url || !anonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımlı değil. .env.local oluştur.",
  );
}

export const supabase = createClient(url ?? "http://localhost:54321", anonKey ?? "anon");

export const FUNCTIONS_URL = `${url ?? "http://localhost:54321"}/functions/v1`;
export const ANON_KEY = anonKey ?? "";

/**
 * Edge function fetch için Authorization header üretir.
 * Oturum varsa user JWT, yoksa ANON_KEY döner.
 */
export async function getFunctionAuthHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token
    ? `Bearer ${data.session.access_token}`
    : `Bearer ${ANON_KEY}`;
}

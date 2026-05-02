// Tek Supabase istemcisi — tüm uygulamadan import edilir.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Konsolda erken uyarı; uygulama yine yüklensin diye throw etmiyoruz.
  console.warn(
    "[supabase] VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımlı değil. .env.local oluştur.",
  );
}

export const supabase = createClient(url ?? "http://localhost:54321", anonKey ?? "anon");

export const FUNCTIONS_URL = `${url ?? "http://localhost:54321"}/functions/v1`;
export const ANON_KEY = anonKey ?? "";

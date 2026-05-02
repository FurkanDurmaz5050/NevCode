// user.ts — Supabase Auth user id helper.
// `getDemoUserId()` legacy export'u korunur; artık auth.uid() döndürür (yoksa hata).
import { supabase } from "./supabase";

let cachedUserId: string | null = null;

/** AuthProvider tarafından session her değiştiğinde çağrılır. */
export function setCachedUserId(id: string | null) {
  cachedUserId = id;
}

/** Async — kesin doğru user id (oturum yoksa null). */
export async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id ?? null;
  cachedUserId = id;
  return id;
}

/** Sync legacy helper. Oturum yoksa exception. */
export function getDemoUserId(): string {
  if (!cachedUserId) throw new Error("Auth required: lütfen giriş yapın.");
  return cachedUserId;
}

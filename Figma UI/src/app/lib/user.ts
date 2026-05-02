// Tek-kullanıcı demo: localStorage'da rastgele bir id tutuyoruz.
// Faz 5'te Supabase Auth gelince auth.uid() ile değiştirilecek.

const KEY = "globalnest:demoUserId";

export function getDemoUserId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const fresh = `demo_${crypto.randomUUID()}`;
  window.localStorage.setItem(KEY, fresh);
  return fresh;
}

// Shared auth helper for edge functions.
// Authorization: Bearer <jwt> header'ından user.id'yi çıkarır ve
// verilen business_id'nin gerçekten o user'a ait olduğunu doğrular.
// Service-role client RLS'i bypass ettiği için bu kontrol manuel yapılmalı.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

export interface AuthCtx {
  user_id: string;
  jwt: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Authorization header'ından user'ı çıkarır. Yoksa null. */
export async function getAuthUser(req: Request): Promise<AuthCtx | null> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7).trim();
  if (!jwt) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { user_id: data.user.id, jwt };
}

/** Auth zorunlu — yoksa 401 throw eder. */
export async function requireAuth(req: Request): Promise<AuthCtx> {
  const ctx = await getAuthUser(req);
  if (!ctx) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return ctx;
}

/** Verilen business_id'nin user_id'ye ait olduğunu doğrular. */
export async function assertBusinessOwner(
  serviceClient: SupabaseClient,
  business_id: string,
  user_id: string,
): Promise<void> {
  const { data, error } = await serviceClient
    .from("businesses")
    .select("user_id")
    .eq("id", business_id)
    .maybeSingle();
  if (error) throw new Error(`business lookup failed: ${error.message}`);
  if (!data) throw new Response(JSON.stringify({ error: "business not found" }), { status: 404 });
  if (data.user_id && data.user_id !== user_id) {
    throw new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
}

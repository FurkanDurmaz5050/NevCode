// supabase/functions/render-callback
// Renderer (Remotion Lambda webhook veya kendi render server'ın) işin bitiminde
// bu endpoint'e POST atar.
// Kabul edilen payload (her ikisi de desteklenir):
//   - Lambda webhook formatı: { type: "success" | "error", outputUrl?, errors?, renderId, ... }
//   - Generic webhook formatı: { status: "ready" | "failed", url?, error?, progress? }
//
// video_id query string'den gelir: ?video_id=xxx

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  const url = new URL(req.url);
  const videoId = url.searchParams.get("video_id");
  if (!videoId) return json({ error: "video_id query gerekli" }, 400);

  // Opsiyonel imza doğrulaması: Edge fn callback URL'e ?secret= ekliyor.
  const expected = Deno.env.get("RENDER_CALLBACK_SECRET");
  if (expected) {
    const got = url.searchParams.get("secret");
    if (got !== expected) return json({ error: "invalid secret" }, 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Lambda formatı (renderMediaOnLambda webhook)
  if (body.type === "success" && (body.outputUrl || body.outputFile)) {
    await supa
      .from("videos")
      .update({
        status: "ready",
        progress: 100,
        url: body.outputUrl ?? body.outputFile,
        ready_at: new Date().toISOString(),
      })
      .eq("id", videoId);
    return json({ ok: true });
  }
  if (body.type === "timeout") {
    await supa
      .from("videos")
      .update({ status: "failed", error: "lambda timeout" })
      .eq("id", videoId);
    return json({ ok: true });
  }
  if (body.type === "error") {
    await supa
      .from("videos")
      .update({
        status: "failed",
        error: JSON.stringify(body.errors ?? body).slice(0, 800),
      })
      .eq("id", videoId);
    return json({ ok: true });
  }

  // Generic format
  if (body.status === "ready" || body.url) {
    await supa
      .from("videos")
      .update({
        status: "ready",
        progress: 100,
        url: body.url ?? null,
        storage_path: body.storage_path ?? null,
        ready_at: new Date().toISOString(),
      })
      .eq("id", videoId);
    return json({ ok: true });
  }
  if (body.status === "failed") {
    await supa
      .from("videos")
      .update({ status: "failed", error: body.error ?? "unknown" })
      .eq("id", videoId);
    return json({ ok: true });
  }
  if (typeof body.progress === "number") {
    await supa
      .from("videos")
      .update({ progress: Math.min(99, Math.max(0, Math.round(body.progress))) })
      .eq("id", videoId);
    return json({ ok: true });
  }

  return json({ ok: true, note: "no recognized fields" });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

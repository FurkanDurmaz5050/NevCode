// supabase/functions/gemini-image
// Gemini 2.5 Flash Image (nano-banana) ile görsel üretir.
// Body: { prompt: string, reference_image_url?: string, aspect?: "1:1"|"9:16"|"16:9"|"4:5",
//         storage_bucket?: string, storage_path?: string }
// Response: { image_url, storage_path, mime_type, model }
//
// reference_image_url verilirse: Gemini'ye base image olarak iletilir (image-to-image / edit).
// storage_bucket+path verilirse Supabase Storage'a yüklenir, public URL döndürülür.
// Aksi halde data URL (base64) döner.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-2.5-flash-image-preview";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  prompt: string;
  reference_image_url?: string;
  aspect?: string;
  storage_bucket?: string;
  storage_path?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);
  if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY tanımlı değil" }, 500);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }
  if (!body.prompt) return json({ error: "prompt zorunlu" }, 400);

  const parts: any[] = [{ text: body.prompt }];
  if (body.reference_image_url) {
    try {
      const res = await fetch(body.reference_image_url);
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        const b64 = uint8ToBase64(buf);
        const mime = res.headers.get("content-type") ?? "image/jpeg";
        parts.unshift({
          inlineData: { mimeType: mime, data: b64 },
        });
      }
    } catch (e) {
      console.warn("[gemini-image] reference fetch failed", e);
    }
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(body.aspect ? { imageConfig: { aspectRatio: body.aspect } } : {}),
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    return json({ error: `gemini ${resp.status}: ${text}` }, 502);
  }
  const data = await resp.json();
  const cand = data?.candidates?.[0];
  const inline = cand?.content?.parts?.find((p: any) => p?.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    return json({ error: "Gemini yanıtında görsel yok", raw: data }, 502);
  }

  const mime = inline.mimeType ?? "image/png";
  const b64: string = inline.data;

  // Storage'a yüklensin mi?
  if (body.storage_bucket && body.storage_path) {
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const buf = base64ToUint8(b64);
    const up = await supa.storage.from(body.storage_bucket).upload(body.storage_path, buf, {
      contentType: mime,
      upsert: true,
    });
    if (up.error) return json({ error: `storage: ${up.error.message}` }, 500);
    const pub = supa.storage.from(body.storage_bucket).getPublicUrl(body.storage_path);
    return json({
      image_url: pub.data.publicUrl,
      storage_path: body.storage_path,
      mime_type: mime,
      model: GEMINI_MODEL,
    });
  }

  return json({
    image_url: `data:${mime};base64,${b64}`,
    mime_type: mime,
    model: GEMINI_MODEL,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

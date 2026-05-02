// supabase/functions/voice-call
// ElevenLabs Conversational AI outbound (Twilio) çağrısını proxy'ler.
// Frontend sadece `to_number` gönderir; API key + agent ID'ler secret olarak burada tutulur.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

interface RequestBody {
  to_number: string;
  first_message?: string;
  prompt?: string;
}

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");
const ELEVENLABS_AGENT_PHONE_NUMBER_ID = Deno.env.get("ELEVENLABS_AGENT_PHONE_NUMBER_ID");

const ELEVENLABS_OUTBOUND_URL =
  "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";

// E.164: '+' + 7-15 rakam (ilk rakam 1-9).
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return json({ error: "POST gerekli" }, 405);
  }

  try {
    await requireAuth(req);
  } catch (resp) {
    if (resp instanceof Response) {
      // CORS header'larını ekleyerek geri döndür.
      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return json({ error: "unauthorized" }, 401);
  }

  if (!ELEVENLABS_API_KEY) {
    return json({ error: "ELEVENLABS_API_KEY secret tanımlı değil" }, 500);
  }
  if (!ELEVENLABS_AGENT_ID || !ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
    return json(
      { error: "ELEVENLABS_AGENT_ID veya ELEVENLABS_AGENT_PHONE_NUMBER_ID tanımlı değil" },
      500,
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }

  const toNumber = (body.to_number ?? "").trim();
  if (!E164_REGEX.test(toNumber)) {
    return json(
      { error: "to_number E.164 formatında olmalı (örn. +905551112233)" },
      400,
    );
  }

  // ElevenLabs override (opsiyonel) — agent prompt/first_message override.
  const overrides:
    | { conversation_config_override: Record<string, unknown> }
    | undefined =
    body.first_message || body.prompt
      ? {
          conversation_config_override: {
            agent: {
              ...(body.first_message ? { first_message: body.first_message } : {}),
              ...(body.prompt ? { prompt: { prompt: body.prompt } } : {}),
            },
          },
        }
      : undefined;

  const upstreamBody = {
    agent_id: ELEVENLABS_AGENT_ID,
    agent_phone_number_id: ELEVENLABS_AGENT_PHONE_NUMBER_ID,
    to_number: toNumber,
    ...(overrides ? { conversation_initiation_client_data: overrides } : {}),
  };

  let upstream: Response;
  try {
    upstream = await fetch(ELEVENLABS_OUTBOUND_URL, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    return json(
      { error: `ElevenLabs erişim hatası: ${(err as Error).message}` },
      502,
    );
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return json(
      { error: `ElevenLabs ${upstream.status}: ${text}` },
      502,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return json({ ok: true, result: data });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

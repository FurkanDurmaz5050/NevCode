// supabase/functions/openai-chat
// Browser'dan gelen sohbet isteklerini OpenAI'ya proxy'ler.
// API key sadece sunucuda (OPENAI_API_KEY secret).
// Hem normal hem stream (SSE) cevap döner.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return json({ error: "POST gerekli" }, 405);
  }

  if (!OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY secret tanımlı değil" }, 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: "messages zorunlu" }, 400);
  }

  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model ?? "gpt-5.5",
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      stream: !!body.stream,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return json({ error: `OpenAI ${upstream.status}: ${text}` }, 502);
  }

  if (body.stream) {
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const data = await upstream.json();
  return json({ content: data.choices?.[0]?.message?.content ?? "" });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

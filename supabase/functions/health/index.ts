// supabase/functions/health
// Tüm üçüncü parti entegrasyonlarının durumunu döndürür (anahtar var/yok).
// Body: yok. GET veya POST kabul eder.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";

Deno.serve((req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  const out = {
    openai: !!Deno.env.get("OPENAI_API_KEY"),
    openai_model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5.5",
    tavily: !!Deno.env.get("TAVILY_API_KEY"),
    gemini: !!Deno.env.get("GEMINI_API_KEY"),
    gemini_image_model: Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-2.5-flash-image",
    remotion_webhook: !!Deno.env.get("REMOTION_RENDER_WEBHOOK"),
    remotion_lambda: !!Deno.env.get("REMOTION_LAMBDA_FUNCTION_NAME"),
    elevenlabs: !!Deno.env.get("ELEVENLABS_API_KEY"),
    twilio: !!Deno.env.get("TWILIO_ACCOUNT_SID") && !!Deno.env.get("TWILIO_AUTH_TOKEN"),
    shippo: !!Deno.env.get("SHIPPO_TOKEN"),
    climatiq: !!Deno.env.get("CLIMATIQ_API_KEY"),
  };
  return new Response(JSON.stringify(out), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

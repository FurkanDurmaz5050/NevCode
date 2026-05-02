// Voice (ElevenLabs outbound call) client helper.
// Edge function `voice-call`'a istek atar — API key ve agent ID'ler sadece sunucuda.

import { ANON_KEY, FUNCTIONS_URL, getFunctionAuthHeader } from "./supabase";

const ENDPOINT = `${FUNCTIONS_URL}/voice-call`;

export type CallStatus = "idle" | "dialing" | "connected" | "error";

export interface StartCallResult {
  conversationId?: string;
  callSid?: string;
  raw: unknown;
}

/**
 * Kullanıcıdan gelen serbest formatlı numarayı E.164'e indirger.
 * Boşluk, parantez, tire ve nokta atılır. Başında '+' yoksa eklenmez (hata).
 */
export function normalizeE164(input: string): string {
  const cleaned = input.replace(/[\s().\-]/g, "");
  return cleaned;
}

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function isValidE164(input: string): boolean {
  return E164_REGEX.test(input);
}

export async function startOutboundCall(
  toNumber: string,
  opts?: { firstMessage?: string; prompt?: string },
): Promise<StartCallResult> {
  const normalized = normalizeE164(toNumber);
  if (!isValidE164(normalized)) {
    throw new Error(
      "Telefon numarası uluslararası formatta olmalı (örn. +905551112233).",
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: await getFunctionAuthHeader(),
  };
  if (ANON_KEY) headers["apikey"] = ANON_KEY;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      to_number: normalized,
      ...(opts?.firstMessage ? { first_message: opts.firstMessage } : {}),
      ...(opts?.prompt ? { prompt: opts.prompt } : {}),
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (payload as { error?: string })?.error || `voice-call ${res.status}`;
    throw new Error(msg);
  }

  const result = (payload as { result?: Record<string, unknown> })?.result ?? {};
  return {
    conversationId: (result as { conversation_id?: string }).conversation_id,
    callSid: (result as { callSid?: string }).callSid,
    raw: result,
  };
}

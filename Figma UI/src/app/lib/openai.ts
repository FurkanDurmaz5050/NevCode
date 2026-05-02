// OpenAI istemcisi — artık doğrudan OpenAI'a değil, Supabase Edge Function
// proxy'sine (`openai-chat`) istek atar. API key sadece sunucuda yaşar.

import { ANON_KEY, FUNCTIONS_URL } from "./supabase";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const ENDPOINT = `${FUNCTIONS_URL}/openai-chat`;

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ANON_KEY) {
    h["Authorization"] = `Bearer ${ANON_KEY}`;
    h["apikey"] = ANON_KEY;
  }
  return h;
}

export async function chat(messages: ChatMessage[], model = "gpt-4o-mini"): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ messages, model, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`openai-chat ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.content ?? "";
}

export async function* chatStream(messages: ChatMessage[], model = "gpt-4o-mini") {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ messages, model, stream: true }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`openai-chat ${res.status}: ${text}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // OpenAI bazen yarım chunk gönderebilir; sessizce atla.
      }
    }
  }
}

export const RESEARCH_SYSTEM_PROMPT = `Sen GlobalNest adlı platformun derin pazar araştırma ajanısın.
KOBİ'lerin yurtdışı pazarlara açılmasına yardım ediyorsun.
Bir işletmenin web sitesi/Instagram/fikrini al ve şunları üret:
1) Hedef ülke önerileri (skor, gerekçe)
2) Pazaryeri haritası (Amazon, Otto, Bol, Noon, Rakuten vb.)
3) Rakip analizi
4) Fiyatlandırma stratejisi (döviz dahil)
5) Lojistik & karbon önerisi (deniz/hava/kara)
6) Pazarlama açısı (her dil için hook + CTA)
7) Yasal/uyumluluk kısa notları
Kısa, madde işaretli, eyleme dönük yaz. Türkçe.`;

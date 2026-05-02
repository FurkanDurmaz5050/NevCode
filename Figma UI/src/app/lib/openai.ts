// OpenAI istemcisi — anahtar .env.local içinden okunur (VITE_OPENAI_API_KEY).
// Üretimde mutlaka backend proxy kullanın; tarayıcıdan key sızdırmayın.

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const BASE_URL = "https://api.openai.com/v1";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], model = "gpt-4o-mini"): Promise<string> {
  if (!API_KEY) throw new Error("VITE_OPENAI_API_KEY .env.local içinde tanımlı değil");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`OpenAI hata: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export async function* chatStream(messages: ChatMessage[], model = "gpt-4o-mini") {
  if (!API_KEY) throw new Error("VITE_OPENAI_API_KEY tanımlı değil");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI hata: ${res.status}`);
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
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {}
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

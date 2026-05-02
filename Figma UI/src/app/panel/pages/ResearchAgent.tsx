import { useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { chatStream, RESEARCH_SYSTEM_PROMPT, type ChatMessage } from "../../lib/openai";

const PRESETS = [
  "Türk kozmetik markası için Almanya pazarı derin analizi yap",
  "BAE'de el yapımı tekstil için fiyatlandırma stratejisi",
  "Hollanda Bol.com'da gıda ürünü yasal süreci",
  "Japonya Rakuten için lokalizasyon checklist",
];

export function ResearchAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: RESEARCH_SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages([...newMsgs, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      let acc = "";
      for await (const chunk of chatStream(newMsgs)) {
        acc += chunk;
        setMessages([...newMsgs, { role: "assistant", content: acc }]);
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch (e: any) {
      setError(e.message || "Bilinmeyen hata");
      setMessages(newMsgs);
    } finally {
      setStreaming(false);
    }
  };

  const visible = messages.filter((m) => m.role !== "system");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>AI Araştırma Ajanı</h1>
          <p className="text-sm text-slate-500 mt-1">GPT-4o destekli derin pazar analizi & stratejik öneri.</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Bağlı · gpt-4o-mini
        </span>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 flex flex-col h-[640px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {visible.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <p style={{ fontWeight: 600 }}>Derin pazar araştırması</p>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  İşletmeni veya hedef pazarı tarif et — agent ülke skoru, rakip haritası,
                  fiyatlandırma, lojistik ve pazarlama açısı çıkarır.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-xl">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              visible.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 border border-slate-200"
                  }`}>
                    {m.content || <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="mx-5 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p style={{ fontWeight: 500 }}>API hatası</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="p-3 border-t border-slate-200 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1}
              placeholder="Bir pazar, ürün veya strateji sor... (Enter)"
              className="flex-1 resize-none px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm focus:border-emerald-400"
            />
            <button
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-5">
            <Sparkles className="w-5 h-5 mb-2" />
            <p style={{ fontWeight: 600 }}>Agent yetenekleri</p>
            <ul className="text-xs mt-2 space-y-1.5 opacity-90">
              <li>• Ülke uyum skoru</li>
              <li>• Rakip haritası</li>
              <li>• Pazarlama açısı + CTA</li>
              <li>• Yasal/uyumluluk notu</li>
              <li>• Lojistik & karbon önerisi</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-3">Son araştırmalar</p>
            <div className="space-y-2">
              {["DE — Kozmetik", "AE — Tekstil", "NL — Gıda"].map((t) => (
                <div key={t} className="text-sm p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

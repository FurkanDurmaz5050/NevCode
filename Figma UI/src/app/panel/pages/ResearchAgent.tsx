import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, AlertTriangle, Globe, ExternalLink } from "lucide-react";
import { chatStream, RESEARCH_SYSTEM_PROMPT, type ChatMessage } from "../../lib/openai";
import { useBusinessState } from "../../lib/business";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";
import { webSearch, type SearchHit } from "../../lib/research-search";

const TRIGGERS = [
  "güncel", "trend", "bugün", "haftaki", "ayın", "2025", "2026", "son", "şu an", "yeni",
  "rakip", "fiyat", "regülasyon", "düzenleme", "vergi", "tarife", "fee", "kampanya",
  "haber", "news", "latest", "current", "recent", "2024",
];

const PRESETS = [
  "İşletmem için en iyi 3 pazarı kıyasla",
  "Pazara giriş checklist'i hazırla",
  "Rakip fiyatlandırması nasıl konumlanmalı?",
  "İlk 30 günlük pazarlama planı yaz",
];

interface ChatItem {
  role: "user" | "assistant";
  content: string;
  citations?: SearchHit[];
}

function shouldSearch(text: string): boolean {
  const lower = text.toLowerCase();
  return TRIGGERS.some((t) => lower.includes(t));
}

export function ResearchAgentPage() {
  const biz = useBusinessState();
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [systemPrompt, setSystemPrompt] = useState(RESEARCH_SYSTEM_PROMPT);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [searching, setSearching] = useState(false);
  const [webEnabled, setWebEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const latest = await loadLatestAnalysis().catch(() => null);
      const ms = latest?.markets ?? [];
      setMarkets(ms);
      const ctx = [
        RESEARCH_SYSTEM_PROMPT,
        biz.business
          ? `\n=== AKTİF İŞLETME ===\nMarka: ${biz.business.name ?? "-"}\nÜrün: ${biz.business.product_name ?? "-"} (${biz.business.category ?? "-"})\nWeb sitesi (BU URL'İ İNCELE): ${biz.business.website ?? "-"}\nInstagram: @${biz.business.instagram ?? "-"}\nFikir / açıklama: ${biz.business.idea ?? "-"}\nBirim maliyet: ${biz.business.unit_cost_try ?? "-"} TRY · Tedarik: ${biz.business.lead_time_days ?? "-"} gün · Ağırlık: ${biz.business.weight_kg ?? "-"} kg`
          : "",
        ms.length
          ? `\n=== SON ANALİZ — ÖNERİLEN PAZARLAR ===\n${ms
              .slice(0, 8)
              .map((m) => {
                const met = m.metrics ?? {};
                const metStr = [
                  met.market_size_usd ? `pazar $${(met.market_size_usd / 1e6).toFixed(0)}M` : "",
                  met.cagr_pct ? `CAGR %${met.cagr_pct}` : "",
                  met.tariff_pct ? `tarife %${met.tariff_pct}` : "",
                  met.avg_order_value_usd ? `AOV $${met.avg_order_value_usd}` : "",
                ].filter(Boolean).join(", ");
                const src = (m.sources ?? []).slice(0, 2).join(" | ");
                return `- ${m.flag ?? ""} ${m.country} (uyum ${m.fit_score}, marj ~%${m.avg_margin ?? "?"}, ${metStr}; marketplaces: ${m.marketplaces.join(", ")}; rakipler: ${m.competitors.slice(0, 3).join(", ")}${src ? `; kaynak: ${src}` : ""})`;
              })
              .join("\n")}`
          : "",
        "\nKullanıcı sorularını bu bağlam ışığında, somut, niceliksel ve eyleme dönük cevapla. İşletmenin web sitesi URL'sini referans göstererek konuş. Web arama sonuçları sağlandığında bunlara başvur ve [1], [2] gibi atıf yap.",
      ].filter(Boolean).join("");
      setSystemPrompt(ctx);
    })();
  }, [biz.business?.id]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;
    setError(null);
    setInput("");

    let citations: SearchHit[] = [];
    let webBlock = "";
    if (webEnabled && shouldSearch(q)) {
      setSearching(true);
      try {
        const cat = biz.business?.category ?? biz.business?.product_name ?? "";
        const enriched = cat ? `${q} (context: ${cat} 2026)` : q;
        const r = await webSearch(enriched, { max_results: 5, depth: "advanced" });
        citations = r.results;
        if (r.results.length) {
          webBlock = `\n\n[WEB SEARCH RESULTS for "${enriched}"]\n${r.answer ? `Özet: ${r.answer}\n` : ""}${r.results
            .map((h, i) => `[${i + 1}] ${h.title} — ${h.url}\n   ${h.snippet.slice(0, 280)}`)
            .join("\n")}\n[/WEB SEARCH]`;
        }
      } catch (e: any) {
        console.warn("web search failed", e?.message);
      } finally {
        setSearching(false);
      }
    }

    const userItem: ChatItem = { role: "user", content: q, citations };
    setItems((prev) => [...prev, userItem, { role: "assistant", content: "" }]);

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt + (webBlock ? `\n\n${webBlock}` : "") },
      ...items.map((it) => ({ role: it.role, content: it.content } as ChatMessage)),
      { role: "user", content: q },
    ];

    setStreaming(true);
    try {
      let acc = "";
      for await (const chunk of chatStream(chatMessages)) {
        acc += chunk;
        setItems((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch (e: any) {
      setError(e.message || "Bilinmeyen hata");
      setItems((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const recent = markets.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>AI Araştırma Ajanı</h1>
          <p className="text-sm text-slate-500 mt-1">İşletme bağlamı + canlı web araması ile derin pazar analizi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWebEnabled((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition ${
              webEnabled
                ? "bg-sky-50 border-sky-200 text-sky-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
            title="Tavily web araması"
          >
            <Globe className={`w-3.5 h-3.5 ${searching ? "animate-spin" : ""}`} />
            Web {webEnabled ? "açık" : "kapalı"}
          </button>
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Bağlı
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 flex flex-col h-[640px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
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
                      onClick={() => void send(p)}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              items.map((m, i) => {
                const prevCitations = i > 0 && m.role === "assistant" ? items[i - 1]?.citations : undefined;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 border border-slate-200"
                    }`}>
                      {m.role === "user" && m.citations && m.citations.length > 0 && (
                        <div className="mb-2 pb-2 border-b border-white/20 text-[11px] text-sky-200 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          {m.citations.length} web kaynağı arandı
                        </div>
                      )}
                      {m.content || <Loader2 className="w-4 h-4 animate-spin" />}
                      {prevCitations && prevCitations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                          <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>Kaynaklar</p>
                          {prevCitations.slice(0, 5).map((c, idx) => (
                            <a
                              key={c.url}
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-700 hover:text-sky-900 hover:underline truncate flex items-center gap-1"
                            >
                              <span className="text-slate-400">[{idx + 1}]</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{c.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {searching && (
              <div className="flex justify-start">
                <div className="bg-sky-50 border border-sky-200 text-sky-700 text-xs px-3 py-2 rounded-full flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 animate-spin" />
                  Web aranıyor...
                </div>
              </div>
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
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
              }}
              rows={1}
              placeholder="Bir pazar, ürün veya strateji sor... (Enter)"
              className="flex-1 resize-none px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm focus:border-emerald-400"
            />
            <button
              onClick={() => void send(input)}
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
              <li>• İşletme bağlamı injection</li>
              <li>• Canlı web araması (Tavily)</li>
              <li>• Ülke uyum + rakip haritası</li>
              <li>• Pazarlama açısı + CTA</li>
              <li>• Yasal/uyumluluk notu</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-3">Pazarlarınız</p>
            <div className="space-y-2">
              {recent.length === 0 ? (
                <p className="text-xs text-slate-400">Henüz analiz yok. Başla sekmesinden başlayın.</p>
              ) : (
                recent.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => void send(`${m.country} pazarı için derin analiz, rakip haritası ve giriş stratejisi öner.`)}
                    className="w-full text-left text-sm p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>{m.flag} {m.country}</span>
                    <span className="text-xs text-slate-500">{m.fit_score}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

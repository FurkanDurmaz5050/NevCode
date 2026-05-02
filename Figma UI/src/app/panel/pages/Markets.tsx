import { useEffect, useState } from "react";
import { Filter, MoreVertical, TrendingUp, RefreshCw, Loader2, X } from "lucide-react";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";

export function MarketsPage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MarketRow | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const latest = await loadLatestAnalysis();
      if (latest) {
        setMarkets(latest.markets);
        setAnalysisId(latest.id);
      } else {
        setMarkets([]);
        setAnalysisId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Pazaryerleri</h1>
          <p className="text-sm text-slate-500 mt-1">
            {analysisId
              ? `${markets.length} pazar · son analiz: ${analysisId.slice(0, 8)}`
              : "Henüz analiz yok — Başla sayfasından bir analiz çalıştır."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
          <button className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" /> Filtrele
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex items-center justify-center text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Yükleniyor...
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
          Henüz pazar yok. <span className="text-emerald-600">Başla</span> sayfasından bir analiz çalıştır.
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-5 py-3">Ülke</th>
                <th className="text-left px-5 py-3">Pazaryerleri</th>
                <th className="text-left px-5 py-3">Uyum skoru</th>
                <th className="text-right px-5 py-3">Marj</th>
                <th className="text-right px-5 py-3">Rekabet</th>
                <th className="text-right px-5 py-3">Talep</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.flag ?? "🌍"}</span>
                      <span style={{ fontWeight: 500 }}>{m.country}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {(m.marketplaces ?? []).slice(0, 3).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          style={{ width: `${m.fit_score}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{m.fit_score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums" style={{ fontWeight: 500 }}>
                    %{m.avg_margin ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        m.competition === "Düşük"
                          ? "bg-emerald-50 text-emerald-700"
                          : m.competition === "Yüksek"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {m.competition ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">{m.est_demand ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1 rounded hover:bg-slate-100">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {markets[0] && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" /> <p className="text-xs">En güçlü öneri</p>
            </div>
            <p style={{ fontWeight: 600 }}>
              {markets[0].flag} {markets[0].country} — uyum skoru {markets[0].fit_score}
            </p>
            <p className="text-sm opacity-90 mt-1 max-w-xl">
              {markets[0].rationale ?? "Yüksek uyum skoru ile öncelikli pazar."}
            </p>
          </div>
          <button
            onClick={() => setSelected(markets[0])}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm hover:bg-slate-100"
          >
            Detay
          </button>
        </div>
      )}

      {selected && <MarketDrawer market={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MarketDrawer({ market, onClose }: { market: MarketRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">Pazar detayı</p>
            <h2 className="text-xl mt-1" style={{ fontWeight: 600 }}>
              {market.flag} {market.country}{" "}
              <span className="text-sm text-slate-500">({market.country_code})</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <Stat label="Uyum skoru" value={`${market.fit_score} / 100`} />
          <Stat label="Tahmini marj" value={`%${market.avg_margin ?? "—"}`} />
          <Stat label="Rekabet" value={market.competition ?? "—"} />
          <Stat label="Talep" value={market.est_demand ?? "—"} />
          <Stat label="Para birimi" value={market.currency ?? "—"} />
          <Stat
            label="Lojistik"
            value={`${market.shipping_mode ?? "—"} · ${market.shipping_days ?? "—"} gün · $${market.shipping_cost_per_kg ?? "—"}/kg`}
          />
          <Stat label="Karbon" value={`${market.carbon_kg_per_kg ?? "—"} kgCO₂/kg`} />
          <Stat label="Vergi notu" value={market.tax_note ?? "—"} />

          <Section title="Pazaryerleri">
            <div className="flex flex-wrap gap-1.5">
              {(market.marketplaces ?? []).map((m) => (
                <span key={m} className="text-xs px-2 py-1 rounded-full bg-slate-100">
                  {m}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Gerekçe">
            <p className="text-slate-700 leading-relaxed">{market.rationale ?? "—"}</p>
          </Section>

          {(market.competitors ?? []).length > 0 && (
            <Section title="Rakipler">
              <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                {market.competitors.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Section>
          )}

          {(market.regulations ?? []).length > 0 && (
            <Section title="Regülasyon / uyumluluk">
              <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                {market.regulations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Section>
          )}

          {market.metrics && Object.values(market.metrics).some((v) => v !== undefined) && (
            <Section title="Niceliksel veriler">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {market.metrics.market_size_usd !== undefined && (
                  <Stat label="Pazar büyüklüğü" value={`$${formatBig(market.metrics.market_size_usd)}`} />
                )}
                {market.metrics.cagr_pct !== undefined && (
                  <Stat label="CAGR" value={`%${market.metrics.cagr_pct}`} />
                )}
                {market.metrics.tariff_pct !== undefined && (
                  <Stat label="Gümrük" value={`%${market.metrics.tariff_pct}`} />
                )}
                {market.metrics.avg_order_value_usd !== undefined && (
                  <Stat label="Ort. sipariş" value={`$${market.metrics.avg_order_value_usd}`} />
                )}
                {market.metrics.avg_price_usd !== undefined && (
                  <Stat label="Ort. fiyat" value={`$${market.metrics.avg_price_usd}`} />
                )}
              </div>
            </Section>
          )}

          {(market.sources ?? []).length > 0 && (
            <Section title="Kaynaklar">
              <ul className="space-y-1 text-xs">
                {market.sources!.map((s) => (
                  <li key={s} className="truncate">
                    <a href={s} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </aside>
    </div>
  );
}

function formatBig(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

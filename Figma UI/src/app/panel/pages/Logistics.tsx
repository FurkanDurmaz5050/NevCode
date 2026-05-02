import { useEffect, useMemo, useState } from "react";
import { Truck, Plane, Ship, Train, Package, MapPin, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchShipping, type ShippingQuote, type ShippingResponse } from "../../lib/analytics";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";

const MODE_ICONS = { Hava: Plane, Kara: Truck, Deniz: Ship, Demiryolu: Train };

export function LogisticsPage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [weight, setWeight] = useState(50);
  const [results, setResults] = useState<Record<string, ShippingResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await loadLatestAnalysis();
      const ms = latest?.markets ?? [];
      setMarkets(ms);
      const top = ms.slice(0, 6);
      const out: Record<string, ShippingResponse> = {};
      await Promise.all(top.map(async (m) => {
        if (!m.country_code) return;
        try {
          out[m.id] = await fetchShipping({
            to_country: m.country_code,
            weight_kg: weight,
          });
        } catch { /* skip */ }
      }));
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [weight]);

  const stats = useMemo(() => {
    const all = Object.values(results).flatMap((r) => r.quotes);
    const cheapest = all.sort((a, b) => a.cost_eur - b.cost_eur)[0];
    const greenest = all.sort((a, b) => a.co2_kg - b.co2_kg)[0];
    return { cheapest, greenest, count: Object.keys(results).length };
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Lojistik</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pazarlarınız için gerçek zamanlı taşıma teklifleri (Shippo + tahmin)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Kg</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          />
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={MapPin} label="Hedef pazar" value={String(stats.count)} />
        <Stat icon={Package} label="Test ağırlığı" value={`${weight} kg`} />
        <Stat icon={Truck} label="En ucuz mod" value={stats.cheapest?.mode ?? "—"}
              sub={stats.cheapest ? `€${stats.cheapest.cost_eur}` : undefined} />
        <Stat icon={Ship} label="En yeşil mod" value={stats.greenest?.mode ?? "—"}
              sub={stats.greenest ? `${stats.greenest.co2_kg} kg CO₂` : undefined} />
      </div>

      {markets.length === 0 && !loading && (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
          Önce <span className="text-emerald-600">Başla</span> sayfasından bir analiz yap.
        </div>
      )}

      <div className="space-y-3">
        {markets.slice(0, 6).map((m) => {
          const r = results[m.id];
          return (
            <div key={m.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.flag ?? "🌍"}</span>
                  <p style={{ fontWeight: 600 }}>{m.country}</p>
                  <span className="text-xs text-slate-500">{m.country_code}</span>
                </div>
                {r && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Önerilen: {r.recommended_mode}
                  </span>
                )}
              </div>
              {r ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
                  {r.quotes.map((q) => {
                    const Icon = MODE_ICONS[q.mode];
                    const isBest = q.mode === r.recommended_mode;
                    return (
                      <div key={q.mode} className={`p-4 ${isBest ? "bg-emerald-50/40" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span className="text-sm" style={{ fontWeight: 500 }}>{q.mode}</span>
                          <span className="text-xs text-slate-400 ml-auto">{q.transit_days}g</span>
                        </div>
                        <p className="text-lg tabular-nums" style={{ fontWeight: 600 }}>€{q.cost_eur}</p>
                        <p className="text-xs text-slate-500">{q.cost_per_kg} €/kg · {q.co2_kg} kg CO₂</p>
                        <p className="text-[11px] text-slate-400 mt-1 truncate">{q.provider}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-400 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Veri çekiliyor…
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Leaf, TrendingDown, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { fetchShipping, fetchCarbon } from "../../lib/analytics";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";

interface MarketCarbon {
  market: MarketRow;
  best_mode: string;
  best_co2_kg: number;
  modes: { mode: string; co2_kg: number }[];
}

export function CarbonPage() {
  const [items, setItems] = useState<MarketCarbon[]>([]);
  const [weight, setWeight] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await loadLatestAnalysis();
      const top = (latest?.markets ?? []).slice(0, 6).filter((m) => m.country_code);
      const results: MarketCarbon[] = [];
      for (const m of top) {
        try {
          const ship = await fetchShipping({ to_country: m.country_code!, weight_kg: weight });
          const modes = await Promise.all(
            ship.quotes.map(async (q) => {
              const c = await fetchCarbon({
                weight_kg: weight,
                distance_km: ship.distance_km,
                mode: q.mode,
              });
              return { mode: q.mode, co2_kg: c.co2e_kg };
            }),
          );
          const best = [...modes].sort((a, b) => a.co2_kg - b.co2_kg)[0];
          results.push({ market: m, modes, best_mode: best.mode, best_co2_kg: best.co2_kg });
        } catch { /* skip */ }
      }
      setItems(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [weight]);

  const totals = useMemo(() => {
    const totalBest = items.reduce((a, b) => a + b.best_co2_kg, 0);
    const totalWorst = items.reduce(
      (a, b) => a + Math.max(...b.modes.map((m) => m.co2_kg)),
      0,
    );
    return {
      best: +totalBest.toFixed(2),
      worst: +totalWorst.toFixed(2),
      saved: +(totalWorst - totalBest).toFixed(2),
    };
  }, [items]);

  const COLORS: Record<string, string> = {
    Hava: "#ef4444", Kara: "#f59e0b", Demiryolu: "#10b981", Deniz: "#059669",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Karbon</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pazar bazlı taşıma karbonu (Climatiq + tahmin)
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

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4" />
            <p className="text-xs opacity-90">En düşük karbon senaryosu (tüm pazarlar)</p>
          </div>
          <p className="text-4xl tracking-tight mb-1" style={{ fontWeight: 600 }}>
            {totals.best} kg CO₂e
          </p>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <TrendingDown className="w-4 h-4" />
            En kötü moda göre {totals.saved} kg tasarruf
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs text-slate-500">En yüksek karbon</p>
          <p className="text-3xl tracking-tight mb-2" style={{ fontWeight: 600 }}>
            {totals.worst} <span className="text-base text-slate-500">kg</span>
          </p>
          <p className="text-xs text-slate-500">
            Hava kargo seçilirse ortaya çıkan tahmini emisyon
          </p>
        </div>
      </div>

      {items.length === 0 && !loading && (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
          Önce <span className="text-emerald-600">Başla</span> sayfasından bir analiz yap.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.market.id} className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{it.market.flag ?? "🌍"}</span>
                <p style={{ fontWeight: 600 }}>{it.market.country}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                En yeşil: {it.best_mode} · {it.best_co2_kg} kg
              </span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={it.modes}>
                  <XAxis dataKey="mode" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v} kg`, "CO₂e"]} />
                  <Bar dataKey="co2_kg" radius={[6, 6, 0, 0]}>
                    {it.modes.map((m) => (
                      <Cell key={m.mode} fill={COLORS[m.mode] ?? "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

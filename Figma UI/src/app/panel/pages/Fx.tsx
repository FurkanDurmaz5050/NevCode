import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, RefreshCw, Calculator } from "lucide-react";
import { fetchFx, type FxPair } from "../../lib/analytics";

const SYMBOLS = ["EUR", "USD", "GBP", "CHF", "JPY", "CNY"];

export function FxPage() {
  const [pairs, setPairs] = useState<Record<string, FxPair>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [active, setActive] = useState<string>("EUR");
  const [priceTry, setPriceTry] = useState<number>(1000);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchFx({ base: "TRY", symbols: SYMBOLS });
      setPairs(r.pairs);
      setUpdated(new Date());
      const first = Object.keys(r.pairs)[0];
      if (first) setActive((cur) => r.pairs[cur] ? cur : first);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => Object.values(pairs), [pairs]);
  const cur = pairs[active];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Döviz & Fiyat</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerçek kur (exchangerate.host) · 7 gün AI tahmini
            {updated && ` · son: ${updated.toLocaleTimeString("tr-TR")}`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex items-center justify-center text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Kur bilgileri çekiliyor…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {list.map((p) => {
              const sym = p.pair.split("/")[0];
              const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Minus;
              const color = p.change_24h_pct > 0 ? "text-emerald-600" : p.change_24h_pct < 0 ? "text-rose-600" : "text-slate-500";
              return (
                <button
                  key={sym}
                  onClick={() => setActive(sym)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    active === sym ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">{p.pair}</p>
                    <span className={`text-xs flex items-center gap-0.5 ${color}`}>
                      <TrendIcon className="w-3 h-3" /> {p.change_24h_pct > 0 ? "+" : ""}{p.change_24h_pct}%
                    </span>
                  </div>
                  <p className="text-xl tabular-nums tracking-tight" style={{ fontWeight: 600 }}>
                    {p.current.toFixed(2)} ₺
                  </p>
                  <div className="h-10 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={p.history}>
                        <Line dataKey="value" stroke={p.trend === "down" ? "#f43f5e" : "#10b981"} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </button>
              );
            })}
          </div>

          {cur && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 600 }}>{cur.pair} · 30 gün geçmiş + 7 gün tahmin</p>
                  <p className="text-xs text-slate-500">
                    Trend: <span className={cur.trend === "up" ? "text-emerald-600" : cur.trend === "down" ? "text-rose-600" : ""}>
                      {cur.trend === "up" ? "Yükseliş" : cur.trend === "down" ? "Düşüş" : "Yatay"}
                    </span>
                  </p>
                </div>
                {cur.trend === "down" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Marj uyarısı
                  </span>
                )}
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    ...cur.history.map((h) => ({ d: h.date.slice(5), v: h.value, kind: "h" as const })),
                    ...cur.forecast_7d.map((h) => ({ d: h.date.slice(5), f: h.value, kind: "f" as const })),
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine x={cur.history[cur.history.length - 1]?.date.slice(5)} stroke="#cbd5e1" strokeDasharray="4 4" />
                    <Line dataKey="v" name="Geçmiş" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    <Line dataKey="f" name="Tahmin" stroke="#10b981" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {list.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <p style={{ fontWeight: 600 }}>Fiyat çevirici</p>
                  <span className="text-xs text-slate-500">— TRY tutarınızı her pazarda görüntüleyin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">₺</span>
                  <input
                    type="number"
                    value={priceTry}
                    onChange={(e) => setPriceTry(Math.max(0, Number(e.target.value) || 0))}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {list.map((p) => {
                  const sym = p.pair.split("/")[0];
                  const converted = p.current > 0 ? priceTry / p.current : 0;
                  const forecastAvg =
                    p.forecast_7d.length > 0
                      ? p.forecast_7d.reduce((a, b) => a + b.value, 0) / p.forecast_7d.length
                      : p.current;
                  const futurePrice = forecastAvg > 0 ? priceTry / forecastAvg : 0;
                  const delta = converted > 0 ? ((futurePrice - converted) / converted) * 100 : 0;
                  const sign = delta > 0 ? "+" : "";
                  return (
                    <div key={sym} className="rounded-xl border border-slate-200 p-3 bg-slate-50/40">
                      <p className="text-[11px] text-slate-500">{sym}</p>
                      <p className="text-lg tabular-nums" style={{ fontWeight: 600 }}>
                        {converted.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[11px] tabular-nums ${
                        delta > 0.1 ? "text-emerald-600" : delta < -0.1 ? "text-rose-600" : "text-slate-400"
                      }`}>
                        7g: {sign}{delta.toFixed(2)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

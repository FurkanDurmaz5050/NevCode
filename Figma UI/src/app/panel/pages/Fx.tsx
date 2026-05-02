import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const series = (base: number) => Array.from({ length: 30 }, (_, i) => ({
  d: `${i + 1}`,
  v: +(base + Math.sin(i / 4) * 0.4 + i * 0.05 + Math.random() * 0.2).toFixed(2),
}));

const pairs = [
  { p: "EUR/TRY", c: 33.50, ch: "+1.4%", up: true, data: series(32.8) },
  { p: "USD/TRY", c: 30.21, ch: "+0.8%", up: true, data: series(29.6) },
  { p: "GBP/TRY", c: 39.84, ch: "-0.3%", up: false, data: series(40.0) },
  { p: "AED/TRY", c: 8.22, ch: "+0.6%", up: true, data: series(8.05) },
];

const products = [
  { name: "Gül suyu 100ml", cost: "₺120", de: "€8.50", uk: "£7.20", ae: "AED 38", margin: "%34" },
  { name: "Premium kutu set", cost: "₺480", de: "€34.00", uk: "£29.00", ae: "AED 152", margin: "%41" },
  { name: "Mini set 3'lü", cost: "₺220", de: "€15.50", uk: "£13.10", ae: "AED 70", margin: "%37" },
];

export function FxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Döviz & Fiyat</h1>
        <p className="text-sm text-slate-500 mt-1">7 gün AI tahmini · marj koruma uyarıları</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pairs.map((p) => (
          <div key={p.p} className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{p.p}</p>
              <span className={`text-xs flex items-center gap-0.5 ${p.up ? "text-emerald-600" : "text-rose-600"}`}>
                {p.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {p.ch}
              </span>
            </div>
            <p className="text-xl tabular-nums tracking-tight" style={{ fontWeight: 600 }}>{p.c} ₺</p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={p.data}>
                  <Line type="monotone" dataKey="v" stroke={p.up ? "#10b981" : "#f43f5e"} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">EUR/TRY · 30 günlük tahmin</p>
            <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>33.50 ₺ → 34.20 ₺</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">+%2.1 öngörü</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series(32.5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm" style={{ fontWeight: 500 }}>Marj koruma uyarısı</p>
          <p className="text-xs text-amber-800 mt-1">Tedarik süresi 7 gün — bu süreçte EUR/TRY %1.8 artması bekleniyor. Almanya fiyat etiketlerini güncellemenizi öneririz.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <p style={{ fontWeight: 600 }}>Ürün fiyat etiketleri</p>
          <p className="text-xs text-slate-500">Pazara göre AI tarafından önerilen fiyatlar</p>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 bg-slate-50">
            <tr>
              <th className="text-left px-5 py-3">Ürün</th>
              <th className="text-right px-5 py-3">Maliyet</th>
              <th className="text-right px-5 py-3">🇩🇪 DE</th>
              <th className="text-right px-5 py-3">🇬🇧 UK</th>
              <th className="text-right px-5 py-3">🇦🇪 AE</th>
              <th className="text-right px-5 py-3">Marj</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.name} className="border-t border-slate-100">
                <td className="px-5 py-3" style={{ fontWeight: 500 }}>{p.name}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.cost}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.de}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.uk}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.ae}</td>
                <td className="px-5 py-3 text-right text-emerald-600">{p.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

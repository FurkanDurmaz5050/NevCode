import { Plus, Filter, MoreVertical, TrendingUp } from "lucide-react";

const markets = [
  { c: "Almanya", f: "🇩🇪", mp: "Otto, Amazon.de", score: 94, rev: "€18.420", orders: 142, status: "Aktif" },
  { c: "Hollanda", f: "🇳🇱", mp: "Bol.com", score: 89, rev: "€14.110", orders: 98, status: "Aktif" },
  { c: "BAE", f: "🇦🇪", mp: "Noon, Amazon.ae", score: 86, rev: "€12.840", orders: 71, status: "Aktif" },
  { c: "İngiltere", f: "🇬🇧", mp: "Amazon.co.uk", score: 82, rev: "€9.320", orders: 64, status: "Aktif" },
  { c: "Japonya", f: "🇯🇵", mp: "Rakuten", score: 78, rev: "—", orders: 0, status: "Hazırlanıyor" },
  { c: "ABD", f: "🇺🇸", mp: "Amazon.com, Etsy", score: 76, rev: "—", orders: 0, status: "Önerilen" },
  { c: "İsveç", f: "🇸🇪", mp: "Amazon.se, CDON", score: 73, rev: "—", orders: 0, status: "Önerilen" },
];

export function MarketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Pazaryerleri</h1>
          <p className="text-sm text-slate-500 mt-1">12 aktif kanal · 4 yeni öneri</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" /> Filtrele
          </button>
          <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-1.5 hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> Pazar ekle
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-5 py-3">Ülke</th>
              <th className="text-left px-5 py-3">Pazaryerleri</th>
              <th className="text-left px-5 py-3">Uyum skoru</th>
              <th className="text-right px-5 py-3">Gelir</th>
              <th className="text-right px-5 py-3">Sipariş</th>
              <th className="text-right px-5 py-3">Durum</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.c} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-4 flex items-center gap-2">
                  <span className="text-2xl">{m.f}</span>
                  <span style={{ fontWeight: 500 }}>{m.c}</span>
                </td>
                <td className="px-5 py-4 text-slate-600">{m.mp}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${m.score}%` }} />
                    </div>
                    <span className="tabular-nums">{m.score}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right tabular-nums" style={{ fontWeight: 500 }}>{m.rev}</td>
                <td className="px-5 py-4 text-right tabular-nums">{m.orders}</td>
                <td className="px-5 py-4 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === "Aktif" ? "bg-emerald-50 text-emerald-700" :
                    m.status === "Hazırlanıyor" ? "bg-amber-50 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{m.status}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1 rounded hover:bg-slate-100"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" /> <p className="text-xs">AI önerisi</p>
          </div>
          <p style={{ fontWeight: 600 }}>Suudi Arabistan pazarına girmek için ideal zaman</p>
          <p className="text-sm opacity-90 mt-1">Talep son 90 günde %47 arttı, rekabet düşük, marj %45.</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm hover:bg-slate-100">Ekle</button>
      </div>
    </div>
  );
}

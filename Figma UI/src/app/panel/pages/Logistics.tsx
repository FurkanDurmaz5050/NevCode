import { Truck, Plane, Ship, Train, Package, MapPin } from "lucide-react";

const routes = [
  { from: "İstanbul", to: "Hamburg", mode: "Deniz", days: 14, cost: "€0.41/kg", co2: "0.02 kg", icon: Ship, recommended: true },
  { from: "İstanbul", to: "Rotterdam", mode: "Deniz", days: 12, cost: "€0.45/kg", co2: "0.02 kg", icon: Ship },
  { from: "İstanbul", to: "Berlin", mode: "Kara", days: 6, cost: "€2.40/kg", co2: "0.18 kg", icon: Truck },
  { from: "İstanbul", to: "Dubai", mode: "Hava", days: 3, cost: "€4.80/kg", co2: "0.82 kg", icon: Plane },
  { from: "İstanbul", to: "Stockholm", mode: "Demiryolu", days: 12, cost: "€0.90/kg", co2: "0.04 kg", icon: Train },
];

const shipments = [
  { id: "SH-3201", route: "İST → HAM", carrier: "Maersk", weight: "240 kg", eta: "8 May", status: "Yolda", progress: 62 },
  { id: "SH-3200", route: "İST → DXB", carrier: "Turkish Cargo", weight: "45 kg", eta: "4 May", status: "Gümrükte", progress: 88 },
  { id: "SH-3199", route: "İST → AMS", carrier: "DHL", weight: "120 kg", eta: "5 May", status: "Yolda", progress: 71 },
  { id: "SH-3198", route: "İST → LHR", carrier: "DSV", weight: "78 kg", eta: "Teslim ✓", status: "Teslim edildi", progress: 100 },
];

export function LogisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Lojistik</h1>
        <p className="text-sm text-slate-500 mt-1">Rota optimizasyonu · taşıyıcı entegrasyonu · gümrük</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Package} label="Aktif sevkiyat" value="14" />
        <Stat icon={Ship} label="Bu ay teslim" value="62" />
        <Stat icon={MapPin} label="Anlaşmalı taşıyıcı" value="9" />
        <Stat icon={Truck} label="Ortalama teslim" value="9.2 gün" />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <p style={{ fontWeight: 600 }}>Önerilen rotalar</p>
          <p className="text-xs text-slate-500">Maliyet, süre ve karbon optimize edilmiş seçenekler</p>
        </div>
        <div className="divide-y divide-slate-100">
          {routes.map((r, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                r.recommended ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
              }`}>
                <r.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ fontWeight: 500 }}>{r.from} → {r.to}</p>
                  {r.recommended && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Önerilen</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{r.mode} · {r.days} gün</p>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums" style={{ fontWeight: 500 }}>{r.cost}</p>
                <p className="text-xs text-slate-500">{r.co2} CO₂/kg</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs">Seç</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <p style={{ fontWeight: 600 }}>Aktif sevkiyatlar</p>
        </div>
        <div className="divide-y divide-slate-100">
          {shipments.map((s) => (
            <div key={s.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm tabular-nums text-slate-600">{s.id}</p>
                  <p className="text-sm" style={{ fontWeight: 500 }}>{s.route}</p>
                  <span className="text-xs text-slate-500">· {s.carrier} · {s.weight}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">ETA {s.eta}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "Teslim edildi" ? "bg-emerald-50 text-emerald-700" :
                    s.status === "Gümrükte" ? "bg-amber-50 text-amber-700" :
                    "bg-sky-50 text-sky-700"
                  }`}>{s.status}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full ${s.progress === 100 ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  );
}

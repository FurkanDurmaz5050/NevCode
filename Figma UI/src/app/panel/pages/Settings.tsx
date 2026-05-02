import { Key, User, Building2, Bell, CreditCard, Shield } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Ayarlar</h1>
        <p className="text-sm text-slate-500 mt-1">Hesap, entegrasyonlar, faturalandırma</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-1">
          {[
            { i: User, t: "Profil" },
            { i: Building2, t: "İşletme bilgileri" },
            { i: Key, t: "API anahtarları", active: true },
            { i: Bell, t: "Bildirimler" },
            { i: CreditCard, t: "Faturalandırma" },
            { i: Shield, t: "Güvenlik" },
          ].map((item) => (
            <button
              key={item.t}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                item.active ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <item.i className="w-4 h-4" /> {item.t}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 space-y-5">
          <div>
            <p style={{ fontWeight: 600 }}>API anahtarları</p>
            <p className="text-xs text-slate-500 mt-1">Üçüncü parti servis entegrasyonları</p>
          </div>

          <ApiKeyRow service="OpenAI" desc="Araştırma ajanı, içerik üretimi" status="connected" masked="sk-proj-...DAIA" />
          <ApiKeyRow service="ElevenLabs" desc="Sesli AI ajanı, telefon hattı" status="pending" masked="API key bekleniyor" />
          <ApiKeyRow service="Remotion" desc="Otomatik video render" status="connected" masked="rmt_...8x2" />
          <ApiKeyRow service="Stripe" desc="Ödeme & abonelik" status="connected" masked="sk_live_...9aF" />
          <ApiKeyRow service="Supabase" desc="Veritabanı, auth, storage" status="optional" masked="—" />

          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠ Üretimde API anahtarlarını tarayıcıdan değil, kendi backend proxy'niz üzerinden çağırın.
              Aksi halde anahtarlar sızabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyRow({ service, desc, status, masked }: any) {
  const tones: Record<string, string> = {
    connected: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    optional: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    connected: "Bağlı",
    pending: "Bekliyor",
    optional: "Opsiyonel",
  };
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm" style={{ fontWeight: 500 }}>{service}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tones[status]}`}>{labels[status]}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <code className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 tabular-nums">{masked}</code>
      <button className="text-xs text-emerald-600 hover:underline">Yönet</button>
    </div>
  );
}

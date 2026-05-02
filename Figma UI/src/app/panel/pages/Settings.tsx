import { useEffect, useState } from "react";
import { Key, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { ANON_KEY, FUNCTIONS_URL } from "../../lib/supabase";

interface HealthState {
  openai: boolean; openai_model: string; tavily: boolean;
  gemini: boolean; gemini_image_model: string;
  remotion_webhook: boolean; remotion_lambda: boolean;
  elevenlabs: boolean; twilio: boolean;
  shippo: boolean; climatiq: boolean;
}

const ROWS: { key: keyof HealthState; label: string; desc: string; required?: boolean }[] = [
  { key: "openai", label: "OpenAI", desc: "Derin araştırma + storyboard + post metinleri", required: true },
  { key: "gemini", label: "Gemini", desc: "Görsel üretimi (sosyal post + ürün)" },
  { key: "tavily", label: "Tavily", desc: "Web search (opsiyonel)" },
  { key: "remotion_webhook", label: "Remotion (yerel)", desc: "MP4 render webhook (port 5174)" },
  { key: "remotion_lambda", label: "Remotion Lambda", desc: "Bulut MP4 render (alternatif)" },
  { key: "shippo", label: "Shippo", desc: "Gerçek hava kargo kotaları" },
  { key: "climatiq", label: "Climatiq", desc: "Gerçek karbon emisyonu" },
  { key: "elevenlabs", label: "ElevenLabs", desc: "Sesli AI ajanı" },
  { key: "twilio", label: "Twilio", desc: "Telefon hattı / SMS" },
];

export function SettingsPage() {
  const [data, setData] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${FUNCTIONS_URL}/health`, {
        headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      });
      if (!r.ok) throw new Error(`health ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void fetchHealth(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Ayarlar</h1>
          <p className="text-sm text-slate-500 mt-1">Üçüncü parti entegrasyon durumu</p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Yenile
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-slate-500" />
          <p style={{ fontWeight: 600 }}>Entegrasyonlar</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Kontrol ediliyor...
          </div>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        {data && ROWS.map((row) => {
          const ok = data[row.key] as boolean;
          return (
            <div key={row.key} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ fontWeight: 500 }}>{row.label}</p>
                  {row.required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">zorunlu</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{row.desc}</p>
              </div>
              {ok ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                </span>
              ) : (
                <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  row.required ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"
                }`}>
                  <XCircle className="w-3.5 h-3.5" /> Yok
                </span>
              )}
            </div>
          );
        })}

        {data && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div><span className="text-slate-400">OpenAI modeli:</span> <code>{data.openai_model}</code></div>
            <div><span className="text-slate-400">Gemini görsel modeli:</span> <code>{data.gemini_image_model}</code></div>
          </div>
        )}

        <div className="pt-3">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Anahtarları <code>supabase/functions/.env</code> içinde sakla. Değişiklik sonrası
            edge runtime otomatik yeniden başlar.
          </p>
        </div>
      </div>
    </div>
  );
}

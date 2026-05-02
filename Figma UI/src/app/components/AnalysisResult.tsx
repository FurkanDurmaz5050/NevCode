import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar } from "recharts";
import { TrendingUp, Leaf, Truck, DollarSign, Film, PhoneCall, ChevronRight } from "lucide-react";
import type { BusinessInput, MarketRecommendation } from "../lib/analyzer";
import { forecastFx, calculateShipping, generateVideoBriefs } from "../lib/analyzer";
import { VideoStudio } from "./VideoStudio";
import { VoiceAgent } from "./VoiceAgent";

type Props = {
  input: BusinessInput;
  markets: MarketRecommendation[];
};

export function AnalysisResult({ input, markets }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = markets[selectedIdx];
  const fx = useMemo(() => forecastFx("EUR/TRY", input.leadTimeDays || 7), [input.leadTimeDays]);
  const shipping = useMemo(() => calculateShipping(1, selected), [selected]);
  const videos = useMemo(() => generateVideoBriefs(input, markets), [input, markets]);

  const sellPriceEUR = +(((input.unitCostTRY || 100) / fx.predicted) * (1 + selected.avgMargin / 100)).toFixed(2);
  const profitEUR = +(sellPriceEUR - (input.unitCostTRY || 100) / fx.predicted - shipping.cost).toFixed(2);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-sm text-emerald-600 mb-1">Analiz tamamlandı</p>
        <h2 className="text-3xl tracking-tight" style={{ fontWeight: 600 }}>
          {input.productName || "Ürünün"} için {markets.length} pazar fırsatı bulduk
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {markets.slice(0, 3).map((m, i) => (
          <button
            key={m.country}
            onClick={() => setSelectedIdx(i)}
            className={`text-left p-5 rounded-2xl border transition ${
              selectedIdx === i
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{m.flag}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${selectedIdx === i ? "bg-white/10" : "bg-emerald-50 text-emerald-700"}`}>
                Skor {m.fitScore}
              </span>
            </div>
            <p style={{ fontWeight: 600 }}>{m.country}</p>
            <p className={`text-xs mt-1 ${selectedIdx === i ? "text-slate-300" : "text-slate-500"}`}>
              {m.marketplaces.join(" · ")}
            </p>
            <div className={`mt-3 flex items-center gap-1 text-xs ${selectedIdx === i ? "text-emerald-300" : "text-slate-600"}`}>
              Detayları gör <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <MetricCard
          icon={DollarSign}
          color="emerald"
          label="Önerilen satış fiyatı"
          value={`€${sellPriceEUR}`}
          sub={`Marj %${selected.avgMargin} · Net kâr €${profitEUR}`}
        />
        <MetricCard
          icon={Truck}
          color="sky"
          label="Lojistik"
          value={`${shipping.mode} · ${shipping.days} gün`}
          sub={`€${shipping.cost}/kg · ${selected.taxNote}`}
        />
        <MetricCard
          icon={Leaf}
          color="green"
          label="Karbon ayak izi"
          value={`${shipping.co2} kg CO₂/kg`}
          sub={shipping.mode === "Deniz" || shipping.mode === "Demiryolu" ? "Yeşil seçenek ✓" : "Daha düşük emisyonlu rota mevcut"}
        />

        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">{fx.pair} · {input.leadTimeDays} günlük tedarik için</p>
              <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>{fx.predicted} ₺</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              fx.marginProtection > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}>
              <TrendingUp className="w-3 h-3" /> %{fx.marginProtection > 0 ? "+" : ""}{fx.marginProtection}
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fx.series}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Tedarik süreni baz alarak fiyat etiketini buna göre ayarladık. Kur sapması durumunda otomatik fiyat güncellemesi önerisi gönderilecek.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4" />
            <p className="text-xs">Taşıma karşılaştırması</p>
          </div>
          <p className="text-2xl tracking-tight mb-3" style={{ fontWeight: 600 }}>
            {shipping.mode === "Deniz" ? "Deniz seçildi" : `${shipping.mode} → Deniz öneriliyor`}
          </p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { d: "Hava", v: 0.82 }, { d: "Kara", v: 0.18 }, { d: "Demir", v: 0.04 }, { d: "Deniz", v: 0.02 },
              ]}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#fff" }} />
                <Bar dataKey="v" fill="rgba(255,255,255,0.85)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-violet-600" />
            <p style={{ fontWeight: 600 }}>Remotion video stüdyosu</p>
          </div>
          <VideoStudio briefs={videos} />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PhoneCall className="w-4 h-4 text-sky-600" />
            <p style={{ fontWeight: 600 }}>ElevenLabs sesli ajan</p>
          </div>
          <VoiceAgent productName={input.productName || "ürününüz"} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, color, label, value, sub }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

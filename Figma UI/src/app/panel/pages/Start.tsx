import { useState } from "react";
import { Sparkles, Globe, Instagram, Lightbulb, Package, Loader2, Check, Film, PhoneCall, TrendingUp, Truck, Leaf, ArrowRight } from "lucide-react";
import { analyzeBusiness, generateVideoBriefs, type BusinessInput, type MarketRecommendation, type VideoBrief } from "../../lib/analyzer";

type Step = { id: string; label: string; icon: any; status: "pending" | "running" | "done" };

const STEP_DEFS: Omit<Step, "status">[] = [
  { id: "scan", label: "Web sitesi & Instagram tarandı", icon: Globe },
  { id: "match", label: "Pazaryerleri eşleştirildi", icon: Sparkles },
  { id: "video", label: "Remotion videoları üretildi", icon: Film },
  { id: "voice", label: "ElevenLabs ses ajanı kuruldu", icon: PhoneCall },
  { id: "fx", label: "Döviz & fiyat etiketleri hazırlandı", icon: TrendingUp },
  { id: "logi", label: "Lojistik & karbon rotası seçildi", icon: Truck },
];

export function StartPage({ onGoTo }: { onGoTo: (p: string) => void }) {
  const [form, setForm] = useState<BusinessInput>({
    website: "", instagram: "", idea: "", category: "Kozmetik",
    productName: "", unitCostTRY: 120, leadTimeDays: 7,
  });
  const [steps, setSteps] = useState<Step[]>(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));
  const [result, setResult] = useState<{ markets: MarketRecommendation[]; videos: VideoBrief[] } | null>(null);
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResult(null);
    setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));

    for (let i = 0; i < STEP_DEFS.length; i++) {
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: "running" } : s));
      await new Promise((r) => setTimeout(r, 900));
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: "done" } : s));
    }

    const markets = analyzeBusiness(form);
    const videos = generateVideoBriefs(form, markets).map((v) => ({ ...v, status: "ready" as const, progress: 100 }));
    setResult({ markets, videos });
    setRunning(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Başla</h1>
        <p className="text-sm text-slate-500 mt-1">İşletmeni tanıt, gerisini biz halledelim.</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field icon={Globe} label="Web sitesi">
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://markaniz.com" className="w-full bg-transparent outline-none text-sm" />
          </Field>
          <Field icon={Instagram} label="Instagram">
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@markaniz" className="w-full bg-transparent outline-none text-sm" />
          </Field>
        </div>

        <Field icon={Lightbulb} label="Fikir / kısa açıklama">
          <textarea rows={2} value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })}
            placeholder="Ne satıyorsun, kime hitap ediyor?"
            className="w-full bg-transparent outline-none text-sm resize-none" />
        </Field>

        <div className="grid md:grid-cols-3 gap-4">
          <Field icon={Package} label="Ürün adı">
            <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="Gül suyu" className="w-full bg-transparent outline-none text-sm" />
          </Field>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Birim maliyet (₺)</label>
            <input type="number" value={form.unitCostTRY} onChange={(e) => setForm({ ...form, unitCostTRY: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Tedarik süresi (gün)</label>
            <input type="number" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm" />
          </div>
        </div>

        <button
          onClick={runAll}
          disabled={running}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-60"
          style={{ fontWeight: 500 }}
        >
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {running ? "Çalışıyor..." : "Bizim için her şeyi yap"}
        </button>
      </div>

      {(running || result) && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <p className="text-sm mb-4" style={{ fontWeight: 600 }}>İlerleme</p>
          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  s.status === "done" ? "bg-emerald-500 text-white" :
                  s.status === "running" ? "bg-sky-500 text-white" :
                  "bg-slate-200 text-slate-500"
                }`}>
                  {s.status === "done" ? <Check className="w-4 h-4" /> :
                   s.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   <s.icon className="w-4 h-4" />}
                </div>
                <p className={`text-sm ${s.status === "pending" ? "text-slate-400" : "text-slate-800"}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-emerald-600">✓ Tamamlandı — sonuçların hazır</p>

          <div className="grid md:grid-cols-3 gap-4">
            <ResultCard
              icon={Globe} color="emerald" title={`${result.markets.length} pazar bulundu`}
              detail={result.markets.slice(0, 3).map((m) => `${m.flag} ${m.country}`).join(" · ")}
              cta="Pazarları gör" onClick={() => onGoTo("markets")}
            />
            <ResultCard
              icon={Film} color="violet" title={`${result.videos.length} video üretildi`}
              detail={result.videos.map((v) => v.language).join(" · ")}
              cta="Videoları izle" onClick={() => onGoTo("videos")}
            />
            <ResultCard
              icon={PhoneCall} color="sky" title="Ses ajanı hazır"
              detail="ElevenLabs · 5 dil"
              cta="Çağrıları aç" onClick={() => onGoTo("voice")}
            />
            <ResultCard
              icon={TrendingUp} color="amber" title="Fiyat etiketleri"
              detail={`${result.markets[0]?.country} için marj %${result.markets[0]?.avgMargin}`}
              cta="Döviz panelini aç" onClick={() => onGoTo("fx")}
            />
            <ResultCard
              icon={Truck} color="rose" title="Lojistik rotası"
              detail={`${result.markets[0]?.shippingMode} · ${result.markets[0]?.shippingDays} gün`}
              cta="Sevkiyatları gör" onClick={() => onGoTo("logistics")}
            />
            <ResultCard
              icon={Leaf} color="green" title="Karbon hesabı"
              detail={`${result.markets[0]?.carbonKgPerKg} kg CO₂/kg`}
              cta="Karbon panelini aç" onClick={() => onGoTo("carbon")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, children }: any) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-400 transition">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        {children}
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, color, title, detail, cta, onClick }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p style={{ fontWeight: 500 }}>{title}</p>
      <p className="text-xs text-slate-500 mt-1 mb-3">{detail}</p>
      <button onClick={onClick} className="text-xs text-slate-900 hover:underline flex items-center gap-1">
        {cta} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

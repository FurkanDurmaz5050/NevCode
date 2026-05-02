import { useState } from "react";
import {
  Sparkles, Globe, Instagram, Lightbulb, Package, Loader2, Check,
  Film, PhoneCall, TrendingUp, Truck, Leaf, ArrowRight, AlertCircle, Weight,
} from "lucide-react";
import type { BusinessInput } from "../../lib/analyzer";
import { streamDeepResearch, upsertBusiness, type MarketRow, type ResearchEvent } from "../../lib/research";

type PhaseKey = ResearchEvent["phase"];

const PHASE_DEFS: { id: PhaseKey; label: string; icon: any }[] = [
  { id: "init", label: "İşletme kaydı oluşturuldu", icon: Globe },
  { id: "scrape", label: "Web sitesi & Instagram tarandı", icon: Globe },
  { id: "research", label: "Pazar / rakip araştırması", icon: Sparkles },
  { id: "synthesize", label: "AI pazar listesi sentezliyor", icon: Sparkles },
  { id: "score", label: "Sonuçlar kaydedildi", icon: Check },
  { id: "done", label: "Tamamlandı", icon: Check },
];

type PhaseStatus = "pending" | "running" | "done";

export function StartPage({ onGoTo, onAnalyzed }: { onGoTo: (p: string) => void; onAnalyzed?: () => void | Promise<void> }) {
  const [form, setForm] = useState<BusinessInput>({
    website: "", instagram: "", idea: "", category: "Kozmetik",
    productName: "", unitCostTRY: 120, leadTimeDays: 7, weightKg: 1,
  });
  const [phaseStatus, setPhaseStatus] = useState<Record<PhaseKey, PhaseStatus>>({
    init: "pending", scrape: "pending", research: "pending",
    synthesize: "pending", score: "pending", done: "pending", error: "pending",
  });
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ markets: MarketRow[]; analysisId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestMessage, setLatestMessage] = useState<string>("");

  const runAll = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    setProgress(0);
    setPhaseStatus({
      init: "pending", scrape: "pending", research: "pending",
      synthesize: "pending", score: "pending", done: "pending", error: "pending",
    });

    try {
      const biz = await upsertBusiness(form);
      await streamDeepResearch(biz.id, (evt) => {
        setLatestMessage(evt.message);
        setProgress(evt.progress);
        if (evt.phase === "error") {
          setError(evt.message);
          return;
        }
        // mark this phase running, all earlier ones done
        setPhaseStatus((prev) => {
          const order: PhaseKey[] = ["init", "scrape", "research", "synthesize", "score", "done"];
          const idx = order.indexOf(evt.phase);
          const next = { ...prev };
          order.forEach((p, i) => {
            if (i < idx) next[p] = "done";
            else if (i === idx) next[p] = evt.phase === "done" ? "done" : "running";
          });
          return next;
        });
        if (evt.phase === "done" && evt.markets && evt.analysis_id) {
          setResult({ markets: evt.markets, analysisId: evt.analysis_id });
          void onAnalyzed?.();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
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

        <div className="grid md:grid-cols-4 gap-4">
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
          <Field icon={Weight} label="Ürün ağırlığı (kg)">
            <input type="number" step="0.1" value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: +e.target.value })}
              className="w-full bg-transparent outline-none text-sm" />
          </Field>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Kategori</label>
          <div className="flex flex-wrap gap-1.5">
            {["Kozmetik", "Tekstil", "Gıda", "El yapımı", "Elektronik", "Ev & Yaşam"].map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  form.category === c
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={runAll} disabled={running}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-60"
          style={{ fontWeight: 500 }}>
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {running ? "Derin araştırma sürüyor..." : "Bizim için her şeyi yap"}
        </button>
      </div>

      {(running || result || error) && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 600 }}>İlerleme</p>
            <p className="text-xs text-slate-500 tabular-nums">{progress}%</p>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
              style={{ width: `${progress}%` }} />
          </div>
          {latestMessage && <p className="text-xs text-slate-500 mb-3">→ {latestMessage}</p>}

          <div className="space-y-2">
            {PHASE_DEFS.map((p) => {
              const s = phaseStatus[p.id];
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    s === "done" ? "bg-emerald-500 text-white" :
                    s === "running" ? "bg-sky-500 text-white" :
                    "bg-slate-200 text-slate-500"
                  }`}>
                    {s === "done" ? <Check className="w-4 h-4" /> :
                     s === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     <p.icon className="w-4 h-4" />}
                  </div>
                  <p className={`text-sm ${s === "pending" ? "text-slate-400" : "text-slate-800"}`}>
                    {p.label}
                  </p>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-emerald-600">✓ Tamamlandı — {result.markets.length} pazar önerisi hazır</p>

          <div className="grid md:grid-cols-3 gap-4">
            <ResultCard
              icon={Globe} color="emerald" title={`${result.markets.length} pazar bulundu`}
              detail={result.markets.slice(0, 3).map((m) => `${m.flag ?? "🌍"} ${m.country}`).join(" · ")}
              cta="Pazarları gör" onClick={() => onGoTo("markets")}
            />
            <ResultCard
              icon={Film} color="violet" title="Video üretimi"
              detail="Faz 2: Remotion render pipeline kurulacak"
              cta="Video studio" onClick={() => onGoTo("videos")}
            />
            <ResultCard
              icon={PhoneCall} color="sky" title="Ses ajanı"
              detail="Faz 3: ElevenLabs + Twilio entegrasyonu"
              cta="Çağrıları aç" onClick={() => onGoTo("voice")}
            />
            <ResultCard
              icon={TrendingUp} color="amber" title="Marj & döviz"
              detail={result.markets[0] ? `${result.markets[0].country} %${result.markets[0].avg_margin}` : "—"}
              cta="Döviz panelini aç" onClick={() => onGoTo("fx")}
            />
            <ResultCard
              icon={Truck} color="rose" title="Lojistik rotası"
              detail={result.markets[0]
                ? `${result.markets[0].shipping_mode} · ${result.markets[0].shipping_days} gün`
                : "—"}
              cta="Sevkiyatları gör" onClick={() => onGoTo("logistics")}
            />
            <ResultCard
              icon={Leaf} color="green" title="Karbon"
              detail={result.markets[0]
                ? `${result.markets[0].carbon_kg_per_kg} kg CO₂/kg`
                : "—"}
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

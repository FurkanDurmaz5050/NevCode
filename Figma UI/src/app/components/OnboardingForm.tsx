import { useState } from "react";
import { Loader2, Sparkles, Globe, Instagram, Lightbulb, Package } from "lucide-react";
import type { BusinessInput } from "../lib/analyzer";

type Props = {
  onSubmit: (input: BusinessInput) => void;
  loading: boolean;
};

const categories = ["Kozmetik", "Tekstil", "Gıda", "El yapımı", "Elektronik", "Ev & Yaşam"];

export function OnboardingForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<BusinessInput>({
    website: "",
    instagram: "",
    idea: "",
    category: "Kozmetik",
    productName: "",
    unitCostTRY: 120,
    leadTimeDays: 7,
  });

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <p className="text-sm text-emerald-600 mb-2">Hadi başlayalım</p>
        <h2 className="text-3xl tracking-tight" style={{ fontWeight: 600 }}>İşletmeni tanıt</h2>
        <p className="text-slate-600 mt-2 text-sm">Verdiğin her bilgi analizimizi keskinleştirir.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
        className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-lg shadow-slate-200/40 space-y-5"
      >
        <Field icon={Globe} label="Web sitesi">
          <input
            type="url"
            placeholder="https://markaniz.com"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        <Field icon={Instagram} label="Instagram kullanıcı adı">
          <input
            placeholder="@markaniz"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        <Field icon={Lightbulb} label="Fikir / kısa açıklama">
          <textarea
            rows={3}
            placeholder="Ne satıyorsun, kime hitap ediyorsun, neyi farklı yapıyorsun?"
            value={form.idea}
            onChange={(e) => setForm({ ...form, idea: e.target.value })}
            className="w-full bg-transparent outline-none text-sm resize-none"
          />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field icon={Package} label="Ürün adı">
            <input
              placeholder="Örn: Organik gül suyu"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full bg-transparent outline-none text-sm"
            />
          </Field>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    form.category === c
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Birim maliyet (₺)</label>
            <input
              type="number"
              value={form.unitCostTRY}
              onChange={(e) => setForm({ ...form, unitCostTRY: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Tedarik süresi (gün)</label>
            <input
              type="number"
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm focus:border-emerald-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Analiz ediliyor..." : "AI analizi başlat"}
        </button>
      </form>
    </section>
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

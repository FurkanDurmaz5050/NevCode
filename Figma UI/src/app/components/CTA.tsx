import { ArrowRight } from "lucide-react";

export function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 p-12 md:p-16 text-center text-white">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl md:text-5xl tracking-tight max-w-2xl mx-auto" style={{ fontWeight: 600 }}>
            Kuluçkadan çıktın. Sıradaki durak: dünya.
          </h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            Web siteni ekle, 5 dakika içinde ilk pazaryeri raporunu ve örnek pazarlama videonu al.
          </p>
          <button onClick={onStart} className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition">
            Ücretsiz analiz başlat
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-4 text-xs text-slate-400">Kredi kartı gerekmez · 7 gün ücretsiz deneme</p>
        </div>
      </div>
    </section>
  );
}

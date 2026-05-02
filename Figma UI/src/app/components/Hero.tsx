import { ArrowRight, Sparkles, Play } from "lucide-react";
import { motion } from "motion/react";

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          KOBİ'ler için AI destekli yurtdışı büyüme platformu
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl tracking-tight max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 bg-clip-text text-transparent"
          style={{ fontWeight: 600, lineHeight: 1.05 }}
        >
          İşletmenizi dünyaya taşıyan akıllı ortak
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto"
        >
          Web siteniz, Instagram'ınız ya da fikrinizden yola çıkarak; doğru pazaryerlerini buluruz,
          Remotion ile pazarlama videolarınızı üretir, ElevenLabs ile sesli destek hattı kurar,
          döviz ve karbon dostu lojistik rotasını hesaplarız.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <button onClick={onStart} className="group px-6 py-3 rounded-xl bg-slate-900 text-white flex items-center gap-2 hover:bg-slate-800 transition">
            Hemen başla
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </button>
          <button className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center gap-2 hover:border-slate-300 transition">
            <Play className="w-4 h-4" />
            Demo izle (90 sn)
          </button>
        </motion.div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-500">
          <span>✓ 47 ülke pazaryeri kapsamı</span>
          <span>✓ Remotion video üretimi</span>
          <span>✓ ElevenLabs sesli teknik servis</span>
          <span>✓ Karbon & döviz analizi</span>
        </div>
      </div>
    </section>
  );
}

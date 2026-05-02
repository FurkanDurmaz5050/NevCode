import { Search, Film, PhoneCall, TrendingUp, Leaf, Truck } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Pazar Keşfi",
    desc: "Web siteniz, Instagram veya fikrinizi tarayıp ürün-pazar uyumuna göre yurtdışı pazaryerlerini sıralarız.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Film,
    title: "Remotion Videoları",
    desc: "Her pazaryeri için yerelleştirilmiş, A/B test edilebilir pazarlama videoları otomatik üretilir.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: PhoneCall,
    title: "ElevenLabs Sesli Destek",
    desc: "Telefon numaranıza bağlanan AI ses ajanı ile teknik servis ve müşteri sorularını 7/24 yönetir.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Döviz Tahmini",
    desc: "Tedarik süreniz 1 hafta ise 1 haftalık kur projeksiyonu çıkarır, fiyat marjınızı korur.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Leaf,
    title: "Karbon Hesabı",
    desc: "Hangi taşıma modu, hangi rotada ne kadar CO₂ üretiyor — yeşil seçenekleri öne çıkarırız.",
    accent: "from-green-500 to-lime-500",
  },
  {
    icon: Truck,
    title: "Lojistik & Kargo",
    desc: "Kargo maliyeti, gümrük ve teslim süresini birleştirip net kâra göre rota öneririz.",
    accent: "from-rose-500 to-pink-500",
  },
];

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <p className="text-sm text-emerald-600 mb-2">Tek platform, altı süper güç</p>
        <h2 className="text-4xl tracking-tight" style={{ fontWeight: 600 }}>
          Kuluçkadan globale uzanan tam yığın
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="mb-2" style={{ fontWeight: 600 }}>{f.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

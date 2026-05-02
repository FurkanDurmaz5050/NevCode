import { Link2, Compass, Rocket, BarChart3 } from "lucide-react";

const steps = [
  { icon: Link2, title: "Bağla", desc: "Web siteni, Instagram'ını ya da fikrini paylaş. Saniyeler içinde marka ve ürün haritan çıkarılır." },
  { icon: Compass, title: "Keşfet", desc: "47+ ülkedeki pazaryerlerinden sana özel rota önerilir; talep, rekabet ve marj analizi yapılır." },
  { icon: Rocket, title: "Lansman", desc: "Remotion ile videolar, ElevenLabs ile destek hattı, lojistik & ödeme entegrasyonları kurulur." },
  { icon: BarChart3, title: "Optimize", desc: "Döviz, karbon, kargo ve dönüşüm metriklerini canlı izle, AI öneri motoruyla iyileştir." },
];

export function Workflow() {
  return (
    <section id="workflow" className="bg-slate-950 text-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm text-emerald-400 mb-2">Nasıl çalışır</p>
          <h2 className="text-4xl tracking-tight" style={{ fontWeight: 600 }}>
            4 adımda küresel pazara hazır
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-5 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-slate-900" />
                  </div>
                  <span className="text-xs text-slate-500">0{i + 1}</span>
                </div>
                <h3 className="mb-2" style={{ fontWeight: 600 }}>{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

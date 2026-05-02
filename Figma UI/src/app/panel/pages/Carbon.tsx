import { Leaf, TrendingDown, Award } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

const monthly = [
  { d: "Oca", v: 4.8 }, { d: "Şub", v: 4.2 }, { d: "Mar", v: 3.9 },
  { d: "Nis", v: 3.4 }, { d: "May", v: 3.2 }, { d: "Haz", v: 2.8 },
];
const modes = [
  { d: "Hava", v: 0.82, color: "#ef4444" },
  { d: "Kara", v: 0.18, color: "#f59e0b" },
  { d: "Demiryolu", v: 0.04, color: "#10b981" },
  { d: "Deniz", v: 0.02, color: "#059669" },
];
const goal = [{ name: "İlerleme", value: 64, fill: "#10b981" }];

export function CarbonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Karbon</h1>
        <p className="text-sm text-slate-500 mt-1">Sevkiyat bazlı CO₂ takibi · netleşme yol haritası</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4" /><p className="text-xs opacity-90">Bu yıl toplam emisyon</p>
          </div>
          <p className="text-4xl tracking-tight mb-1" style={{ fontWeight: 600 }}>22.3 ton CO₂e</p>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <TrendingDown className="w-4 h-4" /> Geçen yıla göre %18 azaldı
          </div>
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.8)" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff" }} />
                <Bar dataKey="v" fill="rgba(255,255,255,0.85)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-slate-500">Net sıfır hedefi 2030</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={goal} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} background />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-2xl -mt-32 mb-12 tracking-tight" style={{ fontWeight: 600 }}>%64</p>
          <p className="text-xs text-slate-500 text-center">Hedef yolu üzerinde</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p style={{ fontWeight: 600 }}>Taşıma modu karşılaştırması</p>
          <p className="text-xs text-slate-500 mb-3">kg CO₂ / ton·km</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modes} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="v" radius={[0, 6, 6, 0]}>
                  {modes.map((m, i) => <rect key={i} fill={m.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p style={{ fontWeight: 600 }}>Optimizasyon önerileri</p>
          <div className="space-y-3 mt-4">
            <Tip color="emerald" title="Hava → Deniz geçişi" detail="Almanya rotalarının %60'ını denize taşıyarak yıllık 4.2 ton CO₂ tasarruf." />
            <Tip color="sky" title="Konsolide sevkiyat" detail="Hollanda gönderilerini haftalık birleştirmek %22 emisyon azaltır." />
            <Tip color="violet" title="Karbon dengeleme" detail="Kalan emisyon için doğrulanmış ormanlaştırma kredisi öner." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tip({ color, title, detail }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-50">
      <div className={`w-2 self-stretch rounded-full ${colors[color]}`} />
      <div>
        <p className="text-sm" style={{ fontWeight: 500 }}>{title}</p>
        <p className="text-xs text-slate-600 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

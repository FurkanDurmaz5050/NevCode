import { type ReactNode } from "react";
import {
  Sparkles, Globe2, Film, PhoneCall, TrendingUp, Truck, Leaf, Bot, Settings,
} from "lucide-react";

export type PanelPage =
  | "start" | "research" | "markets" | "videos" | "voice" | "fx" | "logistics" | "carbon" | "settings";

const NAV: { id: PanelPage; label: string; icon: any }[] = [
  { id: "start", label: "Başla", icon: Sparkles },
  { id: "research", label: "AI Ajan", icon: Bot },
  { id: "markets", label: "Pazaryerleri", icon: Globe2 },
  { id: "videos", label: "Videolar", icon: Film },
  { id: "voice", label: "Sesli destek", icon: PhoneCall },
  { id: "fx", label: "Döviz & fiyat", icon: TrendingUp },
  { id: "logistics", label: "Lojistik", icon: Truck },
  { id: "carbon", label: "Karbon", icon: Leaf },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export function PanelLayout({
  active, onNavigate, children,
}: { active: PanelPage; onNavigate: (p: PanelPage) => void; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="px-4 py-5 flex items-center gap-2 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm" style={{ fontWeight: 600 }}>GlobalNest</p>
        </div>

        <nav className="flex-1 p-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                active === n.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs">
              AY
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ fontWeight: 500 }}>Aylin Y.</p>
              <p className="text-xs text-slate-500 truncate">Pro plan</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}

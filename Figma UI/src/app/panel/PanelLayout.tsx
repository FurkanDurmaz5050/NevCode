import { type ReactNode } from "react";
import {
  Sparkles, Globe2, Film, PhoneCall, TrendingUp, Truck, Leaf, Bot, Settings, Lock, Megaphone, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../lib/auth";

export type PanelPage =
  | "start" | "overview" | "research" | "markets" | "posts" | "videos" | "voice" | "fx" | "logistics" | "carbon" | "settings";

const NAV: { id: PanelPage; label: string; icon: any; alwaysOn?: boolean }[] = [
  { id: "start", label: "Başla", icon: Sparkles, alwaysOn: true },
  { id: "overview", label: "Genel Bakış", icon: LayoutDashboard, alwaysOn: true },
  { id: "research", label: "AI Ajan", icon: Bot },
  { id: "markets", label: "Pazaryerleri", icon: Globe2 },
  { id: "posts", label: "Sosyal postlar", icon: Megaphone },
  { id: "videos", label: "Videolar", icon: Film },
  { id: "voice", label: "Sesli destek", icon: PhoneCall },
  { id: "fx", label: "Döviz & fiyat", icon: TrendingUp },
  { id: "logistics", label: "Lojistik", icon: Truck },
  { id: "carbon", label: "Karbon", icon: Leaf },
  { id: "settings", label: "Ayarlar", icon: Settings, alwaysOn: true },
];

export function PanelLayout({
  active, onNavigate, children, unlocked,
}: {
  active: PanelPage;
  onNavigate: (p: PanelPage) => void;
  children: ReactNode;
  unlocked: boolean;
}) {
  const { user } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const displayName: string =
    meta.full_name ||
    meta.name ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Kullanıcı";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "K";

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
          {NAV.map((n) => {
            const locked = !unlocked && !n.alwaysOn;
            return (
              <button
                key={n.id}
                onClick={() => !locked && onNavigate(n.id)}
                disabled={locked}
                title={locked ? "Önce 'Başla' adımını tamamla" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                  active === n.id
                    ? "bg-slate-900 text-white"
                    : locked
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <n.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{n.label}</span>
                {locked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ fontWeight: 500 }}>{displayName}</p>
              <p className="text-xs text-slate-500 truncate">Pro plan</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}

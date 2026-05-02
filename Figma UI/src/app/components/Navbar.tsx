import { Globe2 } from "lucide-react";

export function Navbar({ onOpenPanel }: { onOpenPanel: () => void }) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">GlobalNest</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
          <a href="#features" className="hover:text-slate-900">Özellikler</a>
          <a href="#workflow" className="hover:text-slate-900">Nasıl Çalışır</a>
          <a href="#dashboard" className="hover:text-slate-900">Panel</a>
          <a href="#pricing" className="hover:text-slate-900">Fiyatlandırma</a>
        </div>
        <button onClick={onOpenPanel} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition">
          Paneli aç
        </button>
      </div>
    </nav>
  );
}

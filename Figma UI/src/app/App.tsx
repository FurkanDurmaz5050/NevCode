import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Workflow } from "./components/Workflow";
import { CTA } from "./components/CTA";
import { Panel } from "./panel/Panel";

export default function App() {
  const [view, setView] = useState<"landing" | "panel">("landing");

  if (view === "panel") return <Panel onExit={() => setView("landing")} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navbar onOpenPanel={() => setView("panel")} />
      <Hero onStart={() => setView("panel")} />
      <Features />
      <Workflow />
      <CTA onStart={() => setView("panel")} />
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © 2026 GlobalNest · KOBİ'ler için akıllı küresel büyüme
      </footer>
    </div>
  );
}

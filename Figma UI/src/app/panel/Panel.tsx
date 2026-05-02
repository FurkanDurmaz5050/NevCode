import { useState } from "react";
import { PanelLayout, type PanelPage } from "./PanelLayout";
import { StartPage } from "./pages/Start";
import { ResearchAgentPage } from "./pages/ResearchAgent";
import { MarketsPage } from "./pages/Markets";
import { VideosPage } from "./pages/Videos";
import { VoicePage } from "./pages/Voice";
import { FxPage } from "./pages/Fx";
import { LogisticsPage } from "./pages/Logistics";
import { CarbonPage } from "./pages/Carbon";
import { SettingsPage } from "./pages/Settings";

export function Panel({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<PanelPage>("start");

  return (
    <div className="relative">
      <button
        onClick={onExit}
        className="fixed top-3 right-3 z-50 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
      >
        ← Çıkış
      </button>
      <PanelLayout active={page} onNavigate={setPage}>
        {page === "start" && <StartPage onGoTo={(p) => setPage(p as PanelPage)} />}
        {page === "research" && <ResearchAgentPage />}
        {page === "markets" && <MarketsPage />}
        {page === "videos" && <VideosPage />}
        {page === "voice" && <VoicePage />}
        {page === "fx" && <FxPage />}
        {page === "logistics" && <LogisticsPage />}
        {page === "carbon" && <CarbonPage />}
        {page === "settings" && <SettingsPage />}
      </PanelLayout>
    </div>
  );
}

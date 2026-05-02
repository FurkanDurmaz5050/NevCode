import { useEffect, useState } from "react";
import { PanelLayout, type PanelPage } from "./PanelLayout";
import { StartPage } from "./pages/Start";
import { ResearchAgentPage } from "./pages/ResearchAgent";
import { MarketsPage } from "./pages/Markets";
import { PostsPage } from "./pages/Posts";
import { VideosPage } from "./pages/Videos";
import { VoicePage } from "./pages/Voice";
import { FxPage } from "./pages/Fx";
import { LogisticsPage } from "./pages/Logistics";
import { CarbonPage } from "./pages/Carbon";
import { SettingsPage } from "./pages/Settings";
import { OverviewPage } from "./pages/Overview";
import { useBusinessState } from "../lib/business";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useAuth } from "../lib/auth";

export function Panel({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<PanelPage>("start");
  const state = useBusinessState();
  const { signOut } = useAuth();

  useEffect(() => {
    if (!state.loading && !state.hasAnalysis && page !== "start" && page !== "settings" && page !== "overview") {
      setPage("start");
    }
  }, [state.loading, state.hasAnalysis, page]);

  return (
    <div className="relative">
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <button
          onClick={() => void signOut()}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          Çıkış yap
        </button>
        <button
          onClick={onExit}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          ← Anasayfa
        </button>
      </div>
      <PanelLayout active={page} onNavigate={setPage} unlocked={state.hasAnalysis}>
        <ErrorBoundary label={page}>
          {page === "overview" && <OverviewPage />}
          {page === "start" && (
            <StartPage onGoTo={(p) => setPage(p as PanelPage)} onAnalyzed={state.refresh} />
          )}
          {page === "research" && <ResearchAgentPage />}
          {page === "markets" && <MarketsPage />}
          {page === "posts" && <PostsPage />}
          {page === "videos" && <VideosPage />}
          {page === "voice" && <VoicePage />}
          {page === "fx" && <FxPage />}
          {page === "logistics" && <LogisticsPage />}
          {page === "carbon" && <CarbonPage />}
          {page === "settings" && <SettingsPage />}
        </ErrorBoundary>
      </PanelLayout>
    </div>
  );
}

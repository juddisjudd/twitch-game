import GameView from "./components/game-view";
import CommandDashboard from "./components/command-dashboard";
import NarrativeLog from "./components/narrative-log";
import StatusBar from "./components/status-bar";
import TwitchChat from "./components/twitch-chat";
import { GameContextProvider } from "./context/GameContext";

export default function Page() {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  return (
    <GameContextProvider useMockData={useMockData}>
      <main className="h-screen bg-black text-white font-mono relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-950 opacity-50" />

        {/* Main game container */}
        <div className="relative z-10 container mx-auto p-4 h-full flex flex-col">
          {/* Top status bar */}
          <div className="h-16 mb-4">
            <StatusBar />
          </div>

          {/* Main content area */}
          <div className="flex gap-4 h-[calc(100%-theme(spacing.16)-theme(spacing.48)-theme(spacing.8))]">
            {/* Main game view */}
            <div className="flex-1">
              <GameView />
            </div>

            {/* Twitch Chat */}
            <div className="w-80 shrink-0">
              <TwitchChat />
            </div>

            {/* Command dashboard */}
            <div className="w-80 shrink-0">
              <CommandDashboard />
            </div>
          </div>

          {/* Bottom narrative log */}
          <div className="h-48 mt-4">
            <NarrativeLog />
          </div>
        </div>
      </main>
    </GameContextProvider>
  );
}

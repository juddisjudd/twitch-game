"use client";

import { Shield, Users, Brain } from "lucide-react";
import { useGameContext } from "../context/GameContext";

export default function StatusBar() {
  const { metrics } = useGameContext();

  return (
    <div className="h-16 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between h-full">
        {/* Society Stability */}
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Society Stability</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${metrics.societyStability}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mystery Progress */}
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-500" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Mystery Progress</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${metrics.mysteryProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chat Influence */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Chat Influence</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${metrics.chatInfluence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

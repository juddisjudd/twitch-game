"use client";

import { useEffect, useState } from "react";
import { Terminal, Search, PenToolIcon as Tool, Shield } from "lucide-react";
import { useGameContext } from "../context/GameContext";

const commandIcons = {
  explore: Search,
  hack: Terminal,
  investigate: Tool,
  defend: Shield,
};

const commandColors = {
  explore: "cyan",
  hack: "green",
  investigate: "yellow",
  defend: "red",
};

export default function CommandDashboard() {
  const { commands, votingEndsAt } = useGameContext();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const maxVotes =
    commands.length > 0
      ? Math.max(...commands.map((cmd) => cmd.votes)) || 1
      : 1;

  useEffect(() => {
    if (!votingEndsAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, votingEndsAt - Date.now());
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [votingEndsAt]);

  const formatTimeRemaining = () => {
    const seconds = Math.ceil(timeRemaining / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="h-full bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Command Center</h2>
      </div>
      <div className="space-y-3">
        {commands.map((command) => {
          const Icon = commandIcons[command.id as keyof typeof commandIcons];
          const color = commandColors[command.id as keyof typeof commandColors];
          const percentWidth =
            maxVotes > 0 ? (command.votes / maxVotes) * 100 : 0;

          return (
            <div
              key={command.id}
              className="w-full p-3 rounded-lg border transition-all bg-slate-900/50 border-slate-800 hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 text-${color}-500`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{command.id}</span>
                    <span className="text-sm text-slate-400">
                      {command.votes} votes
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-slate-800 rounded-full">
                    <div
                      className={`h-full bg-${color}-500 rounded-full`}
                      style={{ width: `${percentWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-slate-400 mt-4">
        <span>Voting ends in: </span>
        <span className="font-mono">{formatTimeRemaining()}</span>
      </div>
    </div>
  );
}

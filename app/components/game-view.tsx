"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useGameContext } from "../context/GameContext";

export default function GameView() {
  const { zones, activeZone, setActiveZone, commands } = useGameContext();

  const getWinningCommand = () => {
    if (commands.length === 0) return null;

    const sortedCommands = [...commands].sort((a, b) => b.votes - a.votes);
    return sortedCommands[0];
  };

  const winningCommand = getWinningCommand();

  return (
    <div className="h-full bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg relative overflow-hidden">
      {/* Map grid background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent"
        style={{
          backgroundSize: "30px 30px",
          backgroundImage: `
            linear-gradient(to right, rgb(30 41 59 / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(30 41 59 / 0.1) 1px, transparent 1px)
          `,
        }}
      />

      {/* Map content */}
      <div className="relative h-full p-8">
        {/* Zone connections */}
        <svg className="absolute inset-0 w-full h-full p-8 pointer-events-none">
          {zones.map((zone) =>
            zone.connections.map((connectionId) => {
              const connectedZone = zones.find((z) => z.id === connectionId);
              if (!connectedZone) return null;

              return (
                <line
                  key={`${zone.id}-${connectionId}`}
                  x1={`${zone.position.x}%`}
                  y1={`${zone.position.y}%`}
                  x2={`${connectedZone.position.x}%`}
                  y2={`${connectedZone.position.y}%`}
                  className={`stroke-slate-600 ${
                    zone.status === "active" &&
                    connectedZone.status === "active"
                      ? "stroke-2 stroke-cyan-500/50"
                      : "stroke-1"
                  }`}
                />
              );
            })
          )}
        </svg>

        {/* Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              zone.status === "locked" ? "opacity-50" : "opacity-100"
            }`}
            style={{ left: `${zone.position.x}%`, top: `${zone.position.y}%` }}
          >
            {/* Zone node */}
            <div
              onClick={() => zone.status === "active" && setActiveZone(zone.id)}
              className={`
                relative w-16 h-16 rounded-lg border-2 transition-all duration-300 cursor-pointer
                ${zone.id === activeZone.id ? "scale-110" : "scale-100"}
                ${
                  zone.status === "active"
                    ? "bg-slate-800/80 border-cyan-500"
                    : zone.status === "completed"
                    ? "bg-slate-800/80 border-green-500"
                    : "bg-slate-900/80 border-slate-700"
                }
              `}
            >
              {/* Pulse animation for active zone */}
              {zone.id === activeZone.id && (
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 animate-ping bg-cyan-500/20 rounded-lg" />
                  <div className="absolute inset-0 animate-pulse bg-cyan-500/10 rounded-lg" />
                </div>
              )}

              {/* Locked indicator */}
              {zone.status === "locked" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-slate-500" />
                </div>
              )}
            </div>

            {/* Zone label */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center">
              <span className="px-2 py-1 rounded-md bg-slate-900/90 text-xs font-medium whitespace-nowrap">
                {zone.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Current action overlay */}
      {winningCommand && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
          <div className="px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-sm">
            Chat is voting to {winningCommand.id} the {activeZone.name}...
          </div>
        </div>
      )}

      {/* Scanlines effect */}
      <div
        className="pointer-events-none absolute inset-0 bg-repeat-y opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "100% 3px",
        }}
      />
    </div>
  );
}

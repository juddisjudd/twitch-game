"use client";

import { useRef, useEffect } from "react";
import { useGameContext } from "../context/GameContext";

export default function NarrativeLog() {
  const { logs } = useGameContext();
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
      <div
        ref={logContainerRef}
        className="h-full overflow-auto scrollbar-none"
      >
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span
                className={
                  log.type === "action"
                    ? "text-cyan-400"
                    : log.type === "system"
                    ? "text-purple-400"
                    : "text-slate-300"
                }
              >
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

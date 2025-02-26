"use client";

import { useRef, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useGameContext } from "../context/GameContext";
import { TwitchChatMessage } from "@/lib/twitch-twurple";

export default function TwitchChat() {
  const {
    messages: contextMessages,
    isConnected,
    connectToChat,
  } = useGameContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<TwitchChatMessage[]>([]);

  useEffect(() => {
    if (contextMessages.length === 0) return;

    const lastMessage = contextMessages[contextMessages.length - 1];

    if (!messages.some((msg) => msg.id === lastMessage.id)) {
      setMessages((prev) => [...prev, lastMessage].slice(-100));
    }
  }, [contextMessages, messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isConnected) {
      connectToChat();
    }
  }, [isConnected, connectToChat]);

  return (
    <div className="h-full w-80 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Chat header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-purple-500" />
        <span className="font-bold">Live Chat</span>
        <span className="text-xs text-slate-400">({messages.length})</span>
        <div className="ml-auto flex items-center">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-xs ml-2 text-slate-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-none"
      >
        <div className="p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded p-2 transition-colors ${
                msg.highlighted ? "bg-slate-800/50" : ""
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                {/* Badges */}
                <div className="flex gap-1">
                  {msg.badges.includes("moderator") && (
                    <span className="px-1 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
                      MOD
                    </span>
                  )}
                  {msg.badges.includes("subscriber") && (
                    <span className="px-1 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      SUB
                    </span>
                  )}
                  {msg.badges.includes("vip") && (
                    <span className="px-1 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      VIP
                    </span>
                  )}
                </div>
                {/* Username */}
                <span className="font-bold text-sm">{msg.username}</span>
                {/* Timestamp */}
                <span className="text-xs text-slate-500">{msg.timestamp}</span>
              </div>
              {/* Message */}
              <p className="text-sm text-slate-300 break-words">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import TwitchChatService, {
  TwitchChatMessage,
  TwitchCommand,
} from "@/lib/twitch-twurple";
import VoteSystem, { CommandTally } from "@/lib/voteSystem";
import GameState, { Zone, LogEntry, GameMetrics } from "@/lib/gameState";

const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || "";
const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
const TWITCH_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TWITCH_ACCESS_TOKEN || "";

const VOTING_PERIOD_MS = 60000;

interface GameContextType {
  isConnected: boolean;
  messages: TwitchChatMessage[];

  commands: CommandTally[];
  votingEndsAt: number | null;

  zones: Zone[];
  activeZone: Zone;
  logs: LogEntry[];
  metrics: GameMetrics;

  setActiveZone: (zoneId: string) => void;
  connectToChat: () => void;
  disconnectFromChat: () => void;
}

const GameContext = createContext<GameContextType>({
  isConnected: false,
  messages: [],
  commands: [],
  votingEndsAt: null,
  zones: [],
  activeZone: {} as Zone,
  logs: [],
  metrics: { societyStability: 0, mysteryProgress: 0, chatInfluence: 0 },
  setActiveZone: () => {},
  connectToChat: () => {},
  disconnectFromChat: () => {},
});

export const useGameContext = () => useContext(GameContext);

interface GameContextProviderProps {
  children: ReactNode;
  useMockData?: boolean;
}

export const GameContextProvider: React.FC<GameContextProviderProps> = ({
  children,
  useMockData = false,
}) => {
  const [twitchService, setTwitchService] = useState<TwitchChatService | null>(
    null
  );
  const [voteSystem, setVoteSystem] = useState<VoteSystem | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<TwitchChatMessage[]>([]);
  const [commands, setCommands] = useState<CommandTally[]>([]);
  const [votingEndsAt, setVotingEndsAt] = useState<number | null>(null);

  const twitchServiceRef = React.useRef<TwitchChatService | null>(null);

  useEffect(() => {
    twitchServiceRef.current = twitchService;
  }, [twitchService]);

  useEffect(() => {
    if (twitchService || voteSystem || gameState) {
      console.log("Game systems already initialized, skipping");
      return;
    }

    console.log("Initializing game systems...");

    const gameStateInstance = new GameState();
    setGameState(gameStateInstance);

    const voteSystemInstance = new VoteSystem(VOTING_PERIOD_MS);
    setVoteSystem(voteSystemInstance);

    if (
      TWITCH_CHANNEL &&
      TWITCH_CLIENT_ID &&
      TWITCH_ACCESS_TOKEN &&
      !useMockData
    ) {
      console.log("Creating Twitch service with Twurple");
      console.log(
        `Channel: ${TWITCH_CHANNEL}, Client ID: ${TWITCH_CLIENT_ID.substring(
          0,
          5
        )}...`
      );

      const twitchServiceInstance = new TwitchChatService(
        TWITCH_CHANNEL,
        TWITCH_CLIENT_ID,
        TWITCH_ACCESS_TOKEN
      );

      setTwitchService(twitchServiceInstance);
    } else {
      console.log("No Twitch credentials found or mock data requested", {
        useMockData,
        hasChannel: !!TWITCH_CHANNEL,
        hasClientId: !!TWITCH_CLIENT_ID,
        hasAccessToken: !!TWITCH_ACCESS_TOKEN,
      });
    }

    if (useMockData) {
      setupMockData();
    }

    return () => {
      const service = twitchServiceRef.current;
      if (service) {
        console.log("Disconnecting Twitch service on cleanup");
        service.disconnect();
      }
    };
  }, [useMockData]);

  useEffect(() => {
    if (!voteSystem || !gameState) return;

    const handleVotingComplete = (results: CommandTally[]) => {
      if (results.length > 0) {
        const winner = results[0];
        gameState.processCommand(winner);
        startNewVoting();
      }
    };

    const startNewVoting = () => {
      voteSystem.startVoting(handleVotingComplete);
      setVotingEndsAt(Date.now() + VOTING_PERIOD_MS);

      const updateInterval = setInterval(() => {
        if (voteSystem.isVotingActive()) {
          setCommands([...voteSystem.getCurrentTallies()]);
        } else {
          clearInterval(updateInterval);
        }
      }, 1000);
    };

    startNewVoting();

    gameState.setStateChangeCallback(() => {
      forceUpdate();
    });
  }, [voteSystem, gameState]);

  const [, setUpdateCounter] = useState(0);
  const forceUpdate = () => setUpdateCounter((prev) => prev + 1);

  useEffect(() => {
    if (!twitchService || !voteSystem || (twitchService as any)._eventsSetup)
      return;

    console.log("Setting up Twitch chat event handlers");

    (twitchService as any)._eventsSetup = true;

    twitchService.on("connected", () => {
      console.log("Twitch chat connected event received");
      setIsConnected(true);
      gameState?.addLog({
        text: "Connected to Twitch chat. The collective consciousness is forming...",
        type: "system",
      });
    });

    twitchService.on("disconnected", () => {
      console.log("Twitch chat disconnected event received");
      setIsConnected(false);
      gameState?.addLog({
        text: "Disconnected from Twitch chat. The collective consciousness is fragmenting...",
        type: "system",
      });
    });

    twitchService.on("message", (message: TwitchChatMessage) => {
      console.log(`Message received: ${message.username}: ${message.message}`);
      setMessages((prev) => {
        const newMessages = [...prev, message];
        return newMessages.slice(-100);
      });
    });

    twitchService.on("command", (command: TwitchCommand) => {
      console.log(
        `Command received: ${command.command} from ${command.username}`
      );
      voteSystem.registerVote(command);
      setCommands([...voteSystem.getCurrentTallies()]);
    });

    return () => {
      console.log("Removing Twitch chat event handlers");
      twitchService.removeAllListeners();
      (twitchService as any)._eventsSetup = false;
    };
  }, [twitchService, voteSystem, gameState]);

  const setupMockData = () => {
    if (!gameState || !voteSystem) return;

    gameState.addLog({
      text: "Running in development mode with mock data. Connect to real Twitch chat to play with viewers.",
      type: "system",
    });

    const usernames = [
      "CyberPioneer",
      "DataRunner",
      "NeonMod",
      "GlitchSeeker",
      "SilentObserver",
      "VoidWalker",
    ];
    const commands = ["!explore", "!hack", "!investigate", "!defend"];
    const badges: Array<"subscriber" | "moderator" | "vip">[] = [
      [],
      ["subscriber"],
      ["moderator"],
      ["vip"],
      ["subscriber", "vip"],
    ];

    setInterval(() => {
      const username = usernames[Math.floor(Math.random() * usernames.length)];
      const message = commands[Math.floor(Math.random() * commands.length)];
      const userBadges = badges[Math.floor(Math.random() * badges.length)];

      const mockMessage: TwitchChatMessage = {
        id: Date.now().toString(),
        username,
        message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        badges: userBadges,
      };

      setMessages((prev) => [...prev.slice(-99), mockMessage]);

      if (message.startsWith("!")) {
        const commandName = message.slice(1).toLowerCase();
        if (
          ["explore", "hack", "investigate", "defend"].includes(commandName)
        ) {
          const mockCommand: TwitchCommand = {
            command: commandName,
            username,
            badges: userBadges,
            timestamp: mockMessage.timestamp,
          };

          voteSystem.registerVote(mockCommand);
          setCommands([...voteSystem.getCurrentTallies()]);
        }
      }
    }, 3000);
  };

  const connectToChat = () => {
    if (twitchService && !isConnected) {
      console.log("Connecting to Twitch chat...");
      twitchService.connect();
    } else {
      console.log("Cannot connect to Twitch chat", {
        hasTwitchService: !!twitchService,
        isAlreadyConnected: isConnected,
      });
    }
  };

  const disconnectFromChat = () => {
    if (twitchService && isConnected) {
      twitchService.disconnect();
    }
  };

  const setActiveZone = (zoneId: string) => {
    if (gameState) {
      gameState.setActiveZone(zoneId);
      forceUpdate();
    }
  };

  const contextValue: GameContextType = {
    isConnected,
    messages,
    commands,
    votingEndsAt,
    zones: gameState?.getZones() || [],
    activeZone: gameState?.getActiveZone() || ({} as Zone),
    logs: gameState?.getLogs() || [],
    metrics: gameState?.getMetrics() || {
      societyStability: 0,
      mysteryProgress: 0,
      chatInfluence: 0,
    },
    setActiveZone,
    connectToChat,
    disconnectFromChat,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

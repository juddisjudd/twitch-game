import { EventEmitter } from "events";
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";

export interface TwitchChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  badges: Array<"subscriber" | "moderator" | "vip">;
  highlighted?: boolean;
}

export interface TwitchCommand {
  command: string;
  username: string;
  badges: Array<"subscriber" | "moderator" | "vip">;
  timestamp: string;
}

export type GameCommand = "explore" | "hack" | "investigate" | "defend";

/**
 * Service that connects to Twitch chat using Twurple and emits events
 */
class TwitchChatService extends EventEmitter {
  private client: ChatClient | null = null;
  private channel: string;
  private clientId: string;
  private accessToken: string;
  private commandPrefix = "!";
  private validCommands: GameCommand[] = [
    "explore",
    "hack",
    "investigate",
    "defend",
  ];

  constructor(channel: string, clientId: string, accessToken: string) {
    super();
    this.channel = channel.toLowerCase();
    this.clientId = clientId;
    this.accessToken = accessToken;
  }

  /**
   * Connect to Twitch chat using Twurple
   */
  connect() {
    try {
      console.log(`Connecting to Twitch chat for channel: ${this.channel}`);

      const authProvider = new StaticAuthProvider(
        this.clientId,
        this.accessToken
      );

      this.client = new ChatClient({
        authProvider,
        channels: [this.channel],
        logger: {
          minLevel: "debug",
        },
      });

      this.client.onConnect(() => this.handleConnect());
      this.client.onDisconnect((manually, reason) =>
        this.handleDisconnect(manually, reason)
      );
      this.client.onMessage((channel, user, message, msg) =>
        this.handleMessage(channel, user, message, msg)
      );

      this.client.connect();
      console.log("Twurple connecting to Twitch...");

      this.emit("connecting");
    } catch (error) {
      console.error("Error setting up Twitch chat connection:", error);
      this.emit("error", error);
    }
  }

  /**
   * Disconnect from Twitch chat
   */
  disconnect() {
    if (this.client) {
      this.client.quit();
      this.client = null;
    }
  }

  /**
   * Handle connection established
   */
  private handleConnect() {
    console.log("Connected to Twitch chat");
    this.emit("connected");
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(manually: boolean, reason: Error | undefined) {
    console.log(
      `Disconnected from Twitch chat. Manual: ${manually}, Reason:`,
      reason
    );
    this.emit("disconnected", reason);

    if (!manually) {
      this.connect();
    }
  }

  /**
   * Handle message from chat
   */
  private handleMessage(
    channel: string,
    user: string,
    message: string,
    msg: any
  ) {
    try {
      const badges: Array<"subscriber" | "moderator" | "vip"> = [];

      if (msg.userInfo.isMod) badges.push("moderator");
      if (msg.userInfo.isSubscriber) badges.push("subscriber");
      if (msg.userInfo.isVip) badges.push("vip");

      const chatMessage: TwitchChatMessage = {
        id:
          msg.id ||
          `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        username: user,
        message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        badges,
        highlighted: false,
      };

      this.emit("message", chatMessage);

      if (message.startsWith(this.commandPrefix)) {
        const commandParts = message.slice(1).split(" ");
        const commandName = commandParts[0].toLowerCase();

        if (this.validCommands.includes(commandName as GameCommand)) {
          const command: TwitchCommand = {
            command: commandName,
            username: chatMessage.username,
            badges: chatMessage.badges,
            timestamp: chatMessage.timestamp,
          };

          console.log(
            `Command received: ${commandName} from ${chatMessage.username}`
          );
          this.emit("command", command);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }
}

export default TwitchChatService;

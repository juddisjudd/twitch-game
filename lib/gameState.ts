import { TwitchCommand, GameCommand } from "./twitch-twurple";
import { CommandTally } from "./voteSystem";

export type ZoneStatus = "active" | "locked" | "completed";

export interface Zone {
  id: string;
  name: string;
  status: ZoneStatus;
  position: { x: number; y: number };
  connections: string[];
  description?: string;
}

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  type: "narrative" | "action" | "system";
}

export interface GameMetrics {
  societyStability: number;
  mysteryProgress: number;
  chatInfluence: number;
}

/**
 * Game state manager that handles zones, logs, and game progression
 */
class GameState {
  private zones: Map<string, Zone>;
  private activeZone: string;
  private logs: LogEntry[];
  private metrics: GameMetrics;
  private nextLogId: number = 1;

  private onStateChange: (() => void) | null = null;

  constructor() {
    this.zones = new Map();
    this.initializeZones();

    this.activeZone = "central-hub";

    this.logs = [];

    this.addLog({
      text: "Welcome to Echoes of the Silenced. The fate of this world rests in the hands of the chat.",
      type: "system",
    });

    this.addLog({
      text: "The rain begins to fall over the broken towers, each drop carrying whispers of the past...",
      type: "narrative",
    });

    this.metrics = {
      societyStability: 75,
      mysteryProgress: 10,
      chatInfluence: 50,
    };
  }

  /**
   * Initialize game zones
   */
  private initializeZones() {
    const initialZones: Zone[] = [
      {
        id: "central-hub",
        name: "Central Hub",
        status: "active",
        position: { x: 50, y: 50 },
        connections: ["data-center", "residential", "power-plant"],
        description:
          "The remnants of what was once a thriving city center. Crumbling buildings frame abandoned streets, but faint signs of life persist.",
      },
      {
        id: "data-center",
        name: "Abandoned Data Center",
        status: "active",
        position: { x: 25, y: 25 },
        connections: ["central-hub", "power-plant"],
        description:
          "A maze of silent servers and tangled cables. Ancient data flows through these machines, holding secrets from before the collapse.",
      },
      {
        id: "residential",
        name: "Residential Ruins",
        status: "locked",
        position: { x: 75, y: 25 },
        connections: ["central-hub"],
        description:
          "Once home to thousands, now a silent graveyard of personal belongings and memories. Strange signals emanate from deep within.",
      },
      {
        id: "power-plant",
        name: "Power Plant",
        status: "locked",
        position: { x: 75, y: 75 },
        connections: ["central-hub", "data-center"],
        description:
          "The city's former energy heart, now dormant. Restoring power here could bring long-dead systems back online.",
      },
    ];

    initialZones.forEach((zone) => {
      this.zones.set(zone.id, zone);
    });
  }

  /**
   * Set a callback for state changes
   */
  setStateChangeCallback(callback: () => void) {
    this.onStateChange = callback;
  }

  /**
   * Get current time formatted for logs
   */
  private getCurrentTime(): string {
    return new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Process the winning command from a vote
   */
  processCommand(commandTally: CommandTally) {
    const command = commandTally.id;
    const voters = commandTally.voters.length;
    const voteCount = commandTally.votes;

    this.addLog({
      text: `Chat voted to ${command.toUpperCase()} ${
        this.getZone(this.activeZone).name
      }`,
      type: "action",
    });

    switch (command) {
      case "explore":
        this.handleExplore(voters);
        break;
      case "hack":
        this.handleHack(voters);
        break;
      case "investigate":
        this.handleInvestigate(voters);
        break;
      case "defend":
        this.handleDefend(voters);
        break;
    }

    const influenceChange = Math.min(10, Math.max(1, voters / 5));
    this.updateMetrics({
      chatInfluence: this.metrics.chatInfluence + influenceChange,
    });

    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  /**
   * Handle the explore command
   */
  private handleExplore(voterCount: number) {
    const currentZone = this.getZone(this.activeZone);

    this.addLog({
      text: `The collective consciousness guides your exploration of ${currentZone.name}. Forgotten pathways reveal themselves.`,
      type: "narrative",
    });

    const unlockedConnections = currentZone.connections.filter(
      (id) => this.getZone(id).status === "locked"
    );

    if (unlockedConnections.length > 0 && Math.random() < 0.3) {
      const zoneToUnlock =
        unlockedConnections[
          Math.floor(Math.random() * unlockedConnections.length)
        ];
      this.unlockZone(zoneToUnlock);

      this.addLog({
        text: `A new path to ${
          this.getZone(zoneToUnlock).name
        } has been discovered!`,
        type: "system",
      });

      this.updateMetrics({ mysteryProgress: this.metrics.mysteryProgress + 5 });
    }

    this.updateMetrics({ societyStability: this.metrics.societyStability - 2 });
  }

  /**
   * Handle the hack command
   */
  private handleHack(voterCount: number) {
    this.addLog({
      text: `Dormant systems crackle to life as the collective will infiltrates the digital remnants.`,
      type: "narrative",
    });

    this.updateMetrics({
      societyStability: this.metrics.societyStability - 5,
      mysteryProgress: this.metrics.mysteryProgress + 7,
    });

    if (this.activeZone === "data-center") {
      this.addLog({
        text: `The ancient servers yield fragments of data, hinting at something called "Protocol Silence"...`,
        type: "narrative",
      });
    }
  }

  /**
   * Handle the investigate command
   */
  private handleInvestigate(voterCount: number) {
    this.addLog({
      text: `A thorough examination of ${
        this.getZone(this.activeZone).name
      } reveals hidden details.`,
      type: "narrative",
    });

    this.updateMetrics({
      mysteryProgress: this.metrics.mysteryProgress + 5,
    });

    switch (this.activeZone) {
      case "central-hub":
        this.addLog({
          text: `Faded markings on the walls hint at organization called "The Collective" that once operated here.`,
          type: "narrative",
        });
        break;
      case "data-center":
        this.addLog({
          text: `Among the tangle of cables, a peculiar pattern emerges - someone deliberately rerouted core systems before the collapse.`,
          type: "narrative",
        });
        break;
    }
  }

  /**
   * Handle the defend command
   */
  private handleDefend(voterCount: number) {
    this.addLog({
      text: `Reinforcing your position in ${
        this.getZone(this.activeZone).name
      } provides security but delays progress.`,
      type: "narrative",
    });

    this.updateMetrics({
      societyStability: this.metrics.societyStability + 8,
      mysteryProgress: Math.max(0, this.metrics.mysteryProgress - 2),
    });
  }

  /**
   * Unlock a zone by ID
   */
  unlockZone(zoneId: string) {
    const zone = this.getZone(zoneId);
    if (zone) {
      zone.status = "active";
      this.notifyStateChanged();
    }
  }

  /**
   * Set the active zone
   */
  setActiveZone(zoneId: string) {
    const zone = this.getZone(zoneId);
    if (zone && zone.status === "active") {
      this.activeZone = zoneId;

      this.addLog({
        text: `Moved to ${zone.name}.`,
        type: "system",
      });

      this.notifyStateChanged();
    }
  }

  /**
   * Add a log entry
   */
  addLog(log: { text: string; type: "narrative" | "action" | "system" }) {
    const newLog = {
      ...log,
      id: this.nextLogId++,
      time: this.getCurrentTime(),
    };

    this.logs.push(newLog);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    this.notifyStateChanged();
  }

  /**
   * Update game metrics
   */
  updateMetrics(updates: Partial<GameMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...updates,
    };

    this.metrics.societyStability = Math.min(
      100,
      Math.max(0, this.metrics.societyStability)
    );
    this.metrics.mysteryProgress = Math.min(
      100,
      Math.max(0, this.metrics.mysteryProgress)
    );
    this.metrics.chatInfluence = Math.min(
      100,
      Math.max(0, this.metrics.chatInfluence)
    );

    this.notifyStateChanged();
  }

  /**
   * Notify that state has changed
   */
  private notifyStateChanged() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  /**
   * Get all zones
   */
  getZones(): Zone[] {
    return Array.from(this.zones.values());
  }

  /**
   * Get a specific zone by ID
   */
  getZone(id: string): Zone {
    const zone = this.zones.get(id);
    if (!zone) {
      throw new Error(`Zone not found: ${id}`);
    }
    return zone;
  }

  /**
   * Get the active zone
   */
  getActiveZone(): Zone {
    return this.getZone(this.activeZone);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get game metrics
   */
  getMetrics(): GameMetrics {
    return { ...this.metrics };
  }
}

export default GameState;

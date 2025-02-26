import { TwitchCommand, GameCommand } from "./twitch-twurple";

interface VoteWeight {
  regular: number;
  subscriber: number;
  vip: number;
  moderator: number;
}

export interface CommandTally {
  id: GameCommand;
  votes: number;
  voters: string[];
}

/**
 * Service that tracks votes/commands from Twitch chat
 */
class VoteSystem {
  private commandTallies: Map<GameCommand, CommandTally>;
  private votingPeriodMs: number;
  private votingActive: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private weights: VoteWeight = {
    regular: 1,
    subscriber: 2,
    vip: 3,
    moderator: 5,
  };

  private onVotingComplete: ((results: CommandTally[]) => void) | null = null;

  constructor(votingPeriodMs: number = 60000) {
    this.votingPeriodMs = votingPeriodMs;
    this.commandTallies = new Map();

    const commands: GameCommand[] = [
      "explore",
      "hack",
      "investigate",
      "defend",
    ];
    commands.forEach((cmd) => {
      this.commandTallies.set(cmd, {
        id: cmd,
        votes: 0,
        voters: [],
      });
    });
  }

  /**
   * Start a new voting period
   */
  startVoting(callback: (results: CommandTally[]) => void) {
    if (this.votingActive) {
      this.endVoting();
    }

    this.onVotingComplete = callback;
    this.resetTallies();
    this.votingActive = true;

    this.timer = setTimeout(() => {
      this.endVoting();
    }, this.votingPeriodMs);
  }

  /**
   * End the current voting period and report results
   */
  endVoting() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.votingActive = false;

    if (this.onVotingComplete) {
      const results = Array.from(this.commandTallies.values()).sort(
        (a, b) => b.votes - a.votes
      );

      this.onVotingComplete(results);
    }
  }

  /**
   * Reset vote tallies
   */
  resetTallies() {
    this.commandTallies.forEach((tally) => {
      tally.votes = 0;
      tally.voters = [];
    });
  }

  /**
   * Get the current vote tallies
   */
  getCurrentTallies(): CommandTally[] {
    return Array.from(this.commandTallies.values());
  }

  /**
   * Register a vote based on a command
   */
  registerVote(command: TwitchCommand) {
    if (!this.votingActive) return;

    const commandName = command.command as GameCommand;
    const tally = this.commandTallies.get(commandName);

    if (tally) {
      if (!tally.voters.includes(command.username)) {
        let weight = this.weights.regular;

        if (command.badges.includes("moderator")) {
          weight = this.weights.moderator;
        } else if (command.badges.includes("vip")) {
          weight = this.weights.vip;
        } else if (command.badges.includes("subscriber")) {
          weight = this.weights.subscriber;
        }

        tally.votes += weight;
        tally.voters.push(command.username);
      }
    }
  }

  /**
   * Get the remaining time in the current voting period (ms)
   */
  getRemainingTime(): number {
    if (!this.votingActive || !this.timer) return 0;

    const elapsed =
      Date.now() -
      (setTimeout as any)[Symbol.for("nodejs.timer.startTime")](this.timer);
    return Math.max(0, this.votingPeriodMs - elapsed);
  }

  /**
   * Check if voting is currently active
   */
  isVotingActive(): boolean {
    return this.votingActive;
  }

  /**
   * Set custom weights for different user types
   */
  setWeights(weights: Partial<VoteWeight>) {
    this.weights = {
      ...this.weights,
      ...weights,
    };
  }

  /**
   * Set the voting period duration
   */
  setVotingPeriod(periodMs: number) {
    this.votingPeriodMs = periodMs;
  }
}

export default VoteSystem;

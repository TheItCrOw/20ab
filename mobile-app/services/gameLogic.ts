import {
  Game,
  Move,
  Round,
  Tiebreak,
  TrumpSuit,
  STARTING_SCORE,
  SIT_OUT_PENALTY,
  SIT_OUT_THRESHOLD,
  SCORE_WIN,
  SCORE_LOSE,
} from '../models/types';
import * as Crypto from 'expo-crypto';

export function createGame(participantUsernames: string[], dealOrder?: string[]): Game {
  return {
    id: Crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 19),
    rounds: [],
    finisher: null,
    loser: null,
    winners: [],
    participants: participantUsernames,
    dealOrder: dealOrder ?? participantUsernames,
    inProgress: true,
  };
}

/** Get the username of the player whose turn it is for a given round. */
export function getCurrentTurnPlayer(game: Game, roundNumber: number): string {
  const order = game.dealOrder ?? game.participants;
  return order[(roundNumber - 1) % order.length];
}

/** Get the current score for a player (from latest round, or STARTING_SCORE). */
export function getCurrentScore(game: Game, username: string): number {
  for (let i = game.rounds.length - 1; i >= 0; i--) {
    const move = game.rounds[i].moves.find((m) => m.username === username);
    if (move) {
      return move.value;
    }
  }
  return STARTING_SCORE;
}

/** Get all current scores as a map. */
export function getAllScores(game: Game): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const username of game.participants) {
    scores[username] = getCurrentScore(game, username);
  }
  return scores;
}

/** Whether a player can sit out this round. */
export function canSitOut(game: Game, username: string, trump: TrumpSuit): boolean {
  if (trump === 'clubs') return false;
  const score = getCurrentScore(game, username);
  return score > SIT_OUT_THRESHOLD;
}

/** Get the point multiplier for a trump suit. */
export function getMultiplier(trump: TrumpSuit): number {
  return trump === 'hearts' ? 2 : 1;
}

/**
 * Build moves for a round.
 * @param game Current game state
 * @param trump The trump suit for this round
 * @param deltas Map of username → entered delta (-5 to +5) for participating players
 * @param sittingOut Set of usernames that are sitting out
 */
export function buildRoundMoves(
  game: Game,
  trump: TrumpSuit,
  deltas: Record<string, number>,
  sittingOut: Set<string>
): Move[] {
  const multiplier = getMultiplier(trump);

  return game.participants.map((username): Move => {
    const currentScore = getCurrentScore(game, username);

    if (sittingOut.has(username)) {
      const penalty = SIT_OUT_PENALTY * multiplier;
      return {
        username,
        value: currentScore + penalty,
        delta: null,
        satOut: true,
      };
    }

    const delta = deltas[username] ?? 0;
    const adjustedDelta = delta * multiplier;
    return {
      username,
      value: currentScore + adjustedDelta,
      delta,
      satOut: false,
    };
  });
}

/** Add a round to the game. Returns updated game with end-of-game detection. */
export function addRound(game: Game, trump: TrumpSuit, moves: Move[]): Game {
  const newRound: Round = { trump, moves };
  const updatedGame: Game = {
    ...game,
    rounds: [...game.rounds, newRound],
  };

  // Check for game end: any player ≤0 or ≥41
  const scores = getAllScores(updatedGame);
  const gameEnded = Object.values(scores).some(
    (s) => s <= SCORE_WIN || s >= SCORE_LOSE
  );

  if (gameEnded) {
    const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const finisher = sorted[0][0]; // lowest score
    const maxScore = sorted[sorted.length - 1][1];
    const tiedForLast = sorted.filter(([, s]) => s === maxScore);

    updatedGame.finisher = finisher;

    if (tiedForLast.length > 1) {
      // Draw — tiebreaker needed between tied players
      updatedGame.winners = sorted
        .slice(1)
        .filter(([, s]) => s !== maxScore)
        .map(([username]) => username);
      updatedGame.tiebreak = {
        players: tiedForLast.map(([username]) => username),
        rounds: [],
        starter: '',
      };
      // Keep inProgress true so the tiebreaker can be played
    } else {
      const loser = sorted[sorted.length - 1][0]; // highest score
      const winners = sorted
        .slice(1, -1)
        .map(([username]) => username);

      updatedGame.loser = loser;
      updatedGame.winners = winners;
      updatedGame.inProgress = false;
    }
  }

  return updatedGame;
}

/** Remove the last round from the game. */
export function undoLastRound(game: Game): Game {
  if (game.rounds.length === 0) return game;
  return {
    ...game,
    rounds: game.rounds.slice(0, -1),
    finisher: null,
    loser: null,
    winners: [],
    tiebreak: undefined,
    inProgress: true,
  };
}

// ── Tiebreak helpers ─────────────────────────────────────────────────

/** Get a tiebreak player's score (cumulative delta from tiebreak rounds, starting at 0). */
export function getTiebreakScore(game: Game, username: string): number {
  if (!game.tiebreak) return 0;
  for (let i = game.tiebreak.rounds.length - 1; i >= 0; i--) {
    const move = game.tiebreak.rounds[i].moves.find((m) => m.username === username);
    if (move) return move.value;
  }
  return 0;
}

/** Build moves for a tiebreak round (no sitting out allowed). */
export function buildTiebreakMoves(
  game: Game,
  trump: TrumpSuit,
  deltas: Record<string, number>
): Move[] {
  if (!game.tiebreak) throw new Error('No tiebreak in progress');
  const multiplier = getMultiplier(trump);

  return game.tiebreak.players.map((username): Move => {
    const currentScore = getTiebreakScore(game, username);
    const delta = deltas[username] ?? 0;
    const adjustedDelta = delta * multiplier;
    return {
      username,
      value: currentScore + adjustedDelta,
      delta,
      satOut: false,
    };
  });
}

/** Add a round to the tiebreak. Resolves the loser when scores diverge. */
export function addTiebreakRound(game: Game, trump: TrumpSuit, moves: Move[]): Game {
  if (!game.tiebreak) return game;

  const newRound: Round = { trump, moves };
  const updatedTiebreak: Tiebreak = {
    ...game.tiebreak,
    rounds: [...game.tiebreak.rounds, newRound],
  };

  const updatedGame: Game = { ...game, tiebreak: updatedTiebreak };

  // Check if scores have diverged
  const scores: Record<string, number> = {};
  for (const player of updatedTiebreak.players) {
    scores[player] = getTiebreakScore(updatedGame, player);
  }
  const vals = Object.values(scores);
  const allEqual = vals.every((s) => s === vals[0]);

  if (!allEqual) {
    // Tiebreak resolved — highest score loses
    const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const loser = sorted[sorted.length - 1][0];
    const tiebreakWinners = updatedTiebreak.players.filter((u) => u !== loser);
    updatedGame.loser = loser;
    updatedGame.winners = [...updatedGame.winners, ...tiebreakWinners];
    updatedGame.inProgress = false;
  }

  return updatedGame;
}

/** Remove the last tiebreak round. */
export function undoLastTiebreakRound(game: Game): Game {
  if (!game.tiebreak || game.tiebreak.rounds.length === 0) return game;
  return {
    ...game,
    tiebreak: {
      ...game.tiebreak,
      rounds: game.tiebreak.rounds.slice(0, -1),
    },
    loser: null,
    winners: game.winners.filter((u) => !game.tiebreak!.players.includes(u)),
    inProgress: true,
  };
}

/** Get the username of the tiebreak player whose turn it is. */
export function getTiebreakTurnPlayer(game: Game, roundNumber: number): string {
  if (!game.tiebreak) throw new Error('No tiebreak in progress');
  const order = game.tiebreak.players;
  // Starter goes first; alternate each round
  const starterIdx = order.indexOf(game.tiebreak.starter);
  const idx = (starterIdx + roundNumber - 1) % order.length;
  return order[idx];
}

/** Convert a game to the JSON format compatible with the dashboard data files. */
export function toExportFormat(game: Game): object {
  return {
    date: game.date.includes('T') ? game.date : `${game.date}T00:00:00`,
    winner: game.finisher,
    loser: game.loser,
    rounds: game.rounds.map((r) => ({
      moves: r.moves.map((m) => ({
        username: m.username,
        value: m.value,
      })),
    })),
  };
}

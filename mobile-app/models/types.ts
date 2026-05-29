export interface Player {
  username: string;
  name: string;
}

export type TrumpSuit = 'hearts' | 'clubs' | 'diamonds' | 'spades';

export const TRUMP_LABELS: Record<TrumpSuit, string> = {
  hearts: 'Hearts',
  clubs: 'Clubs',
  diamonds: 'Diamonds',
  spades: 'Spades',
};

export const TRUMP_ALIASES: Record<TrumpSuit, string> = {
  hearts: 'Herzchen',
  clubs: 'Bäumchen',
  diamonds: 'Sternchen',
  spades: 'Schippchen',
};

export const TRUMP_SYMBOLS: Record<TrumpSuit, string> = {
  hearts: '\u2665',   // ♥
  clubs: '\u2663',    // ♣
  diamonds: '\u2666', // ♦
  spades: '\u2660',   // ♠
};

export const TRUMP_COLORS: Record<TrumpSuit, string> = {
  hearts: '#D32F2F',
  clubs: '#333333',
  diamonds: '#D32F2F',
  spades: '#333333',
};

export interface Move {
  username: string;
  /** Player's current total score after this round. */
  value: number;
  /** The delta that was entered (-5 to +5), or null if sat out. */
  delta: number | null;
  /** Whether the player sat out this round. */
  satOut: boolean;
}

export interface Round {
  trump: TrumpSuit;
  moves: Move[];
}

export interface Game {
  id: string;
  date: string; // ISO datetime string YYYY-MM-DDTHH:mm:ss
  rounds: Round[];
  /** The player who finished first (lowest score, reached ≤0). */
  finisher: string | null;
  /** The player with the most points at game end. */
  loser: string | null;
  /** All players that are neither finisher nor loser. */
  winners: string[];
  participants: string[];
  /** Fixed seating order that determines turn rotation. */
  dealOrder?: string[];
  inProgress: boolean;
}

export const STARTING_SCORE = 20;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const MIN_DELTA = -5;
export const MAX_DELTA = 5;
export const SIT_OUT_PENALTY = 1;
/** A player cannot sit out if their score is at or below this threshold. */
export const SIT_OUT_THRESHOLD = 7;
/** Delta applied when a player wins no tricks in a round. */
export const NO_TRICK_DELTA = 5;
export const SCORE_WIN = 0;
export const SCORE_LOSE = 41;

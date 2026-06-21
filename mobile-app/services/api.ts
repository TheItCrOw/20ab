import Constants from 'expo-constants';
import { Game } from '../models/types';

const DASHBOARD_URL: string =
  Constants.expoConfig?.extra?.dashboardUrl ?? 'http://localhost:8050';

interface UploadResult {
  success: boolean;
  game_numbers?: number[];
  skipped_duplicates?: number;
  message?: string;
  error?: string;
}

/**
 * Converts a Game to the dashboard-compatible format (same as exportService).
 */
function toDashboardFormat(game: Game) {
  return {
    date: game.date,
    finisher: game.finisher ?? '',
    loser: game.loser ?? '',
    rounds: game.rounds.map((round) => ({
      moves: round.moves.map((move) => ({
        username: move.username,
        value: move.value,
      })),
    })),
  };
}

/**
 * Upload one or more games to the dashboard server.
 */
export async function uploadGames(
  games: Game[],
  password: string,
): Promise<UploadResult> {
  const dashboardGames = games.map(toDashboardFormat);

  const body =
    dashboardGames.length === 1
      ? { password, game: dashboardGames[0] }
      : { password, games: dashboardGames };

  const res = await fetch(`${DASHBOARD_URL}/post-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `Upload failed (${res.status})`);
  }

  return json;
}

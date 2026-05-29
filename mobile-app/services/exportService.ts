import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Game } from '../models/types';

// --- Dashboard-compatible types ---

interface DashboardMove {
  username: string;
  value: number;
}

interface DashboardRound {
  moves: DashboardMove[];
}

interface DashboardGame {
  date: string;       // "YYYY-MM-DDT00:00:00"
  finisher: string;
  loser: string;
  rounds: DashboardRound[];
}

// --- Conversion ---

function toDashboardFormat(game: Game): DashboardGame {
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

// --- File helpers ---

async function writeTempFile(filename: string, content: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

function buildExportContent(games: Game[]): { filename: string; content: string } {
  if (games.length === 1) {
    const dashGame = toDashboardFormat(games[0]);
    return {
      filename: `game_${games[0].date.slice(0, 10)}.json`,
      content: JSON.stringify(dashGame, null, 2),
    };
  }
  const dashGames = games.map(toDashboardFormat);
  const today = new Date().toISOString().slice(0, 10);
  return {
    filename: `20ab_export_${today}.json`,
    content: JSON.stringify(dashGames, null, 2),
  };
}

// --- Public export actions ---

export async function saveGamesToDevice(games: Game[]): Promise<void> {
  const { filename, content } = buildExportContent(games);
  const uri = await writeTempFile(filename, content);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Game Data',
    UTI: 'public.json',
  });
}

export async function emailGames(games: Game[]): Promise<boolean> {
  const available = await MailComposer.isAvailableAsync();
  if (!available) return false;

  const { filename, content } = buildExportContent(games);
  const uri = await writeTempFile(filename, content);
  const count = games.length;

  await MailComposer.composeAsync({
    subject: `20ab Game Export — ${count} game${count !== 1 ? 's' : ''}`,
    body: `Attached: ${count} game${count !== 1 ? 's' : ''} exported from the 20ab Score Tracker.\n\nPlace the file(s) in the dashboard's games/ folder to visualise them.`,
    attachments: [uri],
  });
  return true;
}

export async function shareGames(games: Game[]): Promise<void> {
  const { filename, content } = buildExportContent(games);
  const uri = await writeTempFile(filename, content);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Share Game Data',
    UTI: 'public.json',
  });
}

export function formatGameLabel(game: Game): string {
  // "15 Apr 2024 · 4 players"
  const d = new Date(game.date.includes('T') ? game.date : game.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${dateStr} · ${game.participants.length} player${game.participants.length !== 1 ? 's' : ''}`;
}

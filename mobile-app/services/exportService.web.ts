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

// --- Conversion (identical to native) ---

function toDashboardFormat(game: Game): DashboardGame {
  return {
    date: `${game.date}T00:00:00`,
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

// --- Web file helpers ---

function buildExportContent(games: Game[]): { filename: string; content: string } {
  if (games.length === 1) {
    const dashGame = toDashboardFormat(games[0]);
    return {
      filename: `game_${games[0].date}.json`,
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

function triggerBrowserDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Public export actions ---

export async function saveGamesToDevice(games: Game[]): Promise<void> {
  const { filename, content } = buildExportContent(games);
  triggerBrowserDownload(filename, content);
}

export async function emailGames(games: Game[]): Promise<boolean> {
  const { filename, content } = buildExportContent(games);

  // Try Web Share API first (works on mobile Safari/Chrome with files)
  if (navigator.share && navigator.canShare) {
    const file = new File([content], filename, { type: 'application/json' });
    const shareData = { files: [file] };
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
  }

  // Fallback: download the file and open a mailto link
  triggerBrowserDownload(filename, content);
  const count = games.length;
  const subject = encodeURIComponent(`20ab Game Export — ${count} game${count !== 1 ? 's' : ''}`);
  const body = encodeURIComponent(
    `Attached: ${count} game${count !== 1 ? 's' : ''} exported from the 20ab Score Tracker.\n\nThe file "${filename}" has been downloaded — please attach it manually.`
  );
  window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  return true;
}

export async function shareGames(games: Game[]): Promise<void> {
  const { filename, content } = buildExportContent(games);

  // Try Web Share API with file (mobile browsers)
  if (navigator.share && navigator.canShare) {
    const file = new File([content], filename, { type: 'application/json' });
    const shareData = { files: [file] };
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return;
    }
  }

  // Fallback: plain download
  triggerBrowserDownload(filename, content);
}

export function formatGameLabel(game: Game): string {
  const d = new Date(game.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${dateStr} · ${game.participants.length} player${game.participants.length !== 1 ? 's' : ''}`;
}

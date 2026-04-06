import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, Player } from '../models/types';

const KEYS = {
  PLAYERS: 'players',
  GAMES: 'games',
  ACTIVE_GAME: 'active_game',
};

// --- Players ---

export async function getPlayers(): Promise<Player[]> {
  const data = await AsyncStorage.getItem(KEYS.PLAYERS);
  return data ? JSON.parse(data) : [];
}

export async function savePlayers(players: Player[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
}

export async function addPlayer(player: Player): Promise<void> {
  const players = await getPlayers();
  if (players.some((p) => p.username === player.username)) {
    throw new Error(`Player "${player.username}" already exists`);
  }
  players.push(player);
  await savePlayers(players);
}

export async function updatePlayer(
  oldUsername: string,
  updated: Player
): Promise<void> {
  const players = await getPlayers();
  const idx = players.findIndex((p) => p.username === oldUsername);
  if (idx < 0) throw new Error(`Player "${oldUsername}" not found`);
  if (
    updated.username !== oldUsername &&
    players.some((p) => p.username === updated.username)
  ) {
    throw new Error(`Player "${updated.username}" already exists`);
  }
  players[idx] = updated;
  await savePlayers(players);
}

export async function removePlayer(username: string): Promise<void> {
  const players = await getPlayers();
  await savePlayers(players.filter((p) => p.username !== username));
}

// --- Games ---

export async function getGames(): Promise<Game[]> {
  const data = await AsyncStorage.getItem(KEYS.GAMES);
  return data ? JSON.parse(data) : [];
}

export async function saveGame(game: Game): Promise<void> {
  const games = await getGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.push(game);
  }
  await AsyncStorage.setItem(KEYS.GAMES, JSON.stringify(games));
}

export async function deleteGame(id: string): Promise<void> {
  const games = await getGames();
  await AsyncStorage.setItem(
    KEYS.GAMES,
    JSON.stringify(games.filter((g) => g.id !== id))
  );
}

// --- Active Game ---

export async function getActiveGame(): Promise<Game | null> {
  const data = await AsyncStorage.getItem(KEYS.ACTIVE_GAME);
  return data ? JSON.parse(data) : null;
}

export async function saveActiveGame(game: Game | null): Promise<void> {
  if (game) {
    await AsyncStorage.setItem(KEYS.ACTIVE_GAME, JSON.stringify(game));
  } else {
    await AsyncStorage.removeItem(KEYS.ACTIVE_GAME);
  }
}

// --- Seed default players ---

const DEFAULT_PLAYERS: Player[] = [
  { username: 'Agnes', name: 'Agnes Franz' },
  { username: 'Felix', name: 'Felix Oberle' },
  { username: 'Manu', name: 'Manuel John' },
  { username: 'Maura', name: 'Maura' },
  { username: 'Kevin', name: 'Kevin Bönisch' },
  { username: 'Miri', name: 'Miriam Achtzehtner' },
  { username: 'Moritz', name: 'Moritz Englisch' },
  { username: 'Celine', name: 'Celine Bittner' },
  { username: 'Luise', name: 'Luise' },
  { username: 'Niklas', name: 'Niklas Otto' },
];

export async function seedPlayersIfEmpty(): Promise<void> {
  const players = await getPlayers();
  if (players.length === 0) {
    await savePlayers(DEFAULT_PLAYERS);
  }
}

// --- One-time data wipe (keeps players, clears games + active game) ---

const WIPE_VERSION_KEY = 'data_wipe_version';
const CURRENT_WIPE_VERSION = '1';

export async function runDataWipeIfNeeded(): Promise<void> {
  const version = await AsyncStorage.getItem(WIPE_VERSION_KEY);
  if (version === CURRENT_WIPE_VERSION) return;

  await AsyncStorage.removeItem(KEYS.GAMES);
  await AsyncStorage.removeItem(KEYS.ACTIVE_GAME);
  await AsyncStorage.setItem(WIPE_VERSION_KEY, CURRENT_WIPE_VERSION);
}

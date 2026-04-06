# 20 ab — Mobile App

Score tracker for the 20 ab card game. Built with React Native and Expo, targeting Android and iOS. Companion to the Python/Dash dashboard in `/dashboard`.

---

## Game Rules Summary

- 2–10 players, each starts at 20 points.
- Each round a trump suit is chosen: hearts doubles all deltas and penalties, clubs forces all players to participate (no sitting out), diamonds and spades are standard.
- Each player receives a delta (-5 to +5) per round. Delta is added directly to score (negative = score goes down = good).
- A player may sit out a round and receives +1 penalty (+2 on hearts). A player cannot sit out if their score is 6 or below.
- Game ends when any player reaches 0 or below (Finisher) or 41 or above (Loser). Remaining players are Winners.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81 via Expo SDK 54 |
| Language | TypeScript |
| Routing | Expo Router (file-based, similar to Next.js) |
| Persistence | `@react-native-async-storage/async-storage` |
| UUID generation | `expo-crypto` (`Crypto.randomUUID()`) |
| Safe area handling | `react-native-safe-area-context` |
| File export | `expo-file-system/legacy`, `expo-sharing`, `expo-mail-composer` |
| Icons | `@expo/vector-icons` (FontAwesome subset) |
| Animations | `react-native-reanimated` |
| Build / publish | EAS Build (Expo Application Services) |

Note: `uuid` package is not used — it requires `crypto.getRandomValues()` which is unavailable in React Native. Use `expo-crypto` instead.

Note: `expo-file-system` v19 moved its legacy API (`writeAsStringAsync`, `cacheDirectory`, `EncodingType`) to a subpath. Always import as `expo-file-system/legacy` for those functions.

---

## Project Structure

```
mobile-app/
  app/
    _layout.tsx           Root layout. Wraps everything in SafeAreaProvider and ThemeContextProvider.
    (tabs)/
      _layout.tsx         Tab bar config. Uses useSafeAreaInsets() to avoid Android nav bar overlap.
      index.tsx           Main game screen (state machine: loading/no_game/trump_select/score_input/game_finished).
      history.tsx         List of completed games, navigates to game/[id].
      players.tsx         Add/edit/remove players.
      settings.tsx        Dark/light mode toggle, export game history button.
    game/
      [id].tsx            Completed game detail: Finisher/Loser/Winners cards + round-by-round table.
  components/
    ExportModal.tsx       Two-step modal: select games + choose export method (device/email/share).
    GameHistory.tsx       Horizontally scrollable round table with per-player score and delta.
    GameFinished.tsx      End-of-game result display.
    RoundInput.tsx        Per-player delta input with +/- buttons and sit-out toggle.
    ScoreBoard.tsx        Current scores display during a game.
    SplashOverlay.tsx     Animated in-app splash screen shown on first render.
    TrumpSelector.tsx     Trump suit picker.
    PlayerSelector.tsx    Player selection at game start.
    useColorScheme.ts     Reads from ThemeContext, not directly from the system.
  contexts/
    ThemeContext.tsx       Manages light/dark preference. Persists to AsyncStorage. Defaults to system scheme.
  models/
    types.ts              All TypeScript interfaces and game constants.
  services/
    gameLogic.ts          Pure functions: createGame, addRound, undoLastRound, buildRoundMoves, etc.
    storage.ts            AsyncStorage read/write for players, games, active game. Handles data migration.
    exportService.ts      Converts Game objects to dashboard-compatible JSON. Handles file write and sharing.
  constants/
    Colors.ts             Full design token set for light and dark themes, mirroring the dashboard palette.
  assets/
    images/               App icon, adaptive icon, splash logo.
    fonts/                SpaceMono (monospace, used for code-style labels).
```

---

## Design System

Mirrors the `/dashboard` visual style. Key tokens from `constants/Colors.ts`:

- Accent: `#6366F1` (light) / `#7C79F5` (dark) — indigo
- Background: `#EFF1F8` (light) / `#0C0C16` (dark) — near-black navy
- Surface: `#FFFFFF` (light) / `#1B1B2C` (dark)
- Win: green, Loss: red, Finish: amber

Theme is managed by `ThemeContext`. `useColorScheme()` reads from the context, not from `react-native` directly. This allows user override via the Settings tab, persisted in AsyncStorage.

---

## Data Model

```typescript
Game {
  id: string             // UUID
  date: string           // "YYYY-MM-DD"
  rounds: Round[]
  finisher: string|null  // username, player who reached <=0
  loser: string|null     // username, player who reached >=41
  winners: string[]      // everyone else
  participants: string[] // all usernames in this game
  inProgress: boolean
}

Round {
  trump: 'hearts'|'clubs'|'diamonds'|'spades'
  moves: Move[]
}

Move {
  username: string
  value: number       // cumulative score after this round
  delta: number|null  // entered delta, null if sat out
  satOut: boolean
}

Player {
  username: string    // unique identifier, used in all game data
  name: string        // display name
}
```

All data lives in AsyncStorage. Keys: `players`, `games`, `active_game`, `user_theme_preference`.

---

## Dashboard Export Format

The `/dashboard` loads games from individual `.json` files in its `games/` folder. Each file matches:

```json
{
  "date": "2024-04-01T00:00:00",
  "finisher": "Kevin",
  "loser": "Manu",
  "rounds": [
    {
      "moves": [
        { "username": "Kevin", "value": 18 },
        { "username": "Manu",  "value": 22 }
      ]
    }
  ]
}
```

`participants` and `winners` are computed by the dashboard's Pydantic model validator and must not be included in the export. The `exportService.ts` handles this conversion. Single-game export produces `game_YYYY-MM-DD.json`; multi-game export produces `20ab_export_YYYY-MM-DD.json` as a JSON array.

---

## Android Edge-to-Edge

`edgeToEdgeEnabled: true` is set in `app.json`. This makes content draw behind the Android system navigation bar. To compensate:

- `SafeAreaProvider` wraps the root in `app/_layout.tsx`.
- `useSafeAreaInsets()` is called in `app/(tabs)/_layout.tsx` to compute tab bar height and padding dynamically.
- `ExportModal` also uses `useSafeAreaInsets()` to pad the header (status bar) and footer (nav bar).

Any new full-screen modal or custom bottom bar must apply insets manually.

---

## Building and Publishing

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- An Expo account (free): expo.dev
- A Google Play Console account for Android ($25 one-time fee)

### Install dependencies

```bash
cd mobile-app
npm install
```

### Development (Expo Go)

```bash
npx expo start
```

Scan the QR code with Expo Go on your device. Note: some native modules (expo-mail-composer, expo-sharing) require a development build or production build to function — they will error or no-op in Expo Go.

### Production build via EAS

EAS Build compiles the app on Expo's cloud servers. No local Android Studio or Xcode required.

```bash
eas login --sso      # once, logs into your Expo account
eas init             # once per project, registers the project and fills projectId in app.json
eas build --platform android --profile production
```

This uploads the project, runs `./gradlew bundleRelease` on a Linux server, signs the AAB with Expo's managed credentials, and returns a download link for the `.aab` file.

The `production` profile in `eas.json` has `autoIncrement: true`, so `versionCode` is bumped automatically on each build.

### Signing

The app is signed by EAS-managed credentials by default. The keystore is stored on Expo's servers tied to your account. To use a local keystore instead (e.g. `20ab-release.keystore` in the repo root), configure `eas.json` with `"credentialsSource": "local"` and set up `credentials.json`. The generated keystore file is gitignored via `*.jks` and must never be committed or lost — losing it means you cannot publish updates to the same Play Store listing.

### Submitting to Google Play

After downloading the `.aab`:

1. Go to Google Play Console — your app — Internal Testing — Create release.
2. Upload the `.aab`.
3. Roll out the release.
4. Testers must accept the opt-in invite link before the Play Store link resolves for them.

To promote to Production: Internal Testing — your release — Promote to Production. Google review typically takes 1–3 days for the first submission.

### Regenerating the native Android folder

The `android/` folder is generated and gitignored. If it is missing (fresh clone) or after adding a new native Expo plugin, regenerate it with:

```bash
npx expo prebuild --platform android --no-install
```

This re-applies all config plugins from `app.json`. Any manual edits to `android/` (outside of `gradle.properties`) will be overwritten by prebuild.

---

## Known Constraints

- The app is English-only. Player names can be any string.
- There is no cloud sync or backend. All data is local to the device.
- Exporting games to the dashboard is manual: export the file, place it in `dashboard/data/games/`.
- The dashboard expects one game per `.json` file. Multi-game exports from the app are arrays and must be split manually before the dashboard can load them, unless the dashboard is updated to handle arrays.

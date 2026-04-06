# 20ab

The following document describes the results of 20ab and also what this mobile-app should exactly do to help play it. In the following, I will layout every tab:

## Tab: Game

If there is no current game running, then there should be the option to start a new game by selecting at least 2 players up to a maximum of 10.

When starting a new game, this is exactly how the app should behave:

### Game Loop

- A new round begins
- A player who has 6 or less points HAS to play
- The app asks what the trump symbol is (heart, clubs, diamonds or spades). Depending on the entered symbol, there are special rules:
    - When heart was chosen, all the entered points will be doubled
    - When clubs is chosen, EVERY player has to play
- After the trump symbol is set, the app needs to wait for the players to physically play out the game.
- Once the round is finished, the app asks foreach player after another how many points were made. This is a range from -5 to 5. Depending on whats entered by the app user, the app keeps track of the scores of the players (remember: heart means double!)
- Once every player's points were added or substracted, the points for this round should be added to the game history and the whole history, round by round, should be appropriately displayed with all the metadata.
- If one player either reaches 41 or higher OR 0 or less, then the whole game ends.
  - The "Finisher" is the person that has the least points
  - The "Loser" is the person with the most points
  - Everyone else is a "winner" (because they dont have to buy a round)

## Tab: History

Shows all the games played with the option to click a game and see the full game history (same view as within the "Game" tab when playing)

## Tab: Players

Shows all added players with the option to add, remove or edit them.
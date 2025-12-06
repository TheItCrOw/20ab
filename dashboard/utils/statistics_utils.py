from models.game import Game
from models.player import Player


def total_wins(player: Player, games: list[Game]) -> int:
    """Return the total number of games the player won."""
    return sum(1 for game in games if game.winner == player.username)


def total_losses(player: Player, games: list[Game]) -> int:
    """Return the total number of games the player lost."""
    return sum(1 for game in games if game.loser == player.username)


def win_percentage(player: Player, games: list[Game]) -> float:
    """
    Win% = wins / games_played.
    Returns 0.0 if the player has no games.
    """
    games_played = len(games)
    if games_played == 0:
        return 0.0

    wins = total_wins(player, games)
    return wins / games_played


def loss_percentage(player: Player, games: list[Game]) -> float:
    """
    Loss% = losses / games_played.
    Returns 0.0 if the player has no games.
    """
    games_played = len(games)
    if games_played == 0:
        return 0.0

    losses = total_losses(player, games)
    return losses / games_played


def avg_points_per_round(player: Player, games: list[Game]) -> float:
    """
    For each game, walk through rounds in order and:
      - find the player's move in that round (if present),
      - compute the difference to their previous move in this game
        (curr.value - prev.value),
      - accumulate these deltas and count how many such steps we have.

    AvgPointPerRound = total_delta / number_of_deltas_across_all_games.
    """
    username = player.username
    total_delta = 0
    delta_count = 0

    for game in games:
        prev_value: int | None = None

        for rnd in game.rounds:
            # find this player's single move in the round
            player_move = next(
                (
                    move for move in rnd.moves
                    if move.username == username and move.value is not None
                ),
                None,
            )

            if player_move is None:
                # player didn't move in this round (or value is None)
                continue

            curr_value = player_move.value

            if prev_value is not None:
                total_delta += (curr_value - prev_value)
                delta_count += 1

            # update previous value for the next round of this game
            prev_value = curr_value

    if delta_count == 0:
        return 0.0

    return total_delta / delta_count


def dropout_percentage(player: Player, games: list[Game]) -> float:
    """
    Returns the percentage (0.0–1.0) of rounds where the player drops out.

    A dropout is defined as curr.value - prev.value being either 1 or 2.

    dropout_percentage =
        total_dropouts / total_rounds_where_player_had_prev_and_curr_value
    """
    username = player.username
    total_dropouts = 0
    total_opportunities = 0  # rounds where a dropout *could* have occurred

    for game in games:
        prev_value: int | None = None

        for rnd in game.rounds:
            # Get this player's move in this round
            player_move = next(
                (
                    move for move in rnd.moves
                    if move.username == username and move.value is not None
                ),
                None,
            )

            if player_move is None:
                continue

            curr_value = player_move.value

            # We can only measure dropout if a previous value exists
            if prev_value is not None:
                total_opportunities += 1
                delta = curr_value - prev_value

                if delta in (1, 2):
                    total_dropouts += 1

            prev_value = curr_value

    if total_opportunities == 0:
        return 0.0

    return total_dropouts / total_opportunities

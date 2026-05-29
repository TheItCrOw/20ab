from models.game import Game
from models.player import Player


def avg_final_score(player: Player, games: list[Game]) -> float:
    """
    Average of each player's last recorded score across games.
    Lower is better — the finisher always contributes 0, losers contribute high values.
    """
    scores = []
    for game in games:
        last_value = None
        for rnd in game.rounds:
            move = next(
                (m for m in rnd.moves if m.username == player.username and m.value is not None),
                None,
            )
            if move is not None:
                last_value = move.value
        if last_value is not None:
            scores.append(last_value)
    return sum(scores) / len(scores) if scores else 0.0


def score_trajectory(player: Player, games: list[Game], min_samples: int = 2) -> dict[int, float]:
    """
    Average score at each round position across all games.
    Only includes positions with at least min_samples data points to avoid single-game noise.
    """
    round_sums: dict[int, float] = {}
    round_counts: dict[int, int] = {}

    for game in games:
        for round_idx, rnd in enumerate(game.rounds, start=1):
            move = next(
                (m for m in rnd.moves if m.username == player.username and m.value is not None),
                None,
            )
            if move is not None:
                round_sums[round_idx] = round_sums.get(round_idx, 0.0) + move.value
                round_counts[round_idx] = round_counts.get(round_idx, 0) + 1

    return {
        r: round_sums[r] / round_counts[r]
        for r in sorted(round_sums)
        if round_counts[r] >= min_samples
    }


def current_streak(player: Player, games: list[Game]) -> tuple[str, int]:
    """
    Current consecutive win ('W') or loss ('L') streak for the player,
    based on chronological game order within the provided games list.
    """
    player_games = sorted(
        [g for g in games if player.username in g.participants],
        key=lambda g: g.date,
    )
    if not player_games:
        return ("W", 0)

    streak_type = "L" if player_games[-1].loser == player.username else "W"
    count = 0
    for game in reversed(player_games):
        is_loss = game.loser == player.username
        if (streak_type == "W" and not is_loss) or (streak_type == "L" and is_loss):
            count += 1
        else:
            break
    return (streak_type, count)


def total_wins(player: Player, games: list[Game]) -> int:
    """Return the total number of games the player won (i.e. was not the loser)."""
    return sum(1 for game in games if player.username in game.winners)


def total_finishes(player: Player, games: list[Game]) -> int:
    """Return the total number of games the player finished first (reached 0)."""
    return sum(1 for game in games if game.finisher == player.username)


def total_losses(player: Player, games: list[Game]) -> int:
    """Return the total number of games the player lost."""
    return sum(1 for game in games if game.loser == player.username)


def win_percentage(player: Player, games: list[Game]) -> float:
    """
    Win% = wins (non-loser) / games_played.
    Returns 0.0 if the player has no games.
    """
    games_played = len(games)
    if games_played == 0:
        return 0.0

    return total_wins(player, games) / games_played


def finish_percentage(player: Player, games: list[Game]) -> float:
    """
    Finish% = finishes / games_played.
    Returns 0.0 if the player has no games.
    """
    games_played = len(games)
    if games_played == 0:
        return 0.0

    return total_finishes(player, games) / games_played


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


DRINK_PRICE = 3.50



def drinks_balance(player: Player, games: list[Game]) -> float:
    """
    Net drinks cost for the player across all games.

    When a player loses, they pay for every other participant's drink:
        paid = (num_participants - 1) * DRINK_PRICE

    When a player wins or finishes (i.e. does NOT lose), the loser pays
    one drink for them:
        received = 1 * DRINK_PRICE

    Balance = total_paid - total_received
    Positive → net spender; negative → net beneficiary.
    """
    total_paid = 0.0
    total_received = 0.0
    for game in games:
        if player.username not in game.participants:
            continue
        if game.loser == player.username:
            total_paid -= (len(game.participants) - 1) * DRINK_PRICE
        else:
            total_received -= DRINK_PRICE
    return total_paid - total_received


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

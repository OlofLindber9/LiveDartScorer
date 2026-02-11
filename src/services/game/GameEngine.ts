import type { DartScore, GameState, Player, Turn } from '../../types/game';
import { STARTING_SCORE } from '../../constants/game';

export type ThrowResult = 'continue' | 'bust' | 'win' | 'turn_complete';

export function createPlayer(id: number, name: string): Player {
  return {
    id,
    name,
    remaining: STARTING_SCORE,
    dartsThrown: 0,
    turnHistory: [],
    average: 0,
  };
}

export function throwDart(
  state: GameState,
  dart: DartScore
): { newState: GameState; result: ThrowResult } {
  const player = state.players[state.currentPlayerIndex];
  const turnDarts = [...state.currentTurn, dart];
  const turnTotal = turnDarts.reduce((sum, d) => sum + d.value, 0);
  const newRemaining = player.remaining - turnTotal;

  // Bust: score below 0, exactly 1, or 0 without a double
  if (newRemaining < 0 || newRemaining === 1) {
    return { newState: bustTurn(state), result: 'bust' };
  }

  if (newRemaining === 0) {
    if (dart.multiplier !== 2) {
      return { newState: bustTurn(state), result: 'bust' };
    }
    return { newState: winGame(state, turnDarts, turnTotal), result: 'win' };
  }

  if (turnDarts.length >= 3) {
    return {
      newState: completeTurn(state, turnDarts, turnTotal),
      result: 'turn_complete',
    };
  }

  return {
    newState: { ...state, currentTurn: turnDarts },
    result: 'continue',
  };
}

function bustTurn(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const turn: Turn = {
    darts: [...state.currentTurn],
    totalScored: 0,
    busted: true,
  };

  const updatedPlayer: Player = {
    ...player,
    dartsThrown: player.dartsThrown + state.currentTurn.length + 1,
    turnHistory: [...player.turnHistory, turn],
  };

  const newPlayers = [...state.players];
  newPlayers[state.currentPlayerIndex] = updatedPlayer;

  return {
    ...state,
    players: newPlayers,
    currentTurn: [],
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function completeTurn(
  state: GameState,
  turnDarts: DartScore[],
  turnTotal: number
): GameState {
  const player = state.players[state.currentPlayerIndex];
  const turn: Turn = {
    darts: turnDarts,
    totalScored: turnTotal,
    busted: false,
  };

  const newDartsThrown = player.dartsThrown + turnDarts.length;
  const totalPointsScored = STARTING_SCORE - player.remaining + turnTotal;
  const average = newDartsThrown > 0 ? (totalPointsScored / newDartsThrown) * 3 : 0;

  const updatedPlayer: Player = {
    ...player,
    remaining: player.remaining - turnTotal,
    dartsThrown: newDartsThrown,
    turnHistory: [...player.turnHistory, turn],
    average: Math.round(average * 100) / 100,
  };

  const newPlayers = [...state.players];
  newPlayers[state.currentPlayerIndex] = updatedPlayer;

  return {
    ...state,
    players: newPlayers,
    currentTurn: [],
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function winGame(
  state: GameState,
  turnDarts: DartScore[],
  turnTotal: number
): GameState {
  const player = state.players[state.currentPlayerIndex];
  const turn: Turn = {
    darts: turnDarts,
    totalScored: turnTotal,
    busted: false,
  };

  const newDartsThrown = player.dartsThrown + turnDarts.length;
  const totalPointsScored = STARTING_SCORE;
  const average = newDartsThrown > 0 ? (totalPointsScored / newDartsThrown) * 3 : 0;

  const updatedPlayer: Player = {
    ...player,
    remaining: 0,
    dartsThrown: newDartsThrown,
    turnHistory: [...player.turnHistory, turn],
    average: Math.round(average * 100) / 100,
  };

  const newPlayers = [...state.players];
  newPlayers[state.currentPlayerIndex] = updatedPlayer;

  return {
    ...state,
    players: newPlayers,
    currentTurn: [],
    gamePhase: 'finished',
    winner: player.id,
  };
}

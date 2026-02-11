import { create } from 'zustand';
import type { DartScore, GameState, Player } from '../types/game';
import { createPlayer, throwDart, type ThrowResult } from '../services/game/GameEngine';

interface GameStore extends GameState {
  lastResult: ThrowResult | null;
  initGame: (playerNames: string[]) => void;
  addDart: (score: DartScore) => void;
  undoLastDart: () => void;
  resetGame: () => void;
  setPhase: (phase: GameState['gamePhase']) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPlayerIndex: 0,
  currentTurn: [],
  gamePhase: 'setup',
  winner: null,
  lastResult: null,

  initGame: (playerNames: string[]) => {
    const players: Player[] = playerNames.map((name, i) => createPlayer(i, name));
    set({
      players,
      currentPlayerIndex: 0,
      currentTurn: [],
      gamePhase: 'calibration',
      winner: null,
      lastResult: null,
    });
  },

  addDart: (score: DartScore) => {
    const state = get();
    if (state.gamePhase !== 'playing') return;

    const gameState: GameState = {
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      currentTurn: state.currentTurn,
      gamePhase: state.gamePhase,
      winner: state.winner,
    };

    const { newState, result } = throwDart(gameState, score);
    set({ ...newState, lastResult: result });
  },

  undoLastDart: () => {
    const state = get();
    if (state.currentTurn.length === 0) return;

    set({
      currentTurn: state.currentTurn.slice(0, -1),
    });
  },

  resetGame: () => {
    set({
      players: [],
      currentPlayerIndex: 0,
      currentTurn: [],
      gamePhase: 'setup',
      winner: null,
      lastResult: null,
    });
  },

  setPhase: (phase) => {
    set({ gamePhase: phase });
  },
}));

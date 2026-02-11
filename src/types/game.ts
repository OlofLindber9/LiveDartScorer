export interface DartScore {
  segment: number;
  multiplier:  1 | 2 | 3;
  value: number;
  label: string;
}

export interface Turn {
  darts: DartScore[];
  totalScored: number;
  busted: boolean;
}

export interface Player {
  id: number;
  name: string;
  remaining: number;
  dartsThrown: number;
  turnHistory: Turn[];
  average: number;
}

export type GamePhase = 'setup' | 'calibration' | 'playing' | 'finished';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: DartScore[];
  gamePhase: GamePhase;
  winner: number | null;
}

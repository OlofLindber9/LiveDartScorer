// Radii in mm from center (official BDO/WDF dimensions)
export const BOARD_RADII = {
  BULL: 6.35,
  OUTER_BULL: 16.0,
  TREBLE_INNER: 99.0,
  TREBLE_OUTER: 107.0,
  DOUBLE_INNER: 162.0,
  DOUBLE_OUTER: 170.0,
} as const;

// Segments in clockwise order starting from top (12 o'clock = 20)
export const SEGMENT_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
  3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

export const SEGMENT_ARC_DEG = 18;

// Standard dartboard colors
export const BOARD_COLORS = {
  BLACK: '#1a1a1a',
  WHITE: '#f5f0e1',
  RED: '#e53935',
  GREEN: '#2e7d32',
} as const;

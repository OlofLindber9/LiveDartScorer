import { BOARD_RADII, SEGMENT_ORDER, SEGMENT_ARC_DEG } from '../../constants/dartboard';
import type { DartScore } from '../../types/game';

export function calculateScore(x: number, y: number): DartScore {
  const distance = Math.sqrt(x  * x + y * y);

  if (distance <= BOARD_RADII.BULL) {
    return { segment: 25, multiplier: 2, value: 50, label: 'BULL' };
  }
  if (distance <= BOARD_RADII.OUTER_BULL) {
    return { segment: 25, multiplier: 1, value: 25, label: '25' };
  }
  if (distance > BOARD_RADII.DOUBLE_OUTER) {
    return { segment: 0, multiplier: 1, value: 0, label: 'MISS' };
  }

  // Angle: 0 = top (12 o'clock), increases clockwise
  let angleDeg = (Math.atan2(x, -y) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;

  const segmentIndex = Math.floor(((angleDeg + 9) % 360) / SEGMENT_ARC_DEG);
  const segment = SEGMENT_ORDER[segmentIndex];

  let multiplier: 1 | 2 | 3 = 1;
  if (distance >= BOARD_RADII.TREBLE_INNER && distance <= BOARD_RADII.TREBLE_OUTER) {
    multiplier = 3;
  } else if (distance >= BOARD_RADII.DOUBLE_INNER && distance <= BOARD_RADII.DOUBLE_OUTER) {
    multiplier = 2;
  }

  const value = segment * multiplier;
  const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
  return { segment, multiplier, value, label: `${prefix}${segment}` };
}

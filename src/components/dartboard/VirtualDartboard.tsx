import { useCallback } from 'react';
import { BOARD_RADII, SEGMENT_ORDER, BOARD_COLORS } from '../../constants/dartboard';
import { calculateScore } from '../../services/vision/ScoreCalculator';
import type { DartScore } from '../../types/game';

interface Props {
  onDartPlaced: (score: DartScore) => void;
  placedDarts?: DartScore[];
}

const SVG_SCALE = 2;  // Scale up radii for better SVG resolution
const OUTER_R = BOARD_RADII.DOUBLE_OUTER * SVG_SCALE;
const VIEW_SIZE = OUTER_R + 44;

function polarToCartesian(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

function arcPath(
  startAngle: number,
  endAngle: number,
  innerR: number,
  outerR: number
): string {
  const [sx1, sy1] = polarToCartesian(startAngle, outerR);
  const [sx2, sy2] = polarToCartesian(endAngle, outerR);
  const [sx3, sy3] = polarToCartesian(endAngle, innerR);
  const [sx4, sy4] = polarToCartesian(startAngle, innerR);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${sx1} ${sy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${sx2} ${sy2}`,
    `L ${sx3} ${sy3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${sx4} ${sy4}`,
    'Z',
  ].join(' ');
}

function getSegmentColor(index: number, ring: 'single' | 'double' | 'treble'): string {
  const isEvenSegment = index % 2 === 0;
  if (ring === 'double' || ring === 'treble') {
    return isEvenSegment ? BOARD_COLORS.RED : BOARD_COLORS.GREEN;
  }
  return isEvenSegment ? BOARD_COLORS.BLACK : BOARD_COLORS.WHITE;
}

export function VirtualDartboard({ onDartPlaced, placedDarts = [] }: Props) {
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = (VIEW_SIZE * 2) / rect.width;
      const scaleY = (VIEW_SIZE * 2) / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX - VIEW_SIZE;
      const svgY = (e.clientY - rect.top) * scaleY - VIEW_SIZE;

      // Convert from SVG coords back to board mm
      const boardX = svgX / SVG_SCALE;
      const boardY = svgY / SVG_SCALE;
      const score = calculateScore(boardX, boardY);
      onDartPlaced(score);
    },
    [onDartPlaced]
  );

  const segments: React.ReactNode[] = [];

  for (let i = 0; i < 20; i++) {
    const startAngle = i * 18 - 9;
    const endAngle = startAngle + 18;
    const num = SEGMENT_ORDER[i];

    // Double ring
    segments.push(
      <path
        key={`d-${i}`}
        d={arcPath(startAngle, endAngle, BOARD_RADII.DOUBLE_INNER * SVG_SCALE, BOARD_RADII.DOUBLE_OUTER * SVG_SCALE)}
        fill={getSegmentColor(i, 'double')}
        stroke="#333"
        strokeWidth={0.5}
      />
    );

    // Outer single
    segments.push(
      <path
        key={`os-${i}`}
        d={arcPath(startAngle, endAngle, BOARD_RADII.TREBLE_OUTER * SVG_SCALE, BOARD_RADII.DOUBLE_INNER * SVG_SCALE)}
        fill={getSegmentColor(i, 'single')}
        stroke="#333"
        strokeWidth={0.5}
      />
    );

    // Treble ring
    segments.push(
      <path
        key={`t-${i}`}
        d={arcPath(startAngle, endAngle, BOARD_RADII.TREBLE_INNER * SVG_SCALE, BOARD_RADII.TREBLE_OUTER * SVG_SCALE)}
        fill={getSegmentColor(i, 'treble')}
        stroke="#333"
        strokeWidth={0.5}
      />
    );

    // Inner single
    segments.push(
      <path
        key={`is-${i}`}
        d={arcPath(startAngle, endAngle, BOARD_RADII.OUTER_BULL * SVG_SCALE, BOARD_RADII.TREBLE_INNER * SVG_SCALE)}
        fill={getSegmentColor(i, 'single')}
        stroke="#333"
        strokeWidth={0.5}
      />
    );

    // Number labels
    const labelR = (BOARD_RADII.DOUBLE_OUTER + 14) * SVG_SCALE;
    const labelAngle = i * 18;
    const [lx, ly] = polarToCartesian(labelAngle, labelR);
    segments.push(
      <text
        key={`label-${i}`}
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fill={BOARD_COLORS.WHITE}
        fontSize={24}
        fontWeight={800}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {num}
      </text>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '500px', aspectRatio: '1' }}>
      <svg
        viewBox={`${-VIEW_SIZE} ${-VIEW_SIZE} ${VIEW_SIZE * 2} ${VIEW_SIZE * 2}`}
        style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
        onClick={handleClick}
      >
        {/* Board background */}
        <circle r={BOARD_RADII.DOUBLE_OUTER * SVG_SCALE} fill="#1c1814" />

        {segments}

        {/* Outer bull */}
        <circle
          r={BOARD_RADII.OUTER_BULL * SVG_SCALE}
          fill={BOARD_COLORS.GREEN}
          stroke="#333"
          strokeWidth={0.5}
        />

        {/* Inner bull */}
        <circle
          r={BOARD_RADII.BULL * SVG_SCALE}
          fill={BOARD_COLORS.RED}
          stroke="#333"
          strokeWidth={0.5}
        />

        {/* Placed dart markers */}
        {placedDarts.map((dart, i) => {
          // Show a small marker at approximate position
          // For visual feedback — position is approximate from score
          return (
            <circle
              key={`dart-${i}`}
              cx={0}
              cy={0}
              r={4}
              fill="#d4982a"
              stroke="#0d0b08"
              strokeWidth={1}
              style={{ pointerEvents: 'none' }}
              transform={getDartTransform(dart, i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

function getDartTransform(dart: DartScore, index: number): string {
  if (dart.value === 0) return `translate(${180 + index * 15}, 0)`;

  if (dart.segment === 25) {
    const r = dart.multiplier === 2 ? 0 : BOARD_RADII.OUTER_BULL * 0.6 * SVG_SCALE;
    const angle = index * 120;
    const [x, y] = polarToCartesian(angle, r);
    return `translate(${x}, ${y})`;
  }

  const segIndex = SEGMENT_ORDER.indexOf(dart.segment as typeof SEGMENT_ORDER[number]);
  const angle = segIndex * 18;

  let r: number;
  if (dart.multiplier === 3) {
    r = ((BOARD_RADII.TREBLE_INNER + BOARD_RADII.TREBLE_OUTER) / 2) * SVG_SCALE;
  } else if (dart.multiplier === 2) {
    r = ((BOARD_RADII.DOUBLE_INNER + BOARD_RADII.DOUBLE_OUTER) / 2) * SVG_SCALE;
  } else {
    r = ((BOARD_RADII.TREBLE_OUTER + BOARD_RADII.DOUBLE_INNER) / 2) * SVG_SCALE;
  }

  const [x, y] = polarToCartesian(angle, r);
  return `translate(${x}, ${y})`;
}

import { useState } from 'react';
import type { DartScore } from '../../types/game';

interface Props {
  onScore: (score: DartScore) => void;
}

const MULTIPLIERS = [
  { label: 'S', mult: 1 as const },
  { label: 'D', mult: 2 as const },
  { label: 'T', mult: 3 as const },
];

const NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export function QuickInput({ onScore }: Props) {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [expanded, setExpanded] = useState(false);

  const handleNumber = (num: number) => {
    const value = num * multiplier;
    const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
    onScore({
      segment: num,
      multiplier,
      value,
      label: `${prefix}${num}`,
    });
    setMultiplier(1);
  };

  const handleBull = (inner: boolean) => {
    onScore({
      segment: 25,
      multiplier: inner ? 2 : 1,
      value: inner ? 50 : 25,
      label: inner ? 'BULL' : '25',
    });
  };

  const handleMiss = () => {
    onScore({
      segment: 0,
      multiplier: 1,
      value: 0,
      label: 'MISS',
    });
  };

  if (!expanded) {
    return (
      <button
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: '0.85rem' }}
        onClick={() => setExpanded(true)}
      >
        Number Pad Input
      </button>
    );
  }

  const btnStyle: React.CSSProperties = {
    minWidth: '44px',
    minHeight: '44px',
    padding: '8px',
    borderRadius: 'var(--radius)',
    fontWeight: 600,
    fontSize: '0.9rem',
  };

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quick Input</span>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          onClick={() => setExpanded(false)}
        >
          Close
        </button>
      </div>

      {/* Multiplier selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {MULTIPLIERS.map(({ label, mult }) => (
          <button
            key={label}
            className={`btn ${multiplier === mult ? 'btn-primary' : 'btn-secondary'}`}
            style={{ ...btnStyle, flex: 1 }}
            onClick={() => setMultiplier(mult)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Number grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
        marginBottom: '8px',
      }}>
        {NUMBERS.map((num) => (
          <button
            key={num}
            className="btn btn-secondary"
            style={btnStyle}
            onClick={() => handleNumber(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Special buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          className="btn btn-secondary"
          style={{ ...btnStyle, flex: 1, background: 'var(--success)', color: 'white' }}
          onClick={() => handleBull(false)}
        >
          25
        </button>
        <button
          className="btn btn-secondary"
          style={{ ...btnStyle, flex: 1, background: 'var(--danger)', color: 'white' }}
          onClick={() => handleBull(true)}
        >
          BULL
        </button>
        <button
          className="btn btn-secondary"
          style={{ ...btnStyle, flex: 1 }}
          onClick={handleMiss}
        >
          MISS
        </button>
      </div>
    </div>
  );
}

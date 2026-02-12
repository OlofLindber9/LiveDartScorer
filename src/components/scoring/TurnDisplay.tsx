import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function TurnDisplay() {
  const currentTurn  = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const lastResult = useGameStore((s) => s.lastResult);
  const undoLastDart = useGameStore((s) => s.undoLastDart);
  const [showBust, setShowBust] = useState(false);

  // Show bust message briefly when it happens
  useEffect(() => {
    if (lastResult === 'bust') {
      setShowBust(true);
      const timer = setTimeout(() => setShowBust(false), 2000);
      return () => clearTimeout(timer);
    }
    setShowBust(false);
  }, [lastResult, currentPlayerIndex]);

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  const turnTotal = currentTurn.reduce((sum, d) => sum + d.value, 0);
  const dartsLeft = 3 - currentTurn.length;

  // Show last completed turn for context
  const lastTurn = currentPlayer.turnHistory[currentPlayer.turnHistory.length - 1];

  return (
    <div className="card">
      {showBust && (
        <div style={{
          padding: '8px',
          marginBottom: '10px',
          borderRadius: 'var(--radius)',
          background: 'rgba(192, 57, 43, 0.2)',
          color: 'var(--danger)',
          fontWeight: 700,
          textAlign: 'center',
        }}>
          BUST! Score reverted.
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {currentPlayer.name}'s Turn
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {dartsLeft} dart{dartsLeft !== 1 ? 's' : ''} left
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {[0, 1, 2].map((i) => {
          const dart = currentTurn[i];
          return (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius)',
                background: dart ? 'var(--bg-secondary)' : 'transparent',
                border: `1px solid ${dart ? 'var(--accent)' : 'var(--border)'}`,
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: 600,
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dart ? dart.label : '—'}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Turn total: </span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--accent)' }}>{turnTotal}</span>
        </div>

        {currentTurn.length > 0 && (
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={undoLastDart}
          >
            Undo
          </button>
        )}
      </div>

      {lastTurn && currentTurn.length === 0 && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          Last turn: {lastTurn.busted
            ? 'Bust'
            : lastTurn.darts.map((d) => d.label).join(', ') + ` (${lastTurn.totalScored})`
          }
        </div>
      )}
    </div>
  );
}

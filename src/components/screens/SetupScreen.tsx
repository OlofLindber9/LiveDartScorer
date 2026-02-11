import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function SetupScreen() {
  const [playerCount, setPlayerCount] =  useState(1);
  const [names, setNames] = useState(['Player 1', 'Player 2']);
  const initGame = useGameStore((s) => s.initGame);

  const handleStart = () => {
    const playerNames = names.slice(0, playerCount).map((n) => n.trim() || `Player ${names.indexOf(n) + 1}`);
    initGame(playerNames);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '20px',
      gap: '32px',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Dart Scorer</h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
        501 — Double Out
      </p>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Players
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2].map((n) => (
              <button
                key={n}
                className={`btn ${playerCount === n ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setPlayerCount(n)}
              >
                {n} Player{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {Array.from({ length: playerCount }).map((_, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <label
              htmlFor={`player-${i}`}
              style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}
            >
              Player {i + 1} Name
            </label>
            <input
              id={`player-${i}`}
              type="text"
              value={names[i]}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={`Player ${i + 1}`}
            />
          </div>
        ))}

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '8px' }}
          onClick={handleStart}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

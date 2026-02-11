import { useGameStore } from '../../store/gameStore';

export function ResultScreen() {
  const players = useGameStore((s) => s.players);
  const winner = useGameStore((s) => s.winner);
  const resetGame = useGameStore((s) => s.resetGame);

  const winnerPlayer = players.find((p) =>  p.id === winner);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '20px',
      gap: '24px',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Game Over</h1>

      {winnerPlayer && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}>
            Winner
          </div>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--success)',
          }}>
            {winnerPlayer.name}
          </div>
        </div>
      )}

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          Statistics
        </h2>
        {players.map((player) => (
          <div key={player.id} style={{
            padding: '12px',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-secondary)',
            marginBottom: '8px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>{player.name}</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              fontSize: '0.85rem',
            }}>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Average</div>
                <div style={{ fontWeight: 600 }}>{player.average || '—'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Darts</div>
                <div style={{ fontWeight: 600 }}>{player.dartsThrown}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Turns</div>
                <div style={{ fontWeight: 600 }}>{player.turnHistory.length}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={resetGame}
      >
        New Game
      </button>
    </div>
  );
}

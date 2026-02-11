import { useGameStore } from '../../store/gameStore';

export function Scoreboard() {
  const players  = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);

  return (
    <div className="card">
      <div style={{
        display: 'grid',
        gridTemplateColumns: players.length === 2 ? '1fr 1fr' : '1fr',
        gap: '12px',
      }}>
        {players.map((player, i) => (
          <div
            key={player.id}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius)',
              background: i === currentPlayerIndex ? 'rgba(29, 161, 242, 0.15)' : 'transparent',
              border: i === currentPlayerIndex ? '2px solid var(--accent)' : '2px solid transparent',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '4px',
              fontWeight: i === currentPlayerIndex ? 700 : 400,
            }}>
              {player.name}
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: '8px',
            }}>
              {player.remaining}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}>
              <span>Avg: {player.average || '—'}</span>
              <span>Darts: {player.dartsThrown}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

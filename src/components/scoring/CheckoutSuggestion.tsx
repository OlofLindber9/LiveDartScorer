import { useGameStore } from '../../store/gameStore';
import { getCheckoutSuggestion } from '../../services/game/CheckoutEngine';

export function CheckoutSuggestion() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const currentTurn = useGameStore((s) => s.currentTurn);

  const player = players[currentPlayerIndex];
  if (!player) return null;

  const turnScored = currentTurn.reduce((sum, d) => sum + d.value, 0);
  const remaining = player.remaining - turnScored;
  const suggestion = getCheckoutSuggestion(remaining);

  if (!suggestion) return null;

  return (
    <div className="card" style={{
      borderColor: suggestion.isCheckout ? 'var(--success)' : 'var(--warning)',
    }}>
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginBottom: '6px',
      }}>
        Checkout
      </div>
      {suggestion.isCheckout ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {suggestion.route.map((dart, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-secondary)',
                fontWeight: 700,
                fontSize: '1rem',
              }}>
                {dart}
              </span>
              {i < suggestion.route.length - 1 && (
                <span style={{ color: 'var(--text-secondary)' }}>&rarr;</span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
          No checkout possible — score down first
        </div>
      )}
    </div>
  );
}

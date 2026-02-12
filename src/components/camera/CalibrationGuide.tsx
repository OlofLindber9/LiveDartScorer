import { useVisionStore } from '../../store/visionStore';

export function CalibrationGuide() {
  const confidence  = useVisionStore((s) => s.confidence);
  const calibration = useVisionStore((s) => s.calibration);

  return (
    <div style={{
      padding: '12px',
      borderRadius: 'var(--radius)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      textAlign: 'center',
    }}>
      {!calibration ? (
        <p>Point your camera at the dartboard and hold steady...</p>
      ) : confidence < 0.6 ? (
        <p style={{ color: 'var(--warning)' }}>
          Board partially detected — try adjusting angle or lighting
        </p>
      ) : (
        <p style={{ color: 'var(--success)' }}>
          Board detected! Confidence: {Math.round(confidence * 100)}%
        </p>
      )}
    </div>
  );
}

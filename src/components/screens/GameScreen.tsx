import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useVisionStore } from '../../store/visionStore';
import { VirtualDartboard } from '../dartboard/VirtualDartboard';
import { CameraView } from '../camera/CameraView';
import { Scoreboard } from '../scoring/Scoreboard';
import { TurnDisplay } from '../scoring/TurnDisplay';
import { CheckoutSuggestion } from '../scoring/CheckoutSuggestion';
import { QuickInput } from '../scoring/QuickInput';
import type { VisionPipeline } from '../../services/vision/VisionPipeline';
import type { DartScore } from '../../types/game';

interface Props {
  pipeline?: VisionPipeline | null;
}

export function GameScreen({ pipeline }: Props) {
  const addDart = useGameStore((s) => s.addDart);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const needsFallback = useVisionStore((s) => s.needsFallback);
  const [useManual, setUseManual] = useState(!pipeline);
  const [pendingScore, setPendingScore] = useState<DartScore | null>(null);
  const lastDartCountRef = useRef(0);

  const handleDartPlaced = useCallback(
    (score: DartScore) => {
      addDart(score);
    },
    [addDart]
  );

  const handleFrame = useCallback(
    (imageData: ImageData) => {
      if (!pipeline || useManual) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cv = (window as any).Module;
      if (!cv) return;

      const mat = cv.matFromImageData(imageData);
      const result = pipeline.processFrame(mat);
      mat.delete();

      if (result.needsFallback) return;

      if (
        result.scores.length > lastDartCountRef.current &&
        result.scores.length > 0
      ) {
        const newScore = result.scores[result.scores.length - 1];
        setPendingScore(newScore);
      }
    },
    [pipeline, useManual]
  );

  const confirmDetected = () => {
    if (pendingScore) {
      addDart(pendingScore);
      lastDartCountRef.current++;
      setPendingScore(null);
    }
  };

  const rejectDetected = () => {
    setPendingScore(null);
  };

  const resetReference = () => {
    lastDartCountRef.current = 0;
  };

  const showCamera = pipeline && !useManual && !needsFallback;

  return (
    <div className="game-layout">
      <div className="game-board-panel">
        {showCamera ? (
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <CameraView active onFrame={handleFrame} />

            {pendingScore && (
              <div
                className="card"
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  Detected: <strong>{pendingScore.label}</strong> (
                  {pendingScore.value} pts)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px' }}
                    onClick={confirmDetected}
                  >
                    Confirm
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px' }}
                    onClick={rejectDetected}
                  >
                    Wrong
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
                justifyContent: 'center',
              }}
            >
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setUseManual(true)}
              >
                Switch to Manual
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={resetReference}
              >
                Darts Removed
              </button>
            </div>
          </div>
        ) : (
          <div>
            <VirtualDartboard
              onDartPlaced={handleDartPlaced}
              placedDarts={currentTurn}
            />
            {pipeline && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => setUseManual(false)}
                >
                  Switch to Camera
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="game-info-panel">
        <Scoreboard />
        <TurnDisplay />
        <CheckoutSuggestion />
        <QuickInput onScore={handleDartPlaced} />
      </div>
    </div>
  );
}

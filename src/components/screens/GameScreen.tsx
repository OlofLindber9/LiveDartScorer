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
  videoFile?: File;
}

export function GameScreen({ pipeline, videoFile }: Props) {
  const addDart  = useGameStore((s) => s.addDart);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const needsFallback = useVisionStore((s) => s.needsFallback);
  const confidence = useVisionStore((s) => s.confidence);
  const calibration = useVisionStore((s) => s.calibration);
  const setCalibration = useVisionStore((s) => s.setCalibration);
  const [useManual, setUseManual] = useState(!pipeline);
  const [pendingScore, setPendingScore] = useState<DartScore | null>(null);
  const [debugInfo, setDebugInfo] = useState({ dartsDetected: 0, framesProcessed: 0 });
  const lastDartCountRef = useRef(0);
  const shouldResetRef = useRef(false);
  const frameCountRef = useRef(0);

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

      // Auto-calibrate from first frame if no calibration exists yet
      if (!pipeline.getCalibration()) {
        const cal = pipeline.calibrate(mat);
        setCalibration(cal);
        frameCountRef.current++;
        setDebugInfo((prev) => ({ ...prev, framesProcessed: frameCountRef.current }));
        mat.delete();
        return;
      }

      // Update reference frame when user signals darts were removed
      if (shouldResetRef.current) {
        pipeline.updateReference(mat);
        shouldResetRef.current = false;
        lastDartCountRef.current = 0;
        setPendingScore(null);
        mat.delete();
        return;
      }

      const result = pipeline.processFrame(mat);
      mat.delete();

      frameCountRef.current++;
      setDebugInfo({ framesProcessed: frameCountRef.current, dartsDetected: result.darts.length });

      if (result.needsFallback) return;

      if (
        result.scores.length > lastDartCountRef.current &&
        result.scores.length > 0
      ) {
        const newScore = result.scores[result.scores.length - 1];
        setPendingScore(newScore);
      }
    },
    [pipeline, useManual, setCalibration]
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
    shouldResetRef.current = true;
  };

  const showCamera = (pipeline && !useManual && !needsFallback) || (videoFile && !useManual);

  return (
    <div className="game-layout">
      <div className="game-board-panel">
        {showCamera ? (
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <CameraView active onFrame={handleFrame} videoFile={videoFile} />

            <div style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: 'var(--radius)',
              background: 'rgba(0,0,0,0.7)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#aaa',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Calibration:</span>
                <span style={{ color: calibration ? (confidence >= 0.6 ? '#2e7d32' : '#ff9800') : '#e53935' }}>
                  {calibration ? `${Math.round(confidence * 100)}%` : 'None'}
                </span>
              </div>
              {calibration && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Board center:</span>
                  <span>{Math.round(calibration.center.x)}, {Math.round(calibration.center.y)}</span>
                </div>
              )}
              {calibration && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Board radius:</span>
                  <span>{Math.round(calibration.outerRadius)}px ({calibration.pixelsPerMm.toFixed(1)} px/mm)</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Frames processed:</span>
                <span>{debugInfo.framesProcessed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Darts in frame:</span>
                <span>{debugInfo.dartsDetected}</span>
              </div>
            </div>

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

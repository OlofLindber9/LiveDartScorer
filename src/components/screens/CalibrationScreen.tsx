import { useCallback, useRef, useEffect, useState } from 'react';
import { CameraView } from '../camera/CameraView';
import { CalibrationGuide } from '../camera/CalibrationGuide';
import { useVisionStore } from '../../store/visionStore';
import { useGameStore } from '../../store/gameStore';
import { getOpenCV } from '../../services/vision/OpenCVLoader';
import { VisionPipeline } from '../../services/vision/VisionPipeline';

interface Props {
  onCalibrated: (pipeline: VisionPipeline, videoFile?: File) => void;
  onSkip: (videoFile?: File) => void;
}

export function CalibrationScreen({ onCalibrated, onSkip }: Props) {
  const isTestMode = window.location.pathname.endsWith('/test');
  const pipelineRef = useRef<VisionPipeline  | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const setCalibration = useVisionStore((s) => s.setCalibration);
  const setOpenCVReady = useVisionStore((s) => s.setOpenCVReady);
  const setLoading = useVisionStore((s) => s.setLoading);
  const isOpenCVReady = useVisionStore((s) => s.isOpenCVReady);
  const isLoading = useVisionStore((s) => s.isLoading);
  const calibration = useVisionStore((s) => s.calibration);
  const confidence = useVisionStore((s) => s.confidence);
  const error = useVisionStore((s) => s.error);
  const setError = useVisionStore((s) => s.setError);
  const gamePhase = useGameStore((s) => s.gamePhase);

  // Load OpenCV on mount
  useEffect(() => {
    if (isOpenCVReady || isLoading) return;
    setLoading(true);
    getOpenCV()
      .then((cv) => {
        pipelineRef.current = new VisionPipeline(cv);
        setOpenCVReady(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load OpenCV');
        setLoading(false);
      });
  }, [isOpenCVReady, isLoading, setOpenCVReady, setLoading, setError]);

  const handleFrame = useCallback(
    (imageData: ImageData) => {
      if (!pipelineRef.current || !isOpenCVReady) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cv = (window as any).Module;
      if (!cv) return;

      const mat = cv.matFromImageData(imageData);
      const result = pipelineRef.current.calibrate(mat);
      setCalibration(result);
      mat.delete();
    },
    [isOpenCVReady, setCalibration]
  );

  const handleConfirm = () => {
    if (pipelineRef.current) {
      onCalibrated(pipelineRef.current, videoFile ?? undefined);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
  };

  if (gamePhase !== 'calibration') return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '20px',
      gap: '16px',
    }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>Calibrate Camera</h2>

      {isLoading && (
        <p style={{ color: 'var(--text-secondary)' }}>Loading OpenCV...</p>
      )}

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: 'var(--radius)',
          background: 'rgba(192, 57, 43, 0.2)',
          color: 'var(--danger)',
          textAlign: 'center',
          width: '100%',
          maxWidth: '500px',
        }}>
          {error}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '500px' }}>
        <CameraView active={isOpenCVReady || !!videoFile} onFrame={handleFrame} videoFile={videoFile ?? undefined} />
      </div>

      <CalibrationGuide />

      {isTestMode && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          padding: '12px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Or upload a video file for testing
          </label>
          <input
            type="file"
            accept="video/mp4,video/*"
            onChange={handleFileChange}
            style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}
          />
          {videoFile && (
            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)' }}>
              Loaded: {videoFile.name}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {calibration && confidence >= 0.6 && (
          <button className="btn btn-primary btn-lg" onClick={handleConfirm}>
            {videoFile ? 'Start with Video' : 'Start with Camera'}
          </button>
        )}
        {videoFile && !(calibration && confidence >= 0.6) && pipelineRef.current && (
          <button className="btn btn-primary btn-lg" onClick={handleConfirm}>
            Start with Video
          </button>
        )}
        {videoFile && !(calibration && confidence >= 0.6) && !pipelineRef.current && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Waiting for OpenCV to load...
          </p>
        )}
        <button className="btn btn-secondary btn-lg" onClick={() => onSkip()}>
          Skip — Use Manual Input
        </button>
      </div>
    </div>
  );
}

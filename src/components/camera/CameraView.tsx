import { useRef, useEffect, useCallback, useState } from 'react';
import { CameraService } from '../../services/camera/CameraService';
import { useVisionStore } from '../../store/visionStore';

interface Props {
  onFrame?: (imageData: ImageData) => void;
  active: boolean;
}

export function CameraView({ onFrame, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<CameraService | null>(null);
  const animFrameRef = useRef<number>(0);
  const [started, setStarted] = useState(false);
  const setCameraActive = useVisionStore((s) => s.setCameraActive);
  const setError = useVisionStore((s) => s.setError);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || started) return;
    try {
      const camera = new CameraService();
      await camera.start(videoRef.current);
      cameraRef.current = camera;
      setCameraActive(true);
      setStarted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to access camera'
      );
    }
  }, [setCameraActive, setError, started]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setCameraActive(false);
    setStarted(false);
  }, [setCameraActive]);

  // Start/stop based on active prop
  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  // Frame capture loop (throttled to ~10fps)
  useEffect(() => {
    if (!started || !onFrame) return;

    let lastCapture = 0;
    const FPS_INTERVAL = 100; // ~10fps

    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastCapture < FPS_INTERVAL) return;
      lastCapture = now;

      if (videoRef.current && canvasRef.current && cameraRef.current) {
        const imageData = cameraRef.current.captureFrame(
          videoRef.current,
          canvasRef.current
        );
        if (imageData) {
          onFrame(imageData);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [started, onFrame]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'var(--radius)',
          background: '#000',
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

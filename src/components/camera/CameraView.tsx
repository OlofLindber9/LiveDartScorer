import { useRef, useEffect, useState } from 'react';
import { CameraService } from '../../services/camera/CameraService';
import { useVisionStore } from '../../store/visionStore';

interface Props {
  onFrame?: (imageData: ImageData) => void;
  active: boolean;
  videoFile?: File;
}

export function CameraView({ onFrame, active, videoFile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<CameraService | null>(null);
  const animFrameRef = useRef<number>(0);
  const objectUrlRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const setCameraActive = useVisionStore((s) => s.setCameraActive);
  const setError = useVisionStore((s) => s.setError);

  // Start/stop based on active prop and videoFile
  useEffect(() => {
    if (!active || !videoRef.current) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      if (startedRef.current) return;

      if (videoFile) {
        try {
          const url = URL.createObjectURL(videoFile);
          objectUrlRef.current = url;
          if (!videoRef.current || cancelled) return;
          videoRef.current.src = url;
          videoRef.current.loop = true;
          await videoRef.current.play();
          if (cancelled) return;
          startedRef.current = true;
          setCameraActive(true);
          setReady(true);
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : 'Failed to load video file'
            );
          }
        }
      } else {
        try {
          const camera = new CameraService();
          await camera.start(videoRef.current!);
          if (cancelled) return;
          cameraRef.current = camera;
          startedRef.current = true;
          setCameraActive(true);
          setReady(true);
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : 'Failed to access camera'
            );
          }
        }
      }
    };

    start();

    return () => {
      cancelled = true;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      startedRef.current = false;
      setCameraActive(false);
      setReady(false);
    };
  }, [active, videoFile, setCameraActive, setError]);

  // Frame capture loop (throttled to ~10fps)
  useEffect(() => {
    if (!ready || !onFrame) return;

    let lastCapture = 0;
    const FPS_INTERVAL = 100; // ~10fps

    const captureFrame = (): ImageData | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };

    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastCapture < FPS_INTERVAL) return;
      lastCapture = now;

      const imageData = captureFrame();
      if (imageData) {
        onFrame(imageData);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [ready, onFrame]);

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

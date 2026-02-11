import { create } from 'zustand';
import type { BoardCalibration, DetectedDart } from '../types/vision';

interface VisionStore {
  isOpenCVReady:  boolean;
  isLoading: boolean;
  calibration: BoardCalibration | null;
  detectedDarts: DetectedDart[];
  confidence: number;
  needsFallback: boolean;
  cameraActive: boolean;
  error: string | null;

  setOpenCVReady: (ready: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCalibration: (cal: BoardCalibration | null) => void;
  setDetectedDarts: (darts: DetectedDart[]) => void;
  setNeedsFallback: (fallback: boolean) => void;
  setCameraActive: (active: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVisionStore = create<VisionStore>((set) => ({
  isOpenCVReady: false,
  isLoading: false,
  calibration: null,
  detectedDarts: [],
  confidence: 0,
  needsFallback: false,
  cameraActive: false,
  error: null,

  setOpenCVReady: (ready) => set({ isOpenCVReady: ready }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCalibration: (cal) =>
    set({
      calibration: cal,
      confidence: cal?.confidence ?? 0,
      needsFallback: !cal || cal.confidence < 0.6,
    }),
  setDetectedDarts: (darts) => set({ detectedDarts: darts }),
  setNeedsFallback: (fallback) => set({ needsFallback: fallback }),
  setCameraActive: (active) => set({ cameraActive: active }),
  setError: (error) => set({ error }),
}));

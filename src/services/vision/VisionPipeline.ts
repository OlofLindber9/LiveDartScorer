/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardDetector } from './BoardDetector';
import { DartDetector } from './DartDetector';
import { calculateScore } from './ScoreCalculator';
import type { BoardCalibration, DetectedDart } from '../../types/vision';
import type { DartScore } from '../../types/game';

export const CONFIDENCE_THRESHOLD = 0.6;

export class VisionPipeline {
  private boardDetector:  BoardDetector;
  private dartDetector: DartDetector;
  private calibration: BoardCalibration | null = null;

  constructor(cv: any) {
    this.boardDetector = new BoardDetector(cv);
    this.dartDetector = new DartDetector(cv);
  }

  calibrate(frame: any): BoardCalibration | null {
    this.calibration = this.boardDetector.detectBoard(frame);
    if (
      this.calibration &&
      this.calibration.confidence > CONFIDENCE_THRESHOLD
    ) {
      this.dartDetector.setReferenceFrame(frame);
    }
    return this.calibration;
  }

  processFrame(frame: any): {
    darts: DetectedDart[];
    scores: DartScore[];
    needsFallback: boolean;
  } {
    if (!this.calibration) {
      return { darts: [], scores: [], needsFallback: true };
    }

    const darts = this.dartDetector.detectDarts(frame, this.calibration);

    const avgConfidence =
      darts.length > 0
        ? darts.reduce((sum, d) => sum + d.confidence, 0) / darts.length
        : 0;

    const needsFallback = avgConfidence < CONFIDENCE_THRESHOLD;
    const scores = darts.map((d) => calculateScore(d.boardX, d.boardY));

    return { darts, scores, needsFallback };
  }

  updateReference(frame: any): void {
    this.dartDetector.setReferenceFrame(frame);
  }

  getCalibration(): BoardCalibration | null {
    return this.calibration;
  }

  dispose(): void {
    this.dartDetector.dispose();
  }
}

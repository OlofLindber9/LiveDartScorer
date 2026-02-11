/* eslint-disable @typescript-eslint/no-explicit-any */
import { BOARD_RADII } from '../../constants/dartboard';
import type { BoardCalibration } from '../../types/vision';

export class BoardDetector {
  private cv: any;

  constructor(cv: any) {
    this.cv = cv;
  }

  detectBoard(frame: any): BoardCalibration | null {
    const cv = this.cv;
    const gray = new cv.Mat();
    cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);

    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2, 2);

    const circles = new cv.Mat();
    cv.HoughCircles(
      blurred,
      circles,
      cv.HOUGH_GRADIENT,
      1,
      Math.floor(frame.rows / 8),
      100,
      40,
      10,
      0
    );

    if (circles.cols === 0) {
      gray.delete();
      blurred.delete();
      circles.delete();
      return null;
    }

    const detected: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i < circles.cols; i++) {
      detected.push({
        x: circles.data32F[i * 3],
        y: circles.data32F[i * 3 + 1],
        r: circles.data32F[i * 3 + 2],
      });
    }
    detected.sort((a, b) => a.r - b.r);

    // Find concentric circles (centers close together)
    const candidateCenter = detected[0];
    const concentricThreshold = candidateCenter.r * 0.5;
    const concentric = detected.filter(
      (c) =>
        Math.hypot(c.x - candidateCenter.x, c.y - candidateCenter.y) <
        concentricThreshold
    );

    gray.delete();
    blurred.delete();
    circles.delete();

    if (concentric.length < 2) return null;

    const bullseye = concentric[0];
    const outerRing = concentric[concentric.length - 1];
    const pixelsPerMm = outerRing.r / BOARD_RADII.DOUBLE_OUTER;

    const confidence = this.assessConfidence(concentric, frame);

    return {
      center: { x: bullseye.x, y: bullseye.y },
      outerRadius: outerRing.r,
      pixelsPerMm,
      confidence,
    };
  }

  private assessConfidence(
    concentric: Array<{ x: number; y: number; r: number }>,
    frame: any
  ): number {
    let confidence = 0;

    confidence += Math.min(concentric.length / 4, 1.0) * 0.4;

    const center = concentric[0];
    const margin = 0.1;
    const inBounds =
      center.x > frame.cols * margin &&
      center.x < frame.cols * (1 - margin) &&
      center.y > frame.rows * margin &&
      center.y < frame.rows * (1 - margin);
    if (inBounds) confidence += 0.3;

    const expectedRatio = BOARD_RADII.DOUBLE_OUTER / BOARD_RADII.BULL;
    const actualRatio =
      concentric[concentric.length - 1].r / concentric[0].r;
    const ratioError =
      Math.abs(actualRatio - expectedRatio) / expectedRatio;
    confidence += Math.max(0, 0.3 - ratioError);

    return Math.min(confidence, 1.0);
  }
}

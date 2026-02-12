/* eslint-disable @typescript-eslint/no-explicit-any */
import { BOARD_RADII } from '../../constants/dartboard';
import type { BoardCalibration } from '../../types/vision';

export interface CalibrationDebug {
  frameSize: string;
  circlesFound: number;
  allCircles: Array<{ x: number; y: number; r: number }>;
  concentricFound: number;
  concentricThreshold: number;
  failReason: string | null;
  confidenceBreakdown: {
    concentricScore: number;
    boundsScore: number;
    ratioScore: number;
    ratioError: number;
    total: number;
  } | null;
}

export class BoardDetector {
  private cv: any;
  public lastDebug: CalibrationDebug | null = null;

  constructor(cv: any) {
    this.cv  = cv;
  }

  detectBoard(frame: any): BoardCalibration | null {
    const cv = this.cv;
    const debug: CalibrationDebug = {
      frameSize: `${frame.cols}x${frame.rows}`,
      circlesFound: 0,
      allCircles: [],
      concentricFound: 0,
      concentricThreshold: 0,
      failReason: null,
      confidenceBreakdown: null,
    };

    const gray = new cv.Mat();
    cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);

    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2, 2);

    const circles = new cv.Mat();
    const minDist = Math.floor(frame.rows / 8);
    cv.HoughCircles(
      blurred,
      circles,
      cv.HOUGH_GRADIENT,
      1,
      minDist,
      100,
      40,
      10,
      0
    );

    debug.circlesFound = circles.cols;

    if (circles.cols === 0) {
      gray.delete();
      blurred.delete();
      circles.delete();
      debug.failReason = `HoughCircles found 0 circles (minDist=${minDist}, param1=100, param2=40)`;
      this.lastDebug = debug;
      return null;
    }

    const detected: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i < circles.cols; i++) {
      detected.push({
        x: Math.round(circles.data32F[i * 3]),
        y: Math.round(circles.data32F[i * 3 + 1]),
        r: Math.round(circles.data32F[i * 3 + 2]),
      });
    }
    detected.sort((a, b) => a.r - b.r);
    debug.allCircles = detected;

    // Find concentric circles: try each circle as a candidate center,
    // pick the one with the most nearby circles sharing a similar center.
    // Use a threshold based on frame size rather than smallest radius,
    // since the smallest circle may be noise.
    const concentricThreshold = Math.max(frame.cols, frame.rows) * 0.03;
    debug.concentricThreshold = Math.round(concentricThreshold);

    let concentric: typeof detected = [];
    for (const candidate of detected) {
      const group = detected.filter(
        (c) =>
          Math.hypot(c.x - candidate.x, c.y - candidate.y) <
          concentricThreshold
      );
      if (group.length > concentric.length) {
        concentric = group;
      }
    }
    concentric.sort((a, b) => a.r - b.r);
    debug.concentricFound = concentric.length;

    gray.delete();
    blurred.delete();
    circles.delete();

    if (concentric.length < 2) {
      debug.failReason = `Only ${concentric.length} concentric circle(s) found (need 2+). Threshold=${Math.round(concentricThreshold)}px`;
      this.lastDebug = debug;
      return null;
    }

    const bullseye = concentric[0];
    const outerRing = concentric[concentric.length - 1];
    const pixelsPerMm = outerRing.r / BOARD_RADII.DOUBLE_OUTER;

    const { confidence, breakdown } = this.assessConfidence(concentric, frame);
    debug.confidenceBreakdown = breakdown;
    this.lastDebug = debug;

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
  ): { confidence: number; breakdown: CalibrationDebug['confidenceBreakdown'] } {
    const concentricScore = Math.min(concentric.length / 4, 1.0) * 0.4;

    const center = concentric[0];
    const margin = 0.1;
    const inBounds =
      center.x > frame.cols * margin &&
      center.x < frame.cols * (1 - margin) &&
      center.y > frame.rows * margin &&
      center.y < frame.rows * (1 - margin);
    const boundsScore = inBounds ? 0.3 : 0;

    const expectedRatio = BOARD_RADII.DOUBLE_OUTER / BOARD_RADII.BULL;
    const actualRatio =
      concentric[concentric.length - 1].r / concentric[0].r;
    const ratioError =
      Math.abs(actualRatio - expectedRatio) / expectedRatio;
    const ratioScore = Math.max(0, 0.3 - ratioError);

    const total = Math.min(concentricScore + boundsScore + ratioScore, 1.0);

    return {
      confidence: total,
      breakdown: {
        concentricScore: Math.round(concentricScore * 100) / 100,
        boundsScore: Math.round(boundsScore * 100) / 100,
        ratioScore: Math.round(ratioScore * 100) / 100,
        ratioError: Math.round(ratioError * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
    };
  }
}

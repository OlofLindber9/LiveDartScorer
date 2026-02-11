/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BoardCalibration, DetectedDart } from '../../types/vision';

export class DartDetector {
  private cv: any;
  private referenceFrame: any = null;

  constructor(cv: any) {
    this.cv = cv;
  }

  setReferenceFrame(frame: any): void {
    if (this.referenceFrame) this.referenceFrame.delete();
    this.referenceFrame = new this.cv.Mat();
    this.cv.cvtColor(frame, this.referenceFrame, this.cv.COLOR_RGBA2GRAY);
    this.cv.GaussianBlur(
      this.referenceFrame,
      this.referenceFrame,
      new this.cv.Size(5, 5),
      0
    );
  }

  detectDarts(
    currentFrame: any,
    calibration: BoardCalibration
  ): DetectedDart[] {
    const cv = this.cv;
    if (!this.referenceFrame) return [];

    const gray = new cv.Mat();
    cv.cvtColor(currentFrame, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

    const diff = new cv.Mat();
    cv.absdiff(this.referenceFrame, gray, diff);

    const thresh = new cv.Mat();
    cv.threshold(diff, thresh, 30, 255, cv.THRESH_BINARY);

    const kernel = cv.getStructuringElement(
      cv.MORPH_ELLIPSE,
      new cv.Size(3, 3)
    );
    cv.morphologyEx(thresh, thresh, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    const darts: DetectedDart[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      if (area < 100) continue;

      const rect = cv.minAreaRect(contour);
      const w = rect.size.width;
      const h = rect.size.height;
      const aspectRatio = Math.max(w, h) / Math.min(w, h);
      if (aspectRatio < 2.0) continue;

      // Dart tip = contour point closest to board center
      let minDist = Infinity;
      let tipX = 0;
      let tipY = 0;
      for (let j = 0; j < contour.rows; j++) {
        const px = contour.data32S[j * 2];
        const py = contour.data32S[j * 2 + 1];
        const d = Math.hypot(
          px - calibration.center.x,
          py - calibration.center.y
        );
        if (d < minDist) {
          minDist = d;
          tipX = px;
          tipY = py;
        }
      }

      const boardX = (tipX - calibration.center.x) / calibration.pixelsPerMm;
      const boardY = (tipY - calibration.center.y) / calibration.pixelsPerMm;

      const confidence =
        Math.min(area / 500, 1.0) * (aspectRatio > 3 ? 1.0 : 0.7);

      darts.push({ pixelX: tipX, pixelY: tipY, boardX, boardY, confidence });
    }

    gray.delete();
    diff.delete();
    thresh.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();

    return darts;
  }

  dispose(): void {
    if (this.referenceFrame) {
      this.referenceFrame.delete();
      this.referenceFrame = null;
    }
  }
}

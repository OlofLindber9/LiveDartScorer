export interface BoardCalibration {
  center: { x: number; y: number };
  outerRadius: number;
  pixelsPerMm: number;
  confidence: number;
}

export interface DetectedDart {
  pixelX: number;
  pixelY: number;
  boardX: number;
  boardY: number;
  confidence: number;
}

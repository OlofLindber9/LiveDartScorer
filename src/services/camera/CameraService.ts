export class CameraService {
  private stream: MediaStream | null = null;

  async start(
    videoEl: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<void> {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = this.stream;
    await videoEl.play();
  }

  captureFrame(
    videoEl: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): ImageData | null {
    const ctx = canvas.getContext('2d');
    if (!ctx || videoEl.videoWidth === 0) return null;

    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  get isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}

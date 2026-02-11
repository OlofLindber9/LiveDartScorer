/* eslint-disable @typescript-eslint/no-explicit-any */

let cvInstance:  any = null;
let loadPromise: Promise<any> | null = null;

declare global {
  interface Window {
    Module: any;
    cv: any;
  }
}

export async function getOpenCV(): Promise<any> {
  if (cvInstance) return cvInstance;
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<any>((resolve, reject) => {
    window.Module = {
      onRuntimeInitialized() {
        cvInstance = window.Module;
        resolve(cvInstance);
      },
      onAbort(error: string) {
        reject(new Error('OpenCV WASM loading aborted: ' + error));
      },
    };

    const script = document.createElement('script');
    script.src = '/opencv.js';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load opencv.js'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

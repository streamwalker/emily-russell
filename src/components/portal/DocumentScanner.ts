/**
 * DocumentScanner — lazy-loads OpenCV.js from a CDN, then performs:
 *  - largest 4-point document contour detection
 *  - perspective transform to a flat rectangle (deskew + crop)
 *  - optional grayscale + adaptive threshold for a clean B&W scan
 *
 * Falls back to returning the original image if no quad is found.
 */

declare global {
  interface Window {
    cv: any;
    __opencvReady?: Promise<any>;
  }
}

const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";

export function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.cv && window.cv.Mat) return Promise.resolve(window.cv);
  if (window.__opencvReady) return window.__opencvReady;

  window.__opencvReady = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${OPENCV_URL}"]`) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = OPENCV_URL;
      script.async = true;
      document.head.appendChild(script);
    }
    const checkReady = () => {
      if (window.cv && window.cv.Mat) {
        resolve(window.cv);
        return;
      }
      // OpenCV sets `cv` then runs `onRuntimeInitialized`
      if (window.cv && typeof window.cv === "object") {
        window.cv["onRuntimeInitialized"] = () => resolve(window.cv);
        return;
      }
      setTimeout(checkReady, 100);
    };
    script.addEventListener("load", checkReady);
    script.addEventListener("error", () => reject(new Error("OpenCV failed to load")));
    if (existing) checkReady();
    setTimeout(() => {
      if (!window.cv?.Mat) reject(new Error("OpenCV load timeout"));
    }, 30000);
  });
  return window.__opencvReady;
}

export interface ScanOptions {
  /** Apply adaptive threshold to produce a clean black-and-white scan. */
  blackAndWhite?: boolean;
  /** Max output dimension in pixels. Defaults to 1700 for ~200dpi letter. */
  maxDimension?: number;
}

/**
 * Loads an image source into a canvas at native size.
 */
async function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
    return img;
  } finally {
    if (typeof src !== "string") {
      // Revoke later — image is already decoded
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

function imageToCanvas(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

/**
 * Order 4 points as [top-left, top-right, bottom-right, bottom-left].
 */
function orderCorners(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  const sum = pts.map(p => p.x + p.y);
  const diff = pts.map(p => p.y - p.x);
  return [
    pts[sum.indexOf(Math.min(...sum))],     // tl
    pts[diff.indexOf(Math.min(...diff))],   // tr
    pts[sum.indexOf(Math.max(...sum))],     // br
    pts[diff.indexOf(Math.max(...diff))],   // bl
  ];
}

/**
 * Detect document quad in `srcMat` and return ordered corners, or null if none.
 */
function detectDocumentCorners(cv: any, srcMat: any): { x: number; y: number }[] | null {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edged = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edged, 75, 200);
    cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const imgArea = srcMat.rows * srcMat.cols;
    let bestQuad: { x: number; y: number }[] | null = null;
    let bestArea = imgArea * 0.15; // require contour to cover at least 15% of the image

    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const peri = cv.arcLength(c, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, 0.02 * peri, true);
      if (approx.rows === 4) {
        const area = Math.abs(cv.contourArea(approx));
        if (area > bestArea) {
          const pts: { x: number; y: number }[] = [];
          for (let r = 0; r < 4; r++) {
            pts.push({ x: approx.intAt(r, 0), y: approx.intAt(r, 1) });
          }
          bestQuad = orderCorners(pts);
          bestArea = area;
        }
      }
      approx.delete();
      c.delete();
    }
    return bestQuad;
  } finally {
    gray.delete();
    blurred.delete();
    edged.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Warp the detected quad to a flat rectangle.
 */
function warpQuad(cv: any, srcMat: any, corners: { x: number; y: number }[]): any {
  const [tl, tr, br, bl] = corners;
  const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
  const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const maxW = Math.max(widthA, widthB);
  const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
  const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
  const maxH = Math.max(heightA, heightB);

  const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
  ]);
  const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, maxW, 0, maxW, maxH, 0, maxH,
  ]);
  const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
  const dst = new cv.Mat();
  cv.warpPerspective(srcMat, dst, M, new cv.Size(maxW, maxH), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  srcCoords.delete();
  dstCoords.delete();
  M.delete();
  return dst;
}

/**
 * Convert an image (URL or Blob) into a deskewed, cropped scan returned as a JPEG Blob.
 * If document edges can't be detected, returns the original image as a JPEG.
 */
export async function scanImage(src: string | Blob, opts: ScanOptions = {}): Promise<Blob> {
  const maxDim = opts.maxDimension ?? 1700;
  const cv = await loadOpenCV();
  const img = await loadImage(src);
  const inputCanvas = imageToCanvas(img, maxDim);

  const srcMat = cv.imread(inputCanvas);
  let outMat: any = null;
  try {
    const corners = detectDocumentCorners(cv, srcMat);
    outMat = corners ? warpQuad(cv, srcMat, corners) : srcMat.clone();

    if (opts.blackAndWhite) {
      const gray = new cv.Mat();
      cv.cvtColor(outMat, gray, cv.COLOR_RGBA2GRAY);
      const bw = new cv.Mat();
      cv.adaptiveThreshold(gray, bw, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 21, 10);
      cv.cvtColor(bw, outMat, cv.COLOR_GRAY2RGBA);
      gray.delete();
      bw.delete();
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outMat.cols;
    outCanvas.height = outMat.rows;
    cv.imshow(outCanvas, outMat);
    return await new Promise<Blob>((resolve, reject) =>
      outCanvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85),
    );
  } finally {
    srcMat.delete();
    outMat?.delete();
  }
}

/**
 * Apply a manual rotation (any angle) to an image blob, returning a JPEG blob.
 */
export async function rotateImage(src: Blob, degrees: number): Promise<Blob> {
  const img = await loadImage(src);
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const newW = Math.round(w * cos + h * sin);
  const newH = Math.round(w * sin + h * cos);
  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, newW, newH);
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9),
  );
}

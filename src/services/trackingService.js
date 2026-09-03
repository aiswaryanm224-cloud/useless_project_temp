/**
 * Packet Tracking Service for AIR WORLD Scanner
 * Uses offscreen canvas frame sampling, edge/contrast detection,
 * temporal box smoothing, visual pixel measurements, and stable detection tracking.
 */

let offscreenCanvas = null;
let offscreenCtx = null;

let currentBox = null;
let stableFrameCount = 0;
const STABLE_THRESHOLD_FRAMES = 18; // ~600ms at 30fps

export function resetTracker() {
  currentBox = null;
  stableFrameCount = 0;
}

/**
 * Samples a video frame and calculates the estimated packet bounding box.
 * Returns packet tracking metrics and tracking status.
 */
export function processVideoFrame(videoElement) {
  if (!videoElement || videoElement.readyState < 2) {
    return {
      status: 'SEARCHING',
      box: null,
      measurements: null
    };
  }

  const vWidth = videoElement.videoWidth || 640;
  const vHeight = videoElement.videoHeight || 480;

  // Initialize offscreen sampling canvas (scaled down to 160x120 for fast real-time analysis)
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 160;
    offscreenCanvas.height = 120;
    offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  offscreenCtx.drawImage(videoElement, 0, 0, 160, 120);
  const imageData = offscreenCtx.getImageData(0, 0, 160, 120);
  const data = imageData.data;

  // Simple contrast / gradient edge detector in central 70% viewport
  let minX = 160, maxX = 0, minY = 120, maxY = 0;
  let edgeCount = 0;

  for (let y = 15; y < 105; y += 3) {
    for (let x = 20; x < 140; x += 3) {
      const idx = (y * 160 + x) * 4;
      const rightIdx = (y * 160 + (x + 1)) * 4;
      const downIdx = ((y + 1) * 160 + x) * 4;

      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const lumRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      const lumDown = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

      const diff = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);

      if (diff > 35) { // Edge threshold
        edgeCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const rawWidth = (maxX - minX);
  const rawHeight = (maxY - minY);

  // Check if a substantial packet region was detected
  const isDetected = edgeCount > 40 && rawWidth > 25 && rawHeight > 30;

  if (!isDetected) {
    if (stableFrameCount > 0) stableFrameCount--;
    return {
      status: currentBox ? 'LOST' : 'SEARCHING',
      box: currentBox,
      measurements: currentBox ? getPacketMeasurements(currentBox) : null
    };
  }

  // Scale back up to actual video dimensions
  const scaleX = vWidth / 160;
  const scaleY = vHeight / 120;

  const targetBox = {
    x: Math.round(minX * scaleX),
    y: Math.round(minY * scaleY),
    width: Math.round(rawWidth * scaleX),
    height: Math.round(rawHeight * scaleY)
  };

  // Temporal smoothing filter (alpha = 0.3) to prevent box jumping
  if (!currentBox) {
    currentBox = targetBox;
  } else {
    currentBox = {
      x: Math.round(currentBox.x * 0.7 + targetBox.x * 0.3),
      y: Math.round(currentBox.y * 0.7 + targetBox.y * 0.3),
      width: Math.round(currentBox.width * 0.7 + targetBox.width * 0.3),
      height: Math.round(currentBox.height * 0.7 + targetBox.height * 0.3)
    };
  }

  stableFrameCount = Math.min(STABLE_THRESHOLD_FRAMES + 5, stableFrameCount + 1);

  const status = stableFrameCount >= STABLE_THRESHOLD_FRAMES ? 'CAPTURE_READY' : 'TRACKING';

  return {
    status,
    box: currentBox,
    measurements: getPacketMeasurements(currentBox)
  };
}

/**
 * Calculates visual pixel measurements and aspect ratio.
 */
export function getPacketMeasurements(box) {
  if (!box) return null;
  const widthPx = Math.max(1, box.width);
  const heightPx = Math.max(1, box.height);
  const aspectRatio = (widthPx / heightPx).toFixed(2);

  return {
    visualWidth: widthPx,
    visualHeight: heightPx,
    aspectRatio: parseFloat(aspectRatio)
  };
}

/**
 * Packet Tracking Service for AIR WORLD Scanner
 * Uses offscreen canvas frame sampling, edge/contrast detection,
 * temporal box smoothing, visual pixel measurements, positioning guidance, and stability detection.
 */

let offscreenCanvas = null;
let offscreenCtx = null;

let currentBox = null;
let prevBox = null;
let stableFrameCount = 0;
const STABLE_THRESHOLD_FRAMES = 18; // ~600ms at 30fps

export function resetTracker() {
  currentBox = null;
  prevBox = null;
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

  // Contrast / gradient edge detector in central viewport
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
      measurements: currentBox ? getPacketMeasurements(currentBox, vWidth, vHeight) : null
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

  // Track frame-to-frame movement delta for stability detection
  prevBox = currentBox;

  // Temporal smoothing filter (alpha = 0.3)
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

  // Frame-by-frame stability calculation
  let moveDelta = 0;
  if (prevBox) {
    moveDelta = Math.abs(currentBox.x - prevBox.x) + 
                Math.abs(currentBox.y - prevBox.y) + 
                Math.abs(currentBox.width - prevBox.width);
  }

  if (moveDelta < 14) {
    stableFrameCount = Math.min(STABLE_THRESHOLD_FRAMES + 10, stableFrameCount + 1);
  } else {
    stableFrameCount = Math.max(0, stableFrameCount - 2);
  }

  const measurements = getPacketMeasurements(currentBox, vWidth, vHeight);
  const isPositionedWell = measurements?.isCentered && measurements?.isLargeEnough;

  let status = 'TRACKING';
  if (stableFrameCount >= STABLE_THRESHOLD_FRAMES && isPositionedWell) {
    status = 'CAPTURE_READY';
  }

  return {
    status,
    box: currentBox,
    measurements
  };
}

/**
 * Calculates normalized visual pixel measurements, positioning guidance, aspect ratio, and geometric air estimate.
 */
export function getPacketMeasurements(box, vWidth = 640, vHeight = 480) {
  if (!box) return null;
  const widthPx = Math.max(1, box.width);
  const heightPx = Math.max(1, box.height);

  const normalizedWidth = parseFloat((widthPx / vWidth).toFixed(2));
  const normalizedHeight = parseFloat((heightPx / vHeight).toFixed(2));
  const aspectRatio = parseFloat((widthPx / heightPx).toFixed(2));

  // Centroid relative to viewport
  const centerX = (box.x + widthPx / 2) / vWidth;
  const centerY = (box.y + heightPx / 2) / vHeight;

  const isCentered = centerX >= 0.22 && centerX <= 0.78 && centerY >= 0.18 && centerY <= 0.82;
  const isLargeEnough = normalizedWidth >= 0.18 && normalizedHeight >= 0.22;

  let guidanceHint = 'PERFECT. HOLD STILL...';
  if (!isLargeEnough) {
    guidanceHint = 'MOVE CLOSER';
  } else if (!isCentered) {
    guidanceHint = 'CENTER THE SNACK';
  }

  // Dynamic camera air metric estimate based on relative packet bounding volume fill
  const volumeRatio = normalizedWidth * normalizedHeight * 1.5;
  const cameraAirEstimate = Math.round(Math.min(92, Math.max(15, (1 - volumeRatio) * 100)));

  return {
    visualWidth: widthPx,
    visualHeight: heightPx,
    normalizedWidth,
    normalizedHeight,
    aspectRatio,
    cameraAirEstimate,
    isCentered,
    isLargeEnough,
    guidanceHint
  };
}

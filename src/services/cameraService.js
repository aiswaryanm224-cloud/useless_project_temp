/**
 * Camera Service for AIR WORLD Scanner
 * Handles browser media device camera requests with automatic fallback and stream cleanup.
 */

export async function requestCameraStream() {
  if (
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new Error('CAMERA_UNSUPPORTED');
  }

  const mapErrorToStandardError = (error) => {
    if (
      error?.name === 'NotAllowedError' ||
      error?.name === 'SecurityError' ||
      error?.name === 'PermissionDeniedError'
    ) {
      return new Error('CAMERA_DENIED');
    }
    return new Error('CAMERA_UNAVAILABLE');
  };

  // Attempt 1: Preferred environment camera (ideal constraint, never exact)
  console.log('[AIR WORLD Camera] Requesting preferred environment camera...');
  try {
    const preferredStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    });
    console.log('[AIR WORLD Camera] Preferred camera stream acquired successfully.');
    return preferredStream;
  } catch (preferredErr) {
    console.error('[AIR WORLD Camera] getUserMedia failed:', {
      name: preferredErr?.name,
      message: preferredErr?.message
    });

    // If permission was denied by the user, throw CAMERA_DENIED directly without fallback
    if (
      preferredErr?.name === 'NotAllowedError' ||
      preferredErr?.name === 'SecurityError' ||
      preferredErr?.name === 'PermissionDeniedError'
    ) {
      throw mapErrorToStandardError(preferredErr);
    }

    console.log('[AIR WORLD Camera] Preferred environment camera unavailable. Falling back to default camera...');
  }

  // Attempt 2: Fallback to any default available camera
  try {
    const fallbackStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    console.log('[AIR WORLD Camera] Default camera stream acquired successfully.');
    return fallbackStream;
  } catch (fallbackErr) {
    console.error('[AIR WORLD Camera] getUserMedia failed:', {
      name: fallbackErr?.name,
      message: fallbackErr?.message
    });
    throw mapErrorToStandardError(fallbackErr);
  }
}

export function stopCameraStream(stream) {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      try {
        track.stop();
      } catch (error) {
        console.warn('[AIR WORLD Camera] Failed to stop camera track:', error);
      }
    });
  } catch (error) {
    console.warn('[AIR WORLD Camera] Error stopping camera stream:', error);
  }
}


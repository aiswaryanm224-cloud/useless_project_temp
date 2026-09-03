/**
 * Camera Service for AIR WORLD Scanner
 * Handles browser media device camera requests and stream cleanup.
 */

export async function requestCameraStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('CAMERA_UNSUPPORTED');
  }

  try {
    // Request environment facing camera for snack scanning (NO AUDIO)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    return stream;
  } catch (error) {
    console.error('[AIR WORLD CameraService] getUserMedia error:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('CAMERA_DENIED');
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('CAMERA_UNAVAILABLE');
    }
    throw new Error('CAMERA_ERROR');
  }
}

export function stopCameraStream(stream) {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
    });
    console.log('[AIR WORLD CameraService] Camera stream tracks stopped successfully.');
  } catch (err) {
    console.error('[AIR WORLD CameraService] Error stopping tracks:', err);
  }
}

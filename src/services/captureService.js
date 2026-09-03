/**
 * Capture Service for AIR WORLD Scanner
 * Captures current video frame onto an offscreen canvas and converts it to a PNG/JPEG Blob.
 */

export function captureVideoFrame(videoElement) {
  return new Promise((resolve, reject) => {
    if (!videoElement || videoElement.readyState < 2) {
      return reject(new Error('Video element is not active or ready for capture.'));
    }

    try {
      const canvas = document.createElement('canvas');
      const width = videoElement.videoWidth || 1280;
      const height = videoElement.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // Mirror horizontal frame if front camera, but standard facingMode="environment" is normal
      ctx.drawImage(videoElement, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas frame to Blob.'));
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('[AIR WORLD CaptureService] Error capturing video frame:', err);
      reject(err);
    }
  });
}

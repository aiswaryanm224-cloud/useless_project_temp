/**
 * AI Service for AIR WORLD Groq Vision Recognition
 * Client-side interface calling backend server API endpoint POST /api/recognize-snack.
 * Includes AbortController timeout & cancellation support with safe debug logging.
 */

export async function recognizeSnack(imageBlob, externalSignal = null) {
  if (!imageBlob) {
    throw new Error('No image blob provided for snack recognition.');
  }

  console.log('[AIR WORLD DEBUG] Capture started');
  console.log(`[AIR WORLD DEBUG] Blob created: ${Math.round(imageBlob.size / 1024)} KB`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  // Combine external cancellation signal if provided
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  const formData = new FormData();
  formData.append('image', imageBlob, 'snack-frame.jpg');

  try {
    console.log('[AIR WORLD DEBUG] Sending recognition request to /api/recognize-snack');

    const response = await fetch('/api/recognize-snack', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('[AIR WORLD DEBUG] Backend response received');

    if (!response.ok) {
      console.error('[AIR WORLD DEBUG] Recognition failed. Server returned non-200 status:', {
        status: response.status,
        statusText: response.statusText,
        body: data
      });

      if (response.status === 503 && data.configured === false) {
        throw new Error('GROQ_NOT_CONFIGURED');
      }
      throw new Error(data.details || data.error || 'Server processing error');
    }

    console.log('[AIR WORLD DEBUG] Recognition successful');

    return {
      productName: data.productName || 'Unknown Packaged Snack',
      brand: data.brand || null,
      category: data.category || 'Packaged Food',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      description: data.description || 'Suspicious snack packaging detected.',
      packetDetected: Boolean(data.packetDetected)
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn('[AIR WORLD DEBUG] Recognition request was aborted/cancelled.');
      throw new Error('CANCELLED');
    }

    console.error('[AIR WORLD DEBUG] Recognition failed:', error.message || error);
    throw error;
  }
}

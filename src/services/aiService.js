/**
 * AI Service for AIR WORLD Groq Vision Recognition
 *
 * Frontend talks to the backend.
 * Local development:
 *   /api/recognize-snack -> Vite proxy -> localhost:3001
 *
 * Production:
 *   VITE_API_URL -> Render backend
 *   https://air-word-api.onrender.com
 */

export async function recognizeSnack(imageBlob, externalSignal = null) {
  if (!imageBlob) {
    throw new Error('No image blob provided for snack recognition.');
  }

  console.log('[AIR WORLD DEBUG] Capture started');
  console.log(
    `[AIR WORLD DEBUG] Blob created: ${Math.round(imageBlob.size / 1024)} KB`
  );

  // Use Render backend in production through VITE_API_URL.
  // Keep empty fallback for local development so the existing Vite proxy works.
  const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ''
  ).replace(/\/$/, '');

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 25000);

  // Combine external cancellation signal if provided.
  let externalAbortHandler = null;

  if (externalSignal) {
    externalAbortHandler = () => {
      controller.abort();
    };

    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', externalAbortHandler, {
        once: true
      });
    }
  }

  const formData = new FormData();
  formData.append('image', imageBlob, 'snack-frame.jpg');

  try {
    const endpoint = `${API_BASE_URL}/api/recognize-snack`;

    console.log('[AIR WORLD DEBUG] Sending recognition request to:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    const contentType = response.headers.get('content-type') || '';

    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();

      console.error(
        '[AIR WORLD DEBUG] Server returned a non-JSON response:',
        text
      );

      throw new Error(
        `Server returned an unexpected response (${response.status}).`
      );
    }

    console.log('[AIR WORLD DEBUG] Backend response received');

    if (!response.ok) {
      console.error(
        '[AIR WORLD DEBUG] Recognition failed. Server returned non-200 status:',
        {
          status: response.status,
          statusText: response.statusText,
          body: data
        }
      );

      if (response.status === 503 && data.configured === false) {
        throw new Error('GROQ_NOT_CONFIGURED');
      }

      throw new Error(
        data.details ||
        data.error ||
        `Server processing error (${response.status})`
      );
    }

    console.log('[AIR WORLD DEBUG] Recognition successful');

    return {
      productName: data.productName || 'Unknown Packaged Snack',

      brand: data.brand || null,

      category: data.category || 'Packaged Food',

      confidence:
        typeof data.confidence === 'number'
          ? Math.min(1, Math.max(0, data.confidence))
          : 0.85,

      description:
        data.description ||
        'Suspicious snack packaging detected.',

      packetDetected: Boolean(data.packetDetected)
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(
        '[AIR WORLD DEBUG] Recognition request was aborted/cancelled.'
      );

      throw new Error('CANCELLED');
    }

    console.error(
      '[AIR WORLD DEBUG] Recognition failed:',
      error.message || error
    );

    throw error;

  } finally {
    clearTimeout(timeoutId);

    if (externalSignal && externalAbortHandler) {
      externalSignal.removeEventListener(
        'abort',
        externalAbortHandler
      );
    }
  }
}
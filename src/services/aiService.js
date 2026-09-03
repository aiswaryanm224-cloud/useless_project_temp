/**
 * AI Service for AIR WORLD Gemini Vision Recognition
 * Client-side interface to call backend server API endpoint POST /api/recognize-snack.
 */

export async function recognizeSnack(imageBlob) {
  if (!imageBlob) {
    throw new Error('No image blob provided for snack recognition.');
  }

  const formData = new FormData();
  formData.append('image', imageBlob, 'snack-frame.jpg');

  try {
    const response = await fetch('/api/recognize-snack', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Snack recognition failed:', {
        status: response.status,
        statusText: response.statusText,
        body: data
      });

      if (response.status === 503 && data.configured === false) {
        throw new Error('GEMINI_NOT_CONFIGURED');
      }
      throw new Error(data.details || data.error || 'Server processing error');
    }

    return {
      productName: data.productName || 'Unknown Packaged Item',
      brand: data.brand || null,
      category: data.category || 'Packaged Food',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      description: data.description || 'Suspicious snack packet detected.',
      packetDetected: Boolean(data.packetDetected)
    };

  } catch (error) {
    console.error('[AIR WORLD AIService] Recognition API error details:', error);
    throw error;
  }
}

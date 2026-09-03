/**
 * Audio Shake Service for AIR WORLD Scanner
 * Web Audio API FFT frequency analysis & RMS amplitude detection for packet shake sound testing.
 * Requests microphone ONLY when user explicitly starts the shake test.
 */

let audioCtx = null;
let analyserNode = null;
let mediaStream = null;
let animFrameId = null;
let activeCallback = null;

// Track history of RMS amplitudes for shake delta detection
let amplitudeHistory = [];
let shakeScoreAccumulator = 0;

export async function startShakeAnalysis(onUpdateCallback) {
  stopShakeAnalysis(); // Ensure previous session is fully cleaned up

  try {
    console.log('[AIR WORLD AudioService] Requesting microphone permission for shake test...');
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log('[AIR WORLD AudioService] Microphone permission granted.');

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    const source = audioCtx.createMediaStreamSource(mediaStream);
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    source.connect(analyserNode);

    activeCallback = onUpdateCallback;
    amplitudeHistory = [];
    shakeScoreAccumulator = 0;

    runAnalysisLoop();
    return true;

  } catch (error) {
    console.error('[AIR WORLD AudioService] Microphone error:', error);
    stopShakeAnalysis();
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('MIC_DENIED');
    }
    throw new Error('MIC_UNAVAILABLE');
  }
}

function runAnalysisLoop() {
  if (!analyserNode || !audioCtx) return;

  const bufferLength = analyserNode.frequencyBinCount;
  const timeDomainData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);

  analyserNode.getByteTimeDomainData(timeDomainData);
  analyserNode.getByteFrequencyData(frequencyData);

  // 1. Calculate RMS Amplitude
  let sumSquares = 0;
  for (let i = 0; i < bufferLength; i++) {
    const norm = (timeDomainData[i] - 128) / 128;
    sumSquares += norm * norm;
  }
  const rms = Math.sqrt(sumSquares / bufferLength);

  // 2. Calculate Dominant Frequency
  let maxEnergy = 0;
  let maxBinIndex = 0;
  const sampleRate = audioCtx.sampleRate || 44100;

  for (let i = 1; i < bufferLength; i++) {
    if (frequencyData[i] > maxEnergy) {
      maxEnergy = frequencyData[i];
      maxBinIndex = i;
    }
  }

  const dominantFrequency = Math.round((maxBinIndex * sampleRate) / (analyserNode.fftSize));

  // 3. Shake Activity & Amplitude Variation Detection
  amplitudeHistory.push(rms);
  if (amplitudeHistory.length > 20) amplitudeHistory.shift();

  // Variance in recent amplitudes indicates kinetic shaking vs static background noise
  const avgRms = amplitudeHistory.reduce((a, b) => a + b, 0) / amplitudeHistory.length;
  const variance = amplitudeHistory.reduce((acc, val) => acc + Math.pow(val - avgRms, 2), 0) / amplitudeHistory.length;

  const isShaking = rms > 0.04 && variance > 0.0002;
  const isStrongShake = rms > 0.12 && variance > 0.001;

  let shakeState = 'LOW ACTIVITY';
  if (isStrongShake) {
    shakeState = 'STRONG SHAKE';
    shakeScoreAccumulator = Math.min(100, shakeScoreAccumulator + 10);
  } else if (isShaking) {
    shakeState = 'SHAKING';
    shakeScoreAccumulator = Math.min(100, shakeScoreAccumulator + 5);
  }

  // 4. Calculate Audio Metrics
  const shakeIntensity = Math.min(100, Math.round(rms * 400));
  const shakeConfidence = Math.min(98, Math.max(20, Math.round(shakeScoreAccumulator)));

  // Higher frequency crisp noise indicates higher air cavity resonance
  const rawAirEst = Math.round(Math.min(88, Math.max(25, (dominantFrequency / 1200) * 80 + (1 - avgRms) * 20)));
  const audioAirEstimate = Math.min(92, Math.max(18, rawAirEst));
  const audioContentEstimate = 100 - audioAirEstimate;

  if (activeCallback) {
    activeCallback({
      rms,
      shakeState,
      shakeIntensity,
      dominantFrequency,
      shakeConfidence,
      audioAirEstimate,
      audioContentEstimate
    });
  }

  animFrameId = requestAnimationFrame(runAnalysisLoop);
}

export function stopShakeAnalysis() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    console.log('[AIR WORLD AudioService] Microphone audio stream stopped.');
  }

  if (audioCtx) {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(err => console.error('AudioContext close error:', err));
    }
    audioCtx = null;
  }

  analyserNode = null;
  activeCallback = null;
  amplitudeHistory = [];
  shakeScoreAccumulator = 0;
}

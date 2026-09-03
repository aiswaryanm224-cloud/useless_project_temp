import React, { useState, useEffect, useRef } from 'react';
import { requestCameraStream, stopCameraStream } from '../../services/cameraService';
import { processVideoFrame, resetTracker } from '../../services/trackingService';
import { captureVideoFrame } from '../../services/captureService';
import { recognizeSnack } from '../../services/aiService';
import { stopShakeAnalysis } from '../../services/audioShakeService';
import TrackingOverlay from './TrackingOverlay';
import RecognitionResult from './RecognitionResult';
import ShakeAnalyzer from './ShakeAnalyzer';
import { Camera, X, RefreshCw, AlertCircle, Mic, Search, StopCircle, Zap } from 'lucide-react';

export default function CameraScanner({ isOpen, onClose }) {
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | requesting | ready | denied | unavailable | error
  const [trackingInfo, setTrackingInfo] = useState({ status: 'SEARCHING', box: null, measurements: null });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStepMessage, setCaptureStepMessage] = useState('');
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [playError, setPlayError] = useState(null);
  const [isFindMode, setIsFindMode] = useState(false);
  const [showDirectShakeModal, setShowDirectShakeModal] = useState(false);

  // Auto Scan States
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(true);
  const [hasAutoCaptured, setHasAutoCaptured] = useState(false);
  const [countdownVal, setCountdownVal] = useState(null);
  const [countdownInterrupted, setCountdownInterrupted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const aiAbortControllerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Centralized Master Scanner Hardware & State Cleanup
  const stopMasterScanner = () => {
    console.log('[AIR WORLD Scanner] Executing master hardware cleanup...');
    
    // Clear countdown timers
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownVal(null);
    setCountdownInterrupted(false);

    // Abort active AI recognition request
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }

    // Stop microphone tracks and close AudioContext
    stopShakeAnalysis();

    // Cancel frame tracking loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop video stream MediaStream tracks
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }

    // Clear video element srcObject
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset scanner states
    setIsCapturing(false);
    setIsFindMode(false);
    setShowDirectShakeModal(false);
    setHasAutoCaptured(false);
    setCameraStatus('idle');

    console.log('[AIR WORLD Scanner] Master scanner hardware successfully turned OFF.');
  };

  // Step 1: Initialize camera stream when scanner opens & cleanup on unmount
  useEffect(() => {
    if (!isOpen) {
      stopMasterScanner();
      return;
    }

    let isMounted = true;
    stopMasterScanner();

    setCameraStatus('requesting');
    resetTracker();
    setRecognitionResult(null);
    setPlayError(null);
    setHasAutoCaptured(false);

    async function initCamera() {
      try {
        console.log('[AIR WORLD Scanner] Requesting camera stream (facingMode: environment)...');
        const stream = await requestCameraStream();
        
        if (!isMounted) {
          stopCameraStream(stream);
          return;
        }

        console.log('[AIR WORLD Scanner] Camera permission granted & stream active');
        streamRef.current = stream;
        setCameraStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        console.error('[AIR WORLD Scanner] Camera initialization error:', err.message);
        if (err.message === 'CAMERA_DENIED') {
          setCameraStatus('denied');
        } else if (err.message === 'CAMERA_UNAVAILABLE') {
          setCameraStatus('unavailable');
        } else {
          setCameraStatus('error');
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopMasterScanner();
    };
  }, [isOpen]);

  // Step 2: Attach MediaStream to Video Element AFTER video element mounts in DOM
  useEffect(() => {
    if (cameraStatus !== 'ready' || !streamRef.current) return;

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.srcObject = streamRef.current;
      
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[AIR WORLD Scanner] Camera playback started successfully');
          })
          .catch((err) => {
            console.error('[AIR WORLD Scanner] Video play() failed:', err);
            setPlayError('Your camera said no 😭');
          });
      }
    }
  }, [cameraStatus]);

  // Step 3: Frame processing loop for packet tracking
  useEffect(() => {
    if (cameraStatus !== 'ready' || recognitionResult || isCapturing || playError || showDirectShakeModal) return;

    function loop() {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const result = processVideoFrame(videoRef.current);
        setTrackingInfo(result);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraStatus, recognitionResult, isCapturing, playError, showDirectShakeModal]);

  // Step 4: Automatic Smart Scan Stability Countdown Pipeline
  useEffect(() => {
    // Requirements for Auto Scan trigger: Enabled, Packet Stable Ready, Single Session Guard false, Not already capturing
    if (
      !isAutoScanEnabled || 
      trackingInfo.status !== 'CAPTURE_READY' || 
      hasAutoCaptured || 
      isCapturing || 
      recognitionResult || 
      showDirectShakeModal || 
      cameraStatus !== 'ready'
    ) {
      if (countdownVal !== null) {
        // Interrupted by movement
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownVal(null);
        setCountdownInterrupted(true);
        setTimeout(() => setCountdownInterrupted(false), 1200);
      }
      return;
    }

    // Start 3-2-1 Countdown if not already running
    if (countdownVal === null && !countdownTimerRef.current) {
      console.log('[AIR WORLD Scanner] Packet stable! Starting 3-2-1 Auto Scan countdown...');
      let currentVal = 3;
      setCountdownVal(3);

      countdownTimerRef.current = setInterval(() => {
        currentVal -= 1;
        if (currentVal > 0) {
          setCountdownVal(currentVal);
        } else if (currentVal === 0) {
          setCountdownVal(0);
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;

          // Trigger Auto Capture
          setTimeout(() => {
            setCountdownVal(null);
            setHasAutoCaptured(true);
            handleCaptureSnack();
          }, 300);
        }
      }, 350); // Fast responsive 3-2-1 countdown (~1.0s total)
    }
  }, [trackingInfo.status, isAutoScanEnabled, hasAutoCaptured, isCapturing, recognitionResult, showDirectShakeModal, cameraStatus]);

  const handleClose = () => {
    stopMasterScanner();
    onClose();
  };

  // Handle Capture Snack Action (with AbortController & guaranteed finally reset)
  const handleCaptureSnack = async () => {
    if (!videoRef.current || isCapturing) return;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownVal(null);

    setIsCapturing(true);
    setCaptureStepMessage('CAPTURED 👀');
    aiAbortControllerRef.current = new AbortController();

    try {
      // Step 1: Capture frame Blob
      const blob = await captureVideoFrame(videoRef.current);

      // Step 2: Progression feedback
      setCaptureStepMessage('Analyzing suspicious packaging...');
      await new Promise(r => setTimeout(r, 400));

      setCaptureStepMessage('Consulting the snack authorities...');

      // Step 3: Call Groq Vision backend with cancellation signal
      const result = await recognizeSnack(blob, aiAbortControllerRef.current.signal);
      setRecognitionResult(result);
    } catch (err) {
      console.error('[AIR WORLD Scanner] Recognition flow error:', err.message);
      
      if (err.message === 'CANCELLED') {
        console.log('[AIR WORLD Scanner] Scan was cancelled by user.');
      } else if (err.message === 'TIMEOUT') {
        setRecognitionResult({
          isError: true,
          message: 'The snack scientists are taking too long 😭'
        });
      } else if (err.message === 'GROQ_NOT_CONFIGURED') {
        setRecognitionResult({
          isError: true,
          message: 'Groq API key is not configured on the server. Please set GROQ_API_KEY in .env file.'
        });
      } else {
        setRecognitionResult({
          isError: true,
          message: 'The snack scientists are currently unavailable 😭'
        });
      }
    } finally {
      // GUARANTEED RESET: isCapturing is ALWAYS reset so UI can never freeze!
      setIsCapturing(false);
      aiAbortControllerRef.current = null;
    }
  };

  // Cancel active AI scan manually
  const handleCancelScan = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsCapturing(false);
  };

  const handleRetry = () => {
    setRecognitionResult(null);
    setHasAutoCaptured(false);
    resetTracker();
  };

  if (!isOpen) return null;

  return (
    <div style={modalBackdropStyle}>
      <div style={scannerContainerStyle}>
        {/* Header Bar with X Close Button */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--pastel-peach)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              🍿
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#ffffff' }}>
                AIR WORLD SCANNER
              </h3>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                Point a snack at me 👀
              </div>
            </div>
          </div>

          <button onClick={handleClose} style={closeButtonStyle} title="Close Scanner & Turn Off Camera">
            <X size={22} color="#ffffff" />
          </button>
        </div>

        {/* Scanner Viewport Content Stage */}
        <div style={viewportContainerStyle}>
          {cameraStatus === 'requesting' && (
            <div style={centerStateStyle}>
              <div className="animate-radar" style={{ fontSize: '44px', color: 'var(--pastel-yellow)' }}>✦</div>
              <p style={stateTextStyle}>Connecting camera feed...</p>
            </div>
          )}

          {cameraStatus === 'denied' && (
            <div style={centerStateStyle}>
              <div style={{ fontSize: '48px' }}>😭</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#ffffff' }}>
                Okay... we can't see the snack 😭
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: '320px' }}>
                Give camera permission in your browser and try again.
              </p>
              <button className="glass-button" onClick={() => window.location.reload()} style={{ marginTop: '12px' }}>
                <RefreshCw size={16} />
                TRY AGAIN
              </button>
            </div>
          )}

          {(cameraStatus === 'unavailable' || cameraStatus === 'error' || playError) && (
            <div style={centerStateStyle}>
              <AlertCircle size={48} color="var(--pastel-coral)" />
              <p style={stateTextStyle}>{playError || 'Your camera said no 😭'}</p>
              <button className="glass-button" onClick={handleClose} style={{ marginTop: '12px' }}>
                CLOSE SCANNER
              </button>
            </div>
          )}

          {cameraStatus === 'ready' && !playError && (
            <div style={cameraStageStyle}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={videoStyle}
              />

              {/* Real-time Tracking & Guidance Overlay */}
              {!recognitionResult && !isCapturing && (
                <TrackingOverlay
                  box={trackingInfo.box}
                  measurements={trackingInfo.measurements}
                  status={trackingInfo.status}
                  isFindMode={isFindMode}
                  countdownVal={countdownVal}
                  countdownInterrupted={countdownInterrupted}
                  videoWidth={videoRef.current?.videoWidth || 640}
                  videoHeight={videoRef.current?.videoHeight || 480}
                />
              )}

              {/* Cancelable Scanning Sequence Animation Overlay */}
              {isCapturing && (
                <div style={captureOverlayStyle}>
                  <div className="animate-radar" style={{ fontSize: '48px', color: 'var(--pastel-yellow)' }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#ffffff', textAlign: 'center' }}>
                    {captureStepMessage}
                  </div>
                  <button 
                    className="glass-button" 
                    onClick={handleCancelScan} 
                    style={{ marginTop: '12px', background: 'rgba(255, 77, 77, 0.2)', border: '1.5px solid #ff4d4d' }}
                  >
                    <StopCircle size={18} />
                    CANCEL SCAN
                  </button>
                </div>
              )}

              {/* Direct Shake Test Modal */}
              {showDirectShakeModal && (
                <div style={resultOverlayStyle}>
                  <ShakeAnalyzer
                    onComplete={() => setShowDirectShakeModal(false)}
                    onClose={() => setShowDirectShakeModal(false)}
                  />
                </div>
              )}

              {/* Recognition Result Modal Overlay */}
              {recognitionResult && !showDirectShakeModal && (
                <div style={resultOverlayStyle}>
                  <RecognitionResult
                    result={recognitionResult}
                    measurements={trackingInfo.measurements}
                    onRetry={handleRetry}
                    onClose={handleClose}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar with Responsive Scanner Action Buttons */}
        {cameraStatus === 'ready' && !recognitionResult && !showDirectShakeModal && !playError && (
          <div style={footerStyle}>
            {/* Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isFindMode 
                  ? '#eab308' 
                  : trackingInfo.status === 'CAPTURE_READY' 
                    ? '#16a34a' 
                    : '#eab308'
              }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {isFindMode 
                  ? (trackingInfo.status === 'TRACKING' || trackingInfo.status === 'CAPTURE_READY' ? 'TARGET FOUND 👀' : 'FIND MODE: SEARCHING...') 
                  : trackingInfo.status === 'CAPTURE_READY' 
                    ? 'PACKET TRACKED & READY' 
                    : 'SEARCHING FOR PACKET...'}
              </span>
            </div>

            {/* Responsive Scanner Action Buttons */}
            <div style={actionButtonGroupStyle}>
              {/* Button 1: AUTO SCAN TOGGLE */}
              <button
                className="glass-button"
                onClick={() => setIsAutoScanEnabled(!isAutoScanEnabled)}
                style={{
                  background: isAutoScanEnabled ? 'linear-gradient(135deg, var(--pastel-mint) 0%, var(--pastel-blue) 100%)' : 'rgba(255,255,255,0.1)',
                  color: isAutoScanEnabled ? '#15803d' : 'rgba(255,255,255,0.7)',
                  border: isAutoScanEnabled ? '2px solid #16a34a' : '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}
              >
                <Zap size={15} />
                AUTO SCAN: {isAutoScanEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Button 2: CAPTURE SNACK (Manual Capture) */}
              <button
                className="glass-button"
                onClick={handleCaptureSnack}
                disabled={isCapturing || trackingInfo.status !== 'CAPTURE_READY'}
                style={{
                  opacity: (isCapturing || trackingInfo.status !== 'CAPTURE_READY') ? 0.5 : 1,
                  cursor: (isCapturing || trackingInfo.status !== 'CAPTURE_READY') ? 'not-allowed' : 'pointer',
                  padding: '10px 16px',
                  fontSize: '13px'
                }}
              >
                <Camera size={16} />
                {isCapturing ? 'ANALYZING...' : 'CAPTURE SNACK'}
              </button>

              {/* Button 3: SHAKE TEST */}
              <button
                className="glass-button"
                onClick={() => setShowDirectShakeModal(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--pastel-yellow) 0%, var(--pastel-peach) 100%)',
                  color: 'var(--text-dark)',
                  border: '1.5px solid var(--text-dark)',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}
              >
                <Mic size={15} />
                SHAKE TEST
              </button>

              {/* Button 4: FIND */}
              <button
                className="glass-button"
                onClick={() => setIsFindMode(!isFindMode)}
                style={{
                  background: isFindMode ? 'var(--pastel-mint)' : 'rgba(255,255,255,0.15)',
                  color: isFindMode ? '#15803d' : '#ffffff',
                  border: isFindMode ? '2px solid #16a34a' : '1px solid rgba(255,255,255,0.3)',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}
              >
                <Search size={15} />
                {isFindMode ? 'FINDING...' : 'FIND'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(10, 14, 22, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  padding: '16px'
};

const scannerContainerStyle = {
  width: '100%',
  maxWidth: '780px',
  height: '90vh',
  minHeight: '480px',
  maxHeight: '740px',
  background: '#141923',
  borderRadius: '32px',
  border: '3px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
};

const headerStyle = {
  padding: '14px 20px',
  background: 'rgba(255,255,255,0.05)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justify: 'space-between'
};

const closeButtonStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  cursor: 'pointer'
};

const viewportContainerStyle = {
  flex: 1,
  minHeight: '350px',
  position: 'relative',
  background: '#0a0d14',
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  overflow: 'hidden'
};

const cameraStageStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  overflow: 'hidden'
};

const videoStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
};

const centerStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'center',
  gap: '12px',
  padding: '24px'
};

const stateTextStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.9)'
};

const captureOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10, 14, 22, 0.8)',
  backdropFilter: 'blur(8px)',
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'center',
  gap: '16px',
  padding: '24px'
};

const resultOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10, 14, 22, 0.75)',
  backdropFilter: 'blur(10px)',
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  padding: '16px',
  overflowY: 'auto'
};

const footerStyle = {
  padding: '14px 20px',
  background: 'rgba(255,255,255,0.05)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justify: 'space-between',
  gap: '12px',
  flexWrap: 'wrap'
};

const actionButtonGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap'
};

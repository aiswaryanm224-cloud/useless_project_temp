import React, { useState, useEffect, useRef } from 'react';
import { requestCameraStream, stopCameraStream } from '../../services/cameraService';
import { processVideoFrame, resetTracker } from '../../services/trackingService';
import { captureVideoFrame } from '../../services/captureService';
import { recognizeSnack } from '../../services/aiService';
import TrackingOverlay from './TrackingOverlay';
import RecognitionResult from './RecognitionResult';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

export default function CameraScanner({ isOpen, onClose }) {
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | requesting | ready | denied | unavailable | error
  const [trackingInfo, setTrackingInfo] = useState({ status: 'SEARCHING', box: null, measurements: null });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStepMessage, setCaptureStepMessage] = useState('');
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [playError, setPlayError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Step 1: Initialize camera stream when scanner opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraStatus('requesting');
    resetTracker();
    setRecognitionResult(null);
    setPlayError(null);

    async function initCamera() {
      try {
        console.log('[AIR WORLD Scanner] Camera permission requested');
        const stream = await requestCameraStream();
        
        if (!isMounted) {
          stopCameraStream(stream);
          return;
        }

        console.log('[AIR WORLD Scanner] Camera permission granted');
        console.log('[AIR WORLD Scanner] Camera stream received', stream);

        streamRef.current = stream;
        setCameraStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        console.error('[AIR WORLD Scanner] Camera error:', err.message);
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
      cleanupStream();
    };
  }, [isOpen]);

  // Step 2: Attach MediaStream to Video Element AFTER video element is mounted in DOM
  useEffect(() => {
    if (cameraStatus !== 'ready' || !streamRef.current) return;

    const videoEl = videoRef.current;
    if (videoEl) {
      console.log('[AIR WORLD Scanner] Video element connected');
      videoEl.srcObject = streamRef.current;
      
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[AIR WORLD Scanner] Camera playback started');
          })
          .catch((err) => {
            console.error('[AIR WORLD Scanner] Video play() failed:', err);
            setPlayError('Unable to start live camera video feed.');
          });
      }
    }
  }, [cameraStatus]);

  // Step 3: Frame processing loop for packet tracking
  useEffect(() => {
    if (cameraStatus !== 'ready' || recognitionResult || isCapturing || playError) return;

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
  }, [cameraStatus, recognitionResult, isCapturing, playError]);

  // Cleanup helper function
  const cleanupStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    console.log('[AIR WORLD Scanner] Camera stream and tracking cleaned up.');
  };

  const handleClose = () => {
    cleanupStream();
    onClose();
  };

  // Handle Capture Snack Button Click
  const handleCaptureSnack = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setCaptureStepMessage('CAPTURED 👀');

    try {
      // Step 1: Capture frame Blob
      const blob = await captureVideoFrame(videoRef.current);

      // Step 2: Show sequence messages
      setCaptureStepMessage('Analyzing suspicious packaging...');
      await new Promise(r => setTimeout(r, 500));

      setCaptureStepMessage('Consulting the snack authorities...');

      // Step 3: Call Gemini Vision backend
      const result = await recognizeSnack(blob);
      setRecognitionResult(result);
    } catch (err) {
      console.error('[AIR WORLD Scanner] Capture / AI error:', err);
      if (err.message === 'GEMINI_NOT_CONFIGURED') {
        setRecognitionResult({
          isError: true,
          message: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in .env file.'
        });
      } else {
        setRecognitionResult({
          isError: true,
          message: 'The snack scientists encountered a temporary anomaly.'
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetry = () => {
    setRecognitionResult(null);
    resetTracker();
  };

  if (!isOpen) return null;

  return (
    <div style={modalBackdropStyle}>
      <div style={scannerContainerStyle}>
        {/* Header Bar */}
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

          <button onClick={handleClose} style={closeButtonStyle}>
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
                Okay... we can't see the snack
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
              <p style={stateTextStyle}>{playError || 'Camera feed unavailable on this browser/device.'}</p>
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

              {/* Real-time Tracking Overlay */}
              {!recognitionResult && !isCapturing && (
                <TrackingOverlay
                  box={trackingInfo.box}
                  measurements={trackingInfo.measurements}
                  status={trackingInfo.status}
                  videoWidth={videoRef.current?.videoWidth || 640}
                  videoHeight={videoRef.current?.videoHeight || 480}
                />
              )}

              {/* Scanning Sequence Animation Overlay */}
              {isCapturing && (
                <div style={captureOverlayStyle}>
                  <div className="animate-radar" style={{ fontSize: '48px', color: 'var(--pastel-yellow)' }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#ffffff', textAlign: 'center' }}>
                    {captureStepMessage}
                  </div>
                </div>
              )}

              {/* Recognition Result Modal Overlay */}
              {recognitionResult && (
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

        {/* Bottom Control Bar */}
        {cameraStatus === 'ready' && !recognitionResult && !playError && (
          <div style={footerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: trackingInfo.status === 'CAPTURE_READY' ? '#16a34a' : '#eab308'
              }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {trackingInfo.status === 'CAPTURE_READY' ? 'PACKET TRACKED & READY' : 'SEARCHING FOR PACKET...'}
              </span>
            </div>

            <button
              className="glass-button"
              onClick={handleCaptureSnack}
              disabled={isCapturing || trackingInfo.status !== 'CAPTURE_READY'}
              style={{
                opacity: (isCapturing || trackingInfo.status !== 'CAPTURE_READY') ? 0.5 : 1,
                cursor: (isCapturing || trackingInfo.status !== 'CAPTURE_READY') ? 'not-allowed' : 'pointer'
              }}
            >
              <Camera size={20} />
              {isCapturing ? 'ANALYZING...' : 'CAPTURE SNACK'}
            </button>
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
  maxWidth: '720px',
  height: '85vh',
  minHeight: '480px',
  maxHeight: '700px',
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
  padding: '14px 24px',
  background: 'rgba(255,255,255,0.05)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justify: 'space-between',
  gap: '16px'
};

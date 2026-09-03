import React, { useState, useEffect } from 'react';
import { startShakeAnalysis, stopShakeAnalysis } from '../../services/audioShakeService';
import { Mic, Volume2, Sparkles, RefreshCw, X, CheckCircle } from 'lucide-react';

export default function ShakeAnalyzer({ onComplete, onClose }) {
  const [micState, setMicState] = useState('requesting'); // requesting | listening | denied | done
  const [audioMetrics, setAudioMetrics] = useState({
    shakeState: 'LOW ACTIVITY',
    shakeIntensity: 0,
    dominantFrequency: 0,
    shakeConfidence: 0,
    audioAirEstimate: 50,
    audioContentEstimate: 50
  });

  const [sequenceMessage, setSequenceMessage] = useState('SHAKE THE PACKET 👀');

  useEffect(() => {
    let isMounted = true;

    async function initMic() {
      try {
        setMicState('requesting');
        setSequenceMessage('Requesting microphone permission...');

        await startShakeAnalysis((metrics) => {
          if (!isMounted) return;
          setAudioMetrics(metrics);

          if (metrics.shakeState === 'SHAKING') {
            setSequenceMessage('SHAKE DETECTED 🎵');
          } else if (metrics.shakeState === 'STRONG SHAKE') {
            setSequenceMessage('ANALYZING THE SNACK CHAOS... ⚡');
          } else {
            setSequenceMessage('SHAKE THE PACKET 👀');
          }
        });

        if (isMounted) {
          setMicState('listening');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AIR WORLD ShakeAnalyzer] Mic error:', err);
        setMicState('denied');
      }
    }

    initMic();

    return () => {
      isMounted = false;
      stopShakeAnalysis();
    };
  }, []);

  const handleDone = () => {
    stopShakeAnalysis();
    if (onComplete) {
      onComplete(audioMetrics);
    }
  };

  return (
    <div className="glass-panel" style={modalStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'var(--pastel-yellow)',
          color: '#854d0e',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '12px'
        }}>
          <Mic size={14} />
          ACOUSTIC SHAKE TEST
        </div>

        <button onClick={() => { stopShakeAnalysis(); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} color="var(--text-dark)" />
        </button>
      </div>

      {micState === 'requesting' && (
        <div style={centerStyle}>
          <div className="animate-radar" style={{ fontSize: '36px', color: 'var(--pastel-coral)' }}>🎙️</div>
          <p style={subtextStyle}>{sequenceMessage}</p>
        </div>
      )}

      {micState === 'denied' && (
        <div style={centerStyle}>
          <div style={{ fontSize: '44px' }}>😭</div>
          <h3 style={headlineStyle}>The snack refused to talk</h3>
          <p style={subtextStyle}>Microphone access was denied. Please allow microphone access and try again.</p>
          <button className="glass-button" onClick={() => window.location.reload()} style={{ marginTop: '12px' }}>
            <RefreshCw size={16} />
            TRY AGAIN
          </button>
        </div>
      )}

      {micState === 'listening' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Animated Wave Indicator Header */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-dark)',
            textAlign: 'center'
          }}>
            {sequenceMessage}
          </div>

          {/* Live Frequency & Amplitude Meter */}
          <div style={{
            width: '100%',
            padding: '16px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.8)',
            border: '2px solid var(--text-dark)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
              <span>SHAKE INTENSITY</span>
              <span style={{ color: audioMetrics.shakeIntensity > 40 ? 'var(--pastel-coral)' : 'var(--text-muted)' }}>
                {audioMetrics.shakeState} ({audioMetrics.shakeIntensity}%)
              </span>
            </div>

            {/* Audio Bar Visualizer */}
            <div style={{ height: '14px', width: '100%', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${audioMetrics.shakeIntensity}%`,
                background: 'linear-gradient(90deg, var(--pastel-mint) 0%, var(--pastel-coral) 100%)',
                transition: 'width 0.1s ease-out'
              }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginTop: '4px' }}>
              <div style={statBox}>
                <div style={statLabel}>DOMINANT FREQ</div>
                <div style={statVal}>{audioMetrics.dominantFrequency} Hz</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>SHAKE CONFIDENCE</div>
                <div style={statVal}>{audioMetrics.shakeConfidence}%</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>AUDIO AIR EST.</div>
                <div style={statVal}>{audioMetrics.audioAirEstimate}%</div>
              </div>
            </div>
          </div>

          <p style={{
            fontFamily: 'var(--font-handwritten)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            Experimental estimate based on packet geometry + sound.
          </p>

          <button className="glass-button" onClick={handleDone} style={{ width: '100%' }}>
            <CheckCircle size={18} />
            SEE COMBINED RESULTS
          </button>
        </div>
      )}
    </div>
  );
}

const modalStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '440px',
  width: '90%',
  margin: '0 auto',
  background: '#ffffff',
  borderRadius: '28px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  border: '3px solid var(--text-dark)'
};

const centerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'center',
  gap: '12px',
  padding: '16px 0'
};

const headlineStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-dark)'
};

const subtextStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textAlign: 'center'
};

const statBox = {
  background: '#f8fafc',
  padding: '8px',
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.06)'
};

const statLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: '9px',
  fontWeight: 700,
  color: 'var(--text-muted)'
};

const statVal = {
  fontFamily: 'var(--font-display)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--text-dark)',
  marginTop: '2px'
};

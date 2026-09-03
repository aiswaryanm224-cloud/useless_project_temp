import React, { useState } from 'react';
import ShakeAnalyzer from './ShakeAnalyzer';
import { Sparkles, AlertTriangle, RefreshCw, X, Mic } from 'lucide-react';

export default function RecognitionResult({ result, measurements, onRetry, onClose }) {
  const [showShakeAnalyzer, setShowShakeAnalyzer] = useState(false);
  const [audioMetrics, setAudioMetrics] = useState(null);

  if (!result) return null;

  // Handle No Packet Detected case
  if (result.packetDetected === false) {
    return (
      <div className="glass-panel" style={modalStyle}>
        <div style={iconBadgeStyle('var(--pastel-peach)')}>
          <AlertTriangle size={32} color="#c2410c" />
        </div>

        <h2 style={headlineStyle}>Bro... that's not a snack. 👀</h2>
        
        <p style={subtextStyle}>
          Our volumetric sensors could not detect any packaged food or chips in the image.
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
          <button className="glass-button" onClick={onRetry} style={{ flex: 1 }}>
            <RefreshCw size={18} />
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Handle Error / Configuration failure case
  if (result.isError) {
    return (
      <div className="glass-panel" style={modalStyle}>
        <div style={iconBadgeStyle('var(--pastel-yellow)')}>
          🤖
        </div>

        <h2 style={headlineStyle}>The snack scientists are currently unavailable.</h2>
        
        <p style={subtextStyle}>
          {result.message || 'Unable to connect to Groq Vision service at this moment.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
          <button className="glass-button" onClick={onRetry} style={{ flex: 1 }}>
            <RefreshCw size={18} />
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Render Shake Analyzer Modal when user starts Shake Test
  if (showShakeAnalyzer) {
    return (
      <ShakeAnalyzer
        onComplete={(metrics) => {
          setAudioMetrics(metrics);
          setShowShakeAnalyzer(false);
        }}
        onClose={() => setShowShakeAnalyzer(false)}
      />
    );
  }

  // Calculate Combined Air Estimate
  const cameraAir = measurements?.cameraAirEstimate || 65;
  const audioAir = audioMetrics?.audioAirEstimate;
  
  const combinedAir = audioAir != null 
    ? Math.round(cameraAir * 0.4 + audioAir * 0.6)
    : cameraAir;
  
  const combinedContent = 100 - combinedAir;

  // Dynamic Humor Line Generator based on combined telemetry
  const getHumorMessage = () => {
    if (audioMetrics) {
      if (audioMetrics.audioAirEstimate > 75) return "That packet is sounding suspiciously hollow. 💨";
      if (audioMetrics.shakeState === 'STRONG SHAKE') return "The snack scientists hear pure chaotic energy! ⚡";
      if (combinedContent > 50) return "Dense snack energy detected. Solid matter confirmed! 🍪";
      return "Okay... there's definitely something moving in there. 🍿";
    }

    const categoryLower = (result.category || '').toLowerCase();
    if (categoryLower.includes('chip') || categoryLower.includes('crisp')) {
      return "Congratulations. It appears to be actual chips (and nitrogen air)! 🍿";
    }
    if (categoryLower.includes('biscuit') || categoryLower.includes('cookie')) {
      return "Good news: this packet contains solid matter, not just vacuum air! 🍪";
    }
    return "Good news: this is probably not just air. Proceed to consume!";
  };

  const confidencePct = Math.round((result.confidence || 0.85) * 100);

  return (
    <div className="glass-panel" style={modalStyle}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'var(--pastel-mint)',
          color: '#15803d',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '12px'
        }}>
          <Sparkles size={14} />
          WE FOUND SOMETHING 👀
        </div>

        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Identified Product Name */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '26px',
        fontWeight: 700,
        color: 'var(--text-dark)',
        textAlign: 'center',
        margin: '12px 0 4px 0'
      }}>
        {result.productName}
      </h2>

      {/* Brand & Category Tags */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        {result.brand && (
          <span className="sticker-badge" style={{ background: 'var(--pastel-yellow)', fontSize: '11px' }}>
            BRAND: {result.brand}
          </span>
        )}
        <span className="sticker-badge" style={{ background: 'var(--pastel-blue)', fontSize: '11px' }}>
          CAT: {result.category}
        </span>
        <span className="sticker-badge" style={{ background: 'var(--pastel-peach)', fontSize: '11px' }}>
          CONFIDENCE: {confidencePct}%
        </span>
      </div>

      {/* Dynamic AIR WORLD Humor Message */}
      <div style={{
        padding: '10px 14px',
        borderRadius: '16px',
        background: 'rgba(255, 232, 154, 0.4)',
        border: '1.5px solid var(--text-dark)',
        fontFamily: 'var(--font-handwritten)',
        fontSize: '19px',
        fontWeight: 700,
        color: 'var(--text-dark)',
        textAlign: 'center',
        margin: '4px 0 12px 0',
        width: '100%'
      }}>
        "{getHumorMessage()}"
      </div>

      {/* Real Geometric & Combined Telemetry Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: audioMetrics ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
        gap: '6px',
        width: '100%',
        margin: '4px 0 14px 0',
        background: 'rgba(255,255,255,0.85)',
        padding: '10px',
        borderRadius: '16px',
        border: '1.5px solid var(--text-dark)'
      }}>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>AIR EST.</div>
          <div style={statValStyle}>{combinedAir}%</div>
        </div>

        <div style={statBoxStyle}>
          <div style={statLabelStyle}>CONTENT EST.</div>
          <div style={statValStyle}>{combinedContent}%</div>
        </div>

        <div style={statBoxStyle}>
          <div style={statLabelStyle}>ASPECT RATIO</div>
          <div style={statValStyle}>{measurements ? measurements.aspectRatio : '0.63'}</div>
        </div>

        {audioMetrics && (
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>SHAKE CONF.</div>
            <div style={statValStyle}>{audioMetrics.shakeConfidence}%</div>
          </div>
        )}
      </div>

      {/* Experimental Disclaimer */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '14px'
      }}>
        * Experimental estimate based on packet geometry {audioMetrics ? '+ sound analysis' : ''}.
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {!audioMetrics && (
          <button 
            className="glass-button" 
            onClick={() => setShowShakeAnalyzer(true)} 
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--pastel-yellow) 0%, var(--pastel-peach) 100%)', color: 'var(--text-dark)', border: '2px solid var(--text-dark)' }}
          >
            <Mic size={18} />
            START SHAKE TEST 🎙️
          </button>
        )}

        <button className="glass-button" onClick={onRetry} style={{ width: '100%' }}>
          <RefreshCw size={18} />
          SCAN ANOTHER SNACK
        </button>
      </div>
    </div>
  );
}

const modalStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '460px',
  width: '90%',
  margin: '0 auto',
  background: '#ffffff',
  borderRadius: '32px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
  border: '3px solid var(--text-dark)'
};

const iconBadgeStyle = (bg) => ({
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  fontSize: '28px',
  marginBottom: '10px',
  border: '2px solid var(--text-dark)'
});

const headlineStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-dark)',
  textAlign: 'center',
  marginBottom: '8px'
};

const subtextStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textAlign: 'center',
  lineHeight: 1.5
};

const statBoxStyle = {
  textAlign: 'center',
  background: '#f8fafc',
  padding: '6px 4px',
  borderRadius: '8px'
};

const statLabelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '8.5px',
  fontWeight: 700,
  color: 'var(--text-muted)'
};

const statValStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '12.5px',
  fontWeight: 700,
  color: 'var(--text-dark)',
  marginTop: '2px'
};

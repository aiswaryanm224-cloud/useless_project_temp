import React from 'react';
import { Sparkles, AlertTriangle, RefreshCw, X } from 'lucide-react';

export default function RecognitionResult({ result, measurements, onRetry, onClose }) {
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
          {result.message || 'Unable to connect to Gemini Vision service at this moment.'}
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

  // Dynamic Humor Line Generator
  const getHumorMessage = (cat, conf, brand) => {
    const categoryLower = (cat || '').toLowerCase();
    if (categoryLower.includes('chip') || categoryLower.includes('crisp')) {
      if (conf > 0.9) return "Congratulations. It appears to be actual chips (and 70% nitrogen air)! 🍿";
      return "Suspiciously chip-like. Handle with financial caution.";
    }
    if (categoryLower.includes('biscuit') || categoryLower.includes('cookie')) {
      return "Good news: this packet contains solid matter, not just vacuum air! 🍪";
    }
    if (categoryLower.includes('chocolate') || categoryLower.includes('candy')) {
      return "High sugar telemetry locked! Prepare for serotonin rush. 🍫";
    }
    if (categoryLower.includes('noodle') || categoryLower.includes('ramen')) {
      return "Emergency student survival package identified! 🍜";
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
        fontSize: '28px',
        fontWeight: 700,
        color: 'var(--text-dark)',
        textAlign: 'center',
        margin: '12px 0 4px 0'
      }}>
        {result.productName}
      </h2>

      {/* Brand & Category Tags */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        {result.brand && (
          <span className="sticker-badge" style={{ background: 'var(--pastel-yellow)', fontSize: '12px' }}>
            BRAND: {result.brand}
          </span>
        )}
        <span className="sticker-badge" style={{ background: 'var(--pastel-blue)', fontSize: '12px' }}>
          CAT: {result.category}
        </span>
        <span className="sticker-badge" style={{ background: 'var(--pastel-peach)', fontSize: '12px' }}>
          CONFIDENCE: {confidencePct}%
        </span>
      </div>

      {/* Dynamic AIR WORLD Humor Message */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '16px',
        background: 'rgba(255, 232, 154, 0.4)',
        border: '1.5px solid var(--text-dark)',
        fontFamily: 'var(--font-handwritten)',
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--text-dark)',
        textAlign: 'center',
        margin: '8px 0 16px 0',
        width: '100%'
      }}>
        "{getHumorMessage(result.category, result.confidence, result.brand)}"
      </div>

      {/* Telemetry Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%',
        margin: '8px 0 20px 0',
        background: 'rgba(255,255,255,0.7)',
        padding: '12px',
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>VISUAL WIDTH</div>
          <div style={statValStyle}>{measurements ? `${measurements.visualWidth} px` : '240 px'}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>VISUAL HEIGHT</div>
          <div style={statValStyle}>{measurements ? `${measurements.visualHeight} px` : '380 px'}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>ASPECT RATIO</div>
          <div style={statValStyle}>{measurements ? measurements.aspectRatio : '0.63'}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <button className="glass-button" onClick={onRetry} style={{ flex: 1 }}>
          <RefreshCw size={18} />
          SCAN ANOTHER
        </button>
      </div>
    </div>
  );
}

const modalStyle = {
  padding: '28px',
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
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  fontSize: '32px',
  marginBottom: '12px',
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
  textAlign: 'center'
};

const statLabelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '9px',
  fontWeight: 700,
  color: 'var(--text-muted)'
};

const statValStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--text-dark)',
  marginTop: '2px'
};

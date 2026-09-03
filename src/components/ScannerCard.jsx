import React, { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';

export default function ScannerCard({ onOpenScanner }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleScanClick = () => {
    if (onOpenScanner) {
      onOpenScanner();
    }
  };

  return (
    <div 
      className="glass-panel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        maxWidth: '560px',
        margin: '0 auto',
        borderRadius: '36px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 249, 239, 0.85) 100%)',
        boxShadow: isHovered 
          ? '0 24px 48px -12px rgba(255, 141, 122, 0.25), 0 12px 28px -6px rgba(32, 36, 43, 0.08)' 
          : 'var(--glass-shadow)'
      }}
    >
      {/* Dynamic Hover Tooltip Bubble */}
      {isHovered && (
        <div className="speech-bubble" style={{ top: '-18px', transform: 'rotate(-3deg)', background: 'var(--pastel-yellow)' }}>
          Are you REALLY sure? 👀
        </div>
      )}

      {/* Header Tag */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 16px',
        borderRadius: '999px',
        background: 'var(--pastel-blue)',
        color: '#1e40af',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '13px',
        marginBottom: '20px'
      }}>
        <Sparkles size={14} />
        READY TO SCAN
      </div>

      {/* Main Glass Lens Reticle Viewport */}
      <div style={{
        position: 'relative',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #ffffff 0%, var(--pastel-peach) 100%)',
        border: '4px solid #ffffff',
        boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(255, 141, 122, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        margin: '16px 0 24px 0',
        cursor: 'pointer'
      }} onClick={handleScanClick}>
        {/* Pulsing Concentric Outer Ring */}
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          border: '2px dashed var(--pastel-coral)',
          animation: 'radar-sweep 12s linear infinite'
        }} />

        {/* Lens Icon / Reticle */}
        <div style={{
          fontSize: '48px',
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isHovered ? 'scale(1.2) rotate(15deg)' : 'scale(1)'
        }}>
          ✦
        </div>
      </div>

      {/* Prompt Subtext */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '24px'
      }}>
        Point a snack at me 👀
      </p>

      {/* Primary CTA Button */}
      <button 
        className="glass-button"
        onClick={handleScanClick}
        style={{ width: '100%', maxWidth: '300px' }}
      >
        <Camera size={20} />
        SCAN A SNACK
      </button>
    </div>
  );
}

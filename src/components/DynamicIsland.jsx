import React from 'react';
import { Activity, Disc } from 'lucide-react';

export default function DynamicIsland() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 20px',
      borderRadius: '9999px',
      background: 'rgba(8, 11, 18, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 242, 254, 0.25)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.15)',
      transition: 'all 0.3s ease'
    }}>
      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Disc size={14} className="animate-radar" color="var(--accent-cyan)" />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '1.2px',
          color: '#ffffff'
        }}>
          AIR DETECTOR
        </span>
      </div>

      <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.15)' }} />

      {/* Animated Soundwave / Pulsing Bar Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span style={barStyle('0.1s')} />
        <span style={barStyle('0.3s')} />
        <span style={barStyle('0.2s')} />
        <span style={barStyle('0.4s')} />
      </div>

      {/* Status Message */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        Waiting for suspicious packaging...
      </span>
    </div>
  );
}

const barStyle = (delay) => ({
  width: '2px',
  height: '10px',
  backgroundColor: 'var(--accent-cyan)',
  borderRadius: '2px',
  animation: `wave-bounce 1s ease-in-out infinite alternate`,
  animationDelay: delay
});

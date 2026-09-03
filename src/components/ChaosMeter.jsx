import React from 'react';
import { Zap } from 'lucide-react';

export default function ChaosMeter() {
  return (
    <div className="glass-panel" style={{
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      background: 'rgba(255, 255, 255, 0.85)',
      borderRadius: '24px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="#c2410c" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-dark)'
          }}>
            CHAOS LEVEL
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: '#c2410c'
        }}>
          87%
        </span>
      </div>

      {/* Pastel Progress Bar */}
      <div style={{
        height: '10px',
        width: '100%',
        backgroundColor: '#f1f5f9',
        borderRadius: '999px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{
          height: '100%',
          width: '87%',
          background: 'linear-gradient(90deg, var(--pastel-yellow) 0%, var(--pastel-coral) 100%)',
          borderRadius: '999px'
        }} />
      </div>

      {/* Subtext */}
      <p style={{
        fontFamily: 'var(--font-handwritten)',
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        marginTop: '2px'
      }}>
        "Your snack choices are concerning." ⚡
      </p>
    </div>
  );
}

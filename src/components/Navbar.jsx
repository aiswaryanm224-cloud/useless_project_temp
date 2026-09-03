import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header style={{
      position: 'fixed',
      top: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '960px',
      zIndex: 100
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '10px 24px',
        borderRadius: '9999px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 30px rgba(255, 141, 122, 0.12), 0 2px 10px rgba(32, 36, 43, 0.04)'
      }}>
        {/* Playful Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--pastel-peach)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            fontSize: '16px'
          }}>
            🍿
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--text-dark)',
            letterSpacing: '0.5px'
          }}>
            AIR WORLD
          </span>
        </div>

        {/* Center Nav Links */}
        <div className="nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--text-muted)'
        }}>
          <a href="#scanner" style={linkStyle}>Scanner</a>
          <a href="#how-it-works" style={linkStyle}>How it works</a>
          <a href="#about" style={linkStyle}>About</a>
        </div>

        {/* Right System Online Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'var(--pastel-mint)',
          border: '1px solid rgba(115, 207, 166, 0.4)',
          color: '#15803d',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '12px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#16a34a',
            boxShadow: '0 0 8px #16a34a'
          }} />
          System Online
        </div>
      </nav>
    </header>
  );
}

const linkStyle = {
  color: 'var(--text-dark)',
  textDecoration: 'none',
  transition: 'color 0.2s ease, transform 0.2s ease',
  cursor: 'pointer'
};

import React from 'react';
import ScannerCard from './ScannerCard';
import BentoGrid from './BentoGrid';
import ChaosMeter from './ChaosMeter';
import TelemetryBadges from './TelemetryBadges';
import { YellowChipsCharacter, RedChipsCharacter, TinyChipMascot } from './SnackCharacters';
import { Sparkles, Star } from 'lucide-react';

export default function Hero({ onOpenScanner }) {
  return (
    <section style={{
      position: 'relative',
      zIndex: 1,
      minHeight: '100vh',
      paddingTop: '100px',
      paddingBottom: '40px',
      maxWidth: '1140px',
      margin: '0 auto',
      paddingLeft: '20px',
      paddingRight: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      alignItems: 'center'
    }}>
      {/* Cartoon Character Left (Positioned Floating on Desktop) */}
      <div 
        className="character-container-left"
        style={{
          position: 'absolute',
          top: '140px',
          left: '-20px',
          zIndex: 10
        }}
      >
        <YellowChipsCharacter />
      </div>

      {/* Cartoon Character Right (Positioned Floating on Desktop) */}
      <div 
        className="character-container-right"
        style={{
          position: 'absolute',
          top: '140px',
          right: '-20px',
          zIndex: 10
        }}
      >
        <RedChipsCharacter />
      </div>

      {/* Floating Tiny Chip Mascot */}
      <div style={{ position: 'absolute', top: '90px', right: '22%', zIndex: 12 }}>
        <TinyChipMascot />
      </div>

      {/* Main Hero Typography Section */}
      <div style={{ textAlign: 'center', maxWidth: '780px', position: 'relative' }}>
        {/* Decorative Doodles */}
        <div style={{ position: 'absolute', top: '-10px', left: '10px', color: 'var(--pastel-coral)' }}>
          <Star size={22} fill="var(--pastel-coral)" />
        </div>
        <div style={{ position: 'absolute', top: '20px', right: '15px', color: 'var(--pastel-yellow)' }}>
          <Sparkles size={26} />
        </div>

        {/* Small Eyebrow Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 18px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1.5px solid var(--text-dark)',
          boxShadow: '2px 2px 0px var(--text-dark)',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '14px' }}>✨</span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--text-dark)'
          }}>
            THE WORLD'S MOST UNNECESSARY SNACK ANALYZER
          </span>
        </div>

        {/* Centered Friendly Brand Name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(44px, 7vw, 76px)',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--text-dark)',
          marginBottom: '16px',
          letterSpacing: '-1px'
        }}>
          AIR WORLD
        </h1>

        {/* Catchy Editorial Headlines */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 3.2vw, 30px)',
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--text-dark)',
          marginBottom: '14px'
        }}>
          Do you think you're too clever to buy that's worth your money?
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 2vw, 20px)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          Maybe you're eating <span className="highlight-air">air 💨</span>. In rare cases, it will be <span className="highlight-chips">chips 🍿</span>.
        </p>
      </div>

      {/* Floating Sticker Telemetry Strip */}
      <div style={{ width: '100%' }}>
        <TelemetryBadges />
      </div>

      {/* Main Single Scanner Container */}
      <div style={{ width: '100%', maxWidth: '640px' }} id="scanner">
        <ScannerCard onOpenScanner={onOpenScanner} />
      </div>

      {/* Chaos Meter & How It Works Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        width: '100%',
        marginTop: '10px'
      }} className="hero-grid">
        <div style={{ gridColumn: 'span 4' }}>
          <ChaosMeter />
        </div>
        <div style={{ gridColumn: 'span 8' }} id="how-it-works">
          <BentoGrid />
        </div>
      </div>

      {/* Friendly Light Footer */}
      <footer style={{
        marginTop: '30px',
        width: '100%',
        paddingTop: '20px',
        borderTop: '2px dashed rgba(32, 36, 43, 0.1)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '12px'
      }} id="about">
        <div>AIR WORLD © 2026 — Designed with absurd snack seriousness 🍿</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>STATUS: 0% CHIPS</span>
          <span>AIR DENSITY: 99.9%</span>
        </div>
      </footer>
    </section>
  );
}

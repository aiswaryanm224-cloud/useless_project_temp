import React from 'react';

export default function TelemetryBadges() {
  const stickers = [
    { text: 'PACKET DETECTED 👀', bg: 'var(--pastel-peach)', color: '#c2410c', rotate: '-2deg' },
    { text: 'AIR CONTENT: SUSPECTED 💨', bg: 'var(--pastel-blue)', color: '#1e40af', rotate: '3deg' },
    { text: 'CHIP DENSITY: QUESTIONABLE 🔍', bg: 'var(--pastel-yellow)', color: '#854d0e', rotate: '-1deg' },
    { text: 'REGRET INDEX: HIGH 💀', bg: 'var(--pastel-lavender)', color: '#6b21a8', rotate: '2deg' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justify: 'center',
      gap: '12px',
      margin: '16px 0'
    }}>
      {stickers.map((item, idx) => (
        <div 
          key={idx}
          className="sticker-badge"
          style={{
            background: item.bg,
            color: item.color,
            transform: `rotate(${item.rotate})`
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}

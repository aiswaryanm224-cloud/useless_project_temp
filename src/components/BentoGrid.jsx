import React from 'react';

export default function BentoGrid() {
  const steps = [
    {
      num: '01',
      title: 'LOOK',
      desc: 'Point your camera at literally any snack.',
      icon: '👀',
      bg: 'var(--pastel-blue)'
    },
    {
      num: '02',
      title: 'SCAN',
      desc: 'We investigate the packet with absolutely unnecessary seriousness.',
      icon: '🔬',
      bg: 'var(--pastel-yellow)'
    },
    {
      num: '03',
      title: 'DISCOVER',
      desc: 'Find out whether you bought food, air, or financial regret.',
      icon: '🍿',
      bg: 'var(--pastel-peach)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {steps.map((s, idx) => (
        <div 
          key={idx} 
          className="glass-panel"
          style={{
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: s.bg,
              color: 'var(--text-dark)'
            }}>
              {s.num} / {s.title}
            </span>
            <span style={{ fontSize: '24px' }}>{s.icon}</span>
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            "{s.desc}"
          </p>
        </div>
      ))}
    </div>
  );
}

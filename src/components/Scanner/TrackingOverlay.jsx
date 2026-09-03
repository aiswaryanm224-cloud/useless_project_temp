import React from 'react';

/**
 * Tracking Overlay Component
 * Renders animated tracking corners, bounding lines, and real-time visual pixel measurements
 * over the video viewport. Pointer events are disabled to avoid blocking video.
 */
export default function TrackingOverlay({ box, measurements, status, videoWidth, videoHeight }) {
  if (!box || !videoWidth || !videoHeight) {
    return (
      <div style={overlayContainerStyle}>
        <div style={searchingBoxStyle}>
          <div className="animate-radar" style={scanningCircleStyle}>✦</div>
          <span style={searchingTextStyle}>SEARCHING FOR SUSPICIOUS PACKAGING...</span>
        </div>
      </div>
    );
  }

  // Convert raw video box coordinates to percentage of current video container
  const leftPct = (box.x / videoWidth) * 100;
  const topPct = (box.y / videoHeight) * 100;
  const widthPct = (box.width / videoWidth) * 100;
  const heightPct = (box.height / videoHeight) * 100;

  const isReady = status === 'CAPTURE_READY';
  const strokeColor = isReady ? 'var(--pastel-green)' : 'var(--pastel-coral)';
  const nodeBg = isReady ? '#16a34a' : '#ff6b52';

  return (
    <div style={overlayContainerStyle}>
      {/* Bounding Box Container */}
      <div style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        border: `2px dashed ${strokeColor}`,
        borderRadius: '16px',
        boxShadow: isReady ? '0 0 20px rgba(115, 207, 166, 0.4)' : '0 0 20px rgba(255, 141, 122, 0.4)',
        transition: 'all 0.1s linear',
        pointerEvents: 'none'
      }}>
        {/* 4 Corner Tracking Nodes */}
        <div style={{ ...cornerNodeStyle, top: '-6px', left: '-6px', background: nodeBg }} />
        <div style={{ ...cornerNodeStyle, top: '-6px', right: '-6px', background: nodeBg }} />
        <div style={{ ...cornerNodeStyle, bottom: '-6px', left: '-6px', background: nodeBg }} />
        <div style={{ ...cornerNodeStyle, bottom: '-6px', right: '-6px', background: nodeBg }} />

        {/* 4 Midpoint Edge Nodes */}
        <div style={{ ...midNodeStyle, top: '-5px', left: '50%', transform: 'translateX(-50%)', background: nodeBg }} />
        <div style={{ ...midNodeStyle, bottom: '-5px', left: '50%', transform: 'translateX(-50%)', background: nodeBg }} />
        <div style={{ ...midNodeStyle, left: '-5px', top: '50%', transform: 'translateY(-50%)', background: nodeBg }} />
        <div style={{ ...midNodeStyle, right: '-5px', top: '50%', transform: 'translateY(-50%)', background: nodeBg }} />

        {/* Live Packet Label Badge */}
        <div style={{
          position: 'absolute',
          top: '-32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isReady ? 'var(--pastel-mint)' : 'var(--pastel-yellow)',
          color: 'var(--text-dark)',
          border: '1.5px solid var(--text-dark)',
          borderRadius: '999px',
          padding: '2px 10px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '11px',
          whiteSpace: 'nowrap'
        }}>
          {isReady ? '● PACKET TRACKED' : '◯ PACKET DETECTED 👀'}
        </div>

        {/* Measurements Tag at Bottom */}
        {measurements && (
          <div style={{
            position: 'absolute',
            bottom: '-34px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '12px',
            padding: '3px 8px',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '10px',
            color: 'var(--text-dark)',
            display: 'flex',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}>
            <span>W: {measurements.visualWidth}px</span>
            <span>H: {measurements.visualHeight}px</span>
            <span>RATIO: {measurements.aspectRatio}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayContainerStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
  overflow: 'hidden'
};

const searchingBoxStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'center',
  gap: '12px'
};

const scanningCircleStyle = {
  fontSize: '36px',
  color: 'var(--pastel-coral)'
};

const searchingTextStyle = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '13px',
  color: '#ffffff',
  background: 'rgba(32, 36, 43, 0.6)',
  padding: '6px 14px',
  borderRadius: '999px',
  backdropFilter: 'blur(8px)'
};

const cornerNodeStyle = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '2px solid #ffffff',
  boxShadow: '0 0 6px rgba(0,0,0,0.3)'
};

const midNodeStyle = {
  position: 'absolute',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  border: '1.5px solid #ffffff'
};

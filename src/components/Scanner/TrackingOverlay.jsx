import React from 'react';

/**
 * Tracking Overlay Component
 * Renders animated tracking corners, bounding lines, real-time positioning guidance,
 * 3-2-1 auto-scan countdown indicators, and packet hunting FIND mode statuses.
 */
export default function TrackingOverlay({ 
  box, 
  measurements, 
  status, 
  isFindMode, 
  countdownVal, 
  countdownInterrupted,
  videoWidth, 
  videoHeight 
}) {
  if (!box || !videoWidth || !videoHeight) {
    return (
      <div style={overlayContainerStyle}>
        <div style={searchingBoxStyle}>
          <div className="animate-radar" style={scanningCircleStyle}>✦</div>
          <span style={searchingTextStyle}>
            {isFindMode ? 'LOOKING FOR THE SUSPICIOUS PACKET...' : 'PLACE SNACK HERE 👀'}
          </span>
          {isFindMode && (
            <span style={subHintStyle}>Move the packet back into view 👀</span>
          )}
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
  const isLost = status === 'LOST';

  const strokeColor = isLost 
    ? 'var(--pastel-coral)' 
    : isReady 
      ? 'var(--pastel-green)' 
      : 'var(--pastel-yellow)';

  const nodeBg = isLost ? '#ff4d4d' : isReady ? '#16a34a' : '#eab308';

  // Guidance badge text
  let badgeText = '◯ PACKET DETECTED 👀';
  if (isLost) {
    badgeText = '❓ WHERE DID IT GO?';
  } else if (isFindMode) {
    badgeText = '🎯 TARGET FOUND 👀';
  } else if (countdownVal !== null && countdownVal > 0) {
    badgeText = `HOLD STILL... ${countdownVal}`;
  } else if (countdownVal === 0) {
    badgeText = 'SNAP! 📸';
  } else if (countdownInterrupted) {
    badgeText = 'WHOOPS — HOLD STILL 👀';
  } else if (isReady) {
    badgeText = '● PERFECT. HOLD STILL...';
  } else if (measurements?.guidanceHint) {
    badgeText = measurements.guidanceHint;
  }

  return (
    <div style={overlayContainerStyle}>
      {/* 3-2-1 Countdown Large Center Overlay */}
      {countdownVal !== null && (
        <div style={countdownCenterStyle}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: countdownVal === 0 ? '48px' : '72px',
            fontWeight: 800,
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
            animation: 'pulse 0.4s ease-out'
          }}>
            {countdownVal === 0 ? 'SNAP! 📸' : countdownVal}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--pastel-yellow)'
          }}>
            AUTO SCANNING PACKET...
          </div>
        </div>
      )}

      {/* Bounding Box Container */}
      <div style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        border: `3px dashed ${strokeColor}`,
        borderRadius: '18px',
        boxShadow: isReady ? '0 0 25px rgba(115, 207, 166, 0.5)' : '0 0 20px rgba(255, 141, 122, 0.4)',
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

        {/* Live Packet Guidance Label Badge */}
        <div style={{
          position: 'absolute',
          top: '-34px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isLost 
            ? 'var(--pastel-peach)' 
            : isFindMode 
              ? 'var(--pastel-yellow)' 
              : isReady 
                ? 'var(--pastel-mint)' 
                : 'var(--pastel-blue)',
          color: 'var(--text-dark)',
          border: '1.5px solid var(--text-dark)',
          borderRadius: '999px',
          padding: '3px 12px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          {badgeText}
        </div>

        {/* Measurements Tag at Bottom */}
        {measurements && (
          <div style={{
            position: 'absolute',
            bottom: '-34px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
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
  gap: '8px'
};

const scanningCircleStyle = {
  fontSize: '36px',
  color: 'var(--pastel-coral)'
};

const searchingTextStyle = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '14px',
  color: '#ffffff',
  background: 'rgba(32, 36, 43, 0.75)',
  padding: '8px 18px',
  borderRadius: '999px',
  backdropFilter: 'blur(8px)'
};

const subHintStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--pastel-yellow)',
  fontWeight: 600
};

const countdownCenterStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 25,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justify: 'center',
  background: 'rgba(10, 14, 22, 0.45)',
  backdropFilter: 'blur(3px)'
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

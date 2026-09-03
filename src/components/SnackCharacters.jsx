import React from 'react';

// Left Character: Yellow Chips Packet with Magnifying Glass
export function YellowChipsCharacter() {
  return (
    <div className="animate-character" style={{
      position: 'relative',
      width: '180px',
      height: '220px',
      cursor: 'pointer',
      transition: 'transform 0.3s ease'
    }}>
      {/* Speech Bubble */}
      <div className="speech-bubble" style={{ top: '-15px', right: '-20px', transform: 'rotate(5deg)' }}>
        Hmmmm... 👀
      </div>

      <svg viewBox="0 0 200 240" width="100%" height="100%">
        {/* Soft Drop Shadow */}
        <ellipse cx="100" cy="225" rx="65" ry="10" fill="rgba(32, 36, 43, 0.08)" />

        {/* Yellow Chips Packet Body */}
        <path 
          d="M35,30 Q30,25 35,20 L165,20 Q170,25 165,30 L155,200 Q150,210 140,210 L60,210 Q50,210 45,200 Z" 
          fill="#FFE89A" 
          stroke="#20242B" 
          strokeWidth="4" 
          strokeLinejoin="round" 
        />
        {/* Zig-zag Crimped Edges Top & Bottom */}
        <path d="M35,20 L40,25 L45,20 L50,25 L55,20 L60,25 L65,20 L70,25 L75,20 L80,25 L85,20 L90,25 L95,20 L100,25 L105,20 L110,25 L115,20 L120,25 L125,20 L130,25 L135,20 L140,25 L145,20 L150,25 L155,20 L160,25 L165,20" fill="none" stroke="#20242B" strokeWidth="3" />

        {/* Packet Label Deco */}
        <path d="M45,80 Q100,65 155,80 L150,150 Q100,165 50,150 Z" fill="#FFD9C7" stroke="#20242B" strokeWidth="3" />
        <text x="100" y="122" fontFamily="Fredoka" fontSize="18" fontWeight="bold" fill="#20242B" textAnchor="middle">AIR?</text>

        {/* Confused/Suspicious Eyes */}
        <circle cx="80" cy="100" r="10" fill="#20242B" />
        <circle cx="83" cy="98" r="3.5" fill="#FFFFFF" />

        <circle cx="120" cy="100" r="12" fill="#20242B" />
        <circle cx="118" cy="97" r="4" fill="#FFFFFF" />

        {/* Suspicious Eyebrows */}
        <path d="M70,86 L90,92" stroke="#20242B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M110,88 L130,84" stroke="#20242B" strokeWidth="3.5" strokeLinecap="round" />

        {/* Cute Mouth */}
        <path d="M92,130 Q100,124 108,130" stroke="#20242B" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Magnifying Glass in Hand */}
        <g transform="translate(130, 115) rotate(-15)">
          <line x1="0" y1="0" x2="-25" y2="25" stroke="#20242B" strokeWidth="6" strokeLinecap="round" />
          <circle cx="15" cy="-15" r="22" fill="rgba(201, 228, 255, 0.6)" stroke="#20242B" strokeWidth="4" />
          <path d="M5,-22 Q18,-25 24,-12" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Rosy Cheeks */}
        <ellipse cx="68" cy="112" rx="6" ry="4" fill="#FF8D7A" opacity="0.6" />
        <ellipse cx="132" cy="112" rx="6" ry="4" fill="#FF8D7A" opacity="0.6" />
      </svg>
    </div>
  );
}

// Right Character: Red Chips Packet with Sunglasses
export function RedChipsCharacter() {
  return (
    <div className="animate-character" style={{
      position: 'relative',
      width: '180px',
      height: '220px',
      cursor: 'pointer',
      animationDelay: '1.5s'
    }}>
      {/* Speech Bubble */}
      <div className="speech-bubble" style={{ top: '-15px', left: '-25px', transform: 'rotate(-6deg)' }}>
        What's inside? 🕶️
      </div>

      <svg viewBox="0 0 200 240" width="100%" height="100%">
        {/* Soft Drop Shadow */}
        <ellipse cx="100" cy="225" rx="65" ry="10" fill="rgba(32, 36, 43, 0.08)" />

        {/* Red Chips Packet Body */}
        <path 
          d="M35,30 Q30,25 35,20 L165,20 Q170,25 165,30 L155,200 Q150,210 140,210 L60,210 Q50,210 45,200 Z" 
          fill="#FF8D7A" 
          stroke="#20242B" 
          strokeWidth="4" 
          strokeLinejoin="round" 
        />
        {/* Crimped Edges */}
        <path d="M35,20 L40,25 L45,20 L50,25 L55,20 L60,25 L65,20 L70,25 L75,20 L80,25 L85,20 L90,25 L95,20 L100,25 L105,20 L110,25 L115,20 L120,25 L125,20 L130,25 L135,20 L140,25 L145,20 L150,25 L155,20 L160,25 L165,20" fill="none" stroke="#20242B" strokeWidth="3" />

        {/* Center Label Deco */}
        <polygon points="50,75 150,75 140,150 60,150" fill="#FFE89A" stroke="#20242B" strokeWidth="3" />
        <text x="100" y="122" fontFamily="Fredoka" fontSize="18" fontWeight="bold" fill="#20242B" textAnchor="middle">CHIPS!</text>

        {/* Cool Sunglasses */}
        <g transform="translate(0, 10)">
          <path d="M60,82 L98,82 L92,104 L66,104 Z" fill="#20242B" stroke="#20242B" strokeWidth="2" />
          <path d="M102,82 L140,82 L134,104 L108,104 Z" fill="#20242B" stroke="#20242B" strokeWidth="2" />
          <line x1="98" y1="86" x2="102" y2="86" stroke="#20242B" strokeWidth="4" />
          {/* Glass Specular Reflection Lines */}
          <line x1="68" y1="86" x2="80" y2="100" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="110" y1="86" x2="122" y2="100" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Mischievous Smirk */}
        <path d="M90,132 Q105,142 118,128" stroke="#20242B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Small Floating Chip / Air Mascot
export function TinyChipMascot() {
  return (
    <div className="animate-float" style={{
      position: 'absolute',
      width: '60px',
      height: '60px',
      filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))'
    }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="40" fill="#C9E4FF" stroke="#20242B" strokeWidth="4" />
        <circle cx="38" cy="45" r="5" fill="#20242B" />
        <circle cx="62" cy="45" r="5" fill="#20242B" />
        <path d="M42,62 Q50,68 58,62" stroke="#20242B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

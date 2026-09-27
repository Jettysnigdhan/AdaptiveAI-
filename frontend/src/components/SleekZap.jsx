import React from 'react';

/**
 * SleekZap — High-Precision Glowing Vector Lightning Icon.
 * Replaces blurry/pixelated unicode emojis and low-res icons with a state-of-the-art vector glyph.
 */
export default function SleekZap({
  size = 15,
  glow = true,
  variant = 'emerald', // 'emerald' | 'cyan' | 'electric' | 'amber' | 'white'
  style = {},
  className = '',
}) {
  const gradientId = `sleekZapGrad-${variant}-${size}`;

  const theme = {
    emerald: {
      from: '#4ade80',
      mid: '#22c55e',
      to: '#10b981',
      stroke: '#4ade80',
      glow: 'rgba(74, 222, 128, 0.65)',
    },
    cyan: {
      from: '#00F0FF',
      mid: '#38bdf8',
      to: '#818cf8',
      stroke: '#00F0FF',
      glow: 'rgba(0, 240, 255, 0.65)',
    },
    electric: {
      from: '#818cf8',
      mid: '#a78bfa',
      to: '#c084fc',
      stroke: '#a78bfa',
      glow: 'rgba(129, 140, 248, 0.65)',
    },
    amber: {
      from: '#fbbf24',
      mid: '#f59e0b',
      to: '#d97706',
      stroke: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.65)',
    },
    white: {
      from: '#ffffff',
      mid: '#e4e4e7',
      to: '#a1a1aa',
      stroke: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.6)',
    },
  }[variant] || {
    from: '#4ade80',
    mid: '#22c55e',
    to: '#10b981',
    stroke: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.65)',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: glow ? `drop-shadow(0 0 6px ${theme.glow})` : 'none',
        flexShrink: 0,
        ...style,
      }}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor={theme.from} />
          <stop offset="0.5" stopColor={theme.mid} />
          <stop offset="1" stopColor={theme.to} />
        </linearGradient>
      </defs>
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill={`url(#${gradientId})`}
        stroke={theme.stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

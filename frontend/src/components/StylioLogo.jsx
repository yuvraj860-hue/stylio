import React from 'react';

export default function StylioLogo({ size = 26, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="stylioNavGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e2b3" />
          <stop offset="35%" stopColor="#c5a059" />
          <stop offset="70%" stopColor="#e8cf8d" />
          <stop offset="100%" stopColor="#8f6e2b" />
        </linearGradient>
      </defs>

      <polygon
        points="26,18 74,18 92,36 50,90 8,36"
        stroke="url(#stylioNavGold)"
        strokeWidth="3.2"
        strokeLinejoin="round"
        fill="none"
      />

      <line x1="40" y1="18" x2="28" y2="36" stroke="url(#stylioNavGold)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="60" y1="18" x2="72" y2="36" stroke="url(#stylioNavGold)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="26" y1="18" x2="50" y2="36" stroke="url(#stylioNavGold)" strokeWidth="1.4" opacity="0.8" />
      <line x1="74" y1="18" x2="50" y2="36" stroke="url(#stylioNavGold)" strokeWidth="1.4" opacity="0.8" />

      <line x1="8" y1="36" x2="92" y2="36" stroke="url(#stylioNavGold)" strokeWidth="2" strokeLinecap="round" />

      <line x1="28" y1="36" x2="50" y2="90" stroke="url(#stylioNavGold)" strokeWidth="1.5" opacity="0.8" />
      <line x1="72" y1="36" x2="50" y2="90" stroke="url(#stylioNavGold)" strokeWidth="1.5" opacity="0.8" />

      <path
        d="M64,28 C58,24 43,24 38,30 C33,36 36,44 48,47 C62,51 66,58 63,67 C59,76 43,76 35,71 M33,70 L38,65 M66,29 L61,34"
        stroke="url(#stylioNavGold)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <polygon points="50,44 52,48 56,50 52,52 50,56 48,52 44,50 48,48" fill="url(#stylioNavGold)" />
    </svg>
  );
}

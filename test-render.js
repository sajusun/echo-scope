import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

// Version 1: Solid Vibrant Green Squircle with Crisp White/Mint Echo Waves
const svgEcho1 = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="echoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <!-- Squircle -->
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#echoBg)" />
  <path d="M 34 8 L 94 8 C 112 8 120 16 120 34 L 120 40 C 120 22 112 12 94 12 L 34 12 C 16 12 8 22 8 40 L 8 34 C 8 16 16 8 34 8 Z" fill="#ffffff" opacity="0.18" />

  <!-- Center Pulse Dot -->
  <circle cx="44" cy="64" r="10" fill="#ffffff" />

  <!-- Echo Wave 1 (Inner) -->
  <path d="M 58 46 C 68 51 74 57 74 64 C 74 71 68 77 58 82" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />

  <!-- Echo Wave 2 (Middle) -->
  <path d="M 74 34 C 90 42 100 52 100 64 C 100 76 90 86 74 94" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
</svg>
`;

// Version 2: Modern Dark Cyber Green Radar Scope
const svgEcho2 = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <!-- Dark green squircle -->
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#darkBg)" />
  <rect x="5" y="5" width="118" height="118" rx="29" fill="none" stroke="url(#neonGreen)" stroke-width="4" stroke-opacity="0.85" />

  <!-- Concentric Radar Echo Circles -->
  <circle cx="64" cy="64" r="12" fill="#34d399" />
  <circle cx="64" cy="64" r="28" fill="none" stroke="#34d399" stroke-width="6" stroke-dasharray="14 8" stroke-linecap="round" />
  <circle cx="64" cy="64" r="44" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" opacity="0.8" />
  
  <!-- Oscilloscope cross line -->
  <line x1="28" y1="64" x2="100" y2="64" stroke="#6ee7b7" stroke-width="3" stroke-dasharray="6 6" opacity="0.6" />
</svg>
`;

// Version 3: Clean Symmetrical Soundwave / Realtime Broadcast (Like Spotify/Pusher Echo)
const svgEcho3 = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#greenGrad)" />
  <path d="M 34 8 L 94 8 C 112 8 120 16 120 34 L 120 40 C 120 22 112 12 94 12 L 34 12 C 16 12 8 22 8 40 L 8 34 C 8 16 16 8 34 8 Z" fill="#ffffff" opacity="0.18" />

  <!-- Centered Pulsing Echo Broadcast Signal -->
  <circle cx="64" cy="64" r="9" fill="#ffffff" />
  
  <!-- Left Waves -->
  <path d="M 50 48 C 42 53 38 58 38 64 C 38 70 42 75 50 80" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
  <path d="M 36 36 C 24 44 18 53 18 64 C 18 75 24 84 36 92" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />

  <!-- Right Waves -->
  <path d="M 78 48 C 86 53 90 58 90 64 C 90 70 86 75 78 80" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
  <path d="M 92 36 C 104 44 110 53 110 64 C 110 75 104 84 92 92" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
</svg>
`;

for (const [name, svg] of [['echo1', svgEcho1], ['echo2', svgEcho2], ['echo3', svgEcho3]]) {
  for (const size of [128, 32]) {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    fs.writeFileSync(`test-${name}-${size}.png`, resvg.render().asPng());
  }
}
console.log('Saved EchoScope tests');

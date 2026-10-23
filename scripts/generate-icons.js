import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svg = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
  </defs>
  <!-- Sleek rounded squircle -->
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#greenGrad)" />
  
  <!-- Subtle top inner highlight for depth -->
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

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const size of [16, 32, 48, 128]) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngBuffer = resvg.render().asPng();
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated high-res anti-aliased icon: ${filePath} (${size}x${size})`);
}

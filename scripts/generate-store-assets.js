import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const outDir = path.resolve('store_assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Store Logo 300x300
const logoSvg = `
<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
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

const resvg300 = new Resvg(logoSvg, { fitTo: { mode: 'width', value: 300 } });
fs.writeFileSync(path.join(outDir, 'echoscope-logo-300x300.png'), resvg300.render().asPng());
console.log('Generated echoscope-logo-300x300.png');

// 2. Small Promotional Tile (440 x 280)
const promoSmallSvg = `
<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06120e" />
      <stop offset="100%" stop-color="#02241b" />
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="440" height="280" fill="url(#bgGrad)" />
  <circle cx="220" cy="110" r="140" fill="#10b981" opacity="0.08" filter="blur(40px)" />
  
  <!-- Centered Logo Badge -->
  <g transform="translate(180, 50)" filter="url(#shadow)">
    <rect width="80" height="80" rx="20" fill="url(#brandGrad)" />
    <circle cx="40" cy="40" r="6" fill="#ffffff" />
    <!-- Left Waves -->
    <path d="M 31 30 C 26 33 23 36 23 40 C 23 44 26 47 31 50" 
          fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
    <path d="M 22 22 C 14 27 10 33 10 40 C 10 47 14 53 22 58" 
          fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
    <!-- Right Waves -->
    <path d="M 49 30 C 54 33 57 36 57 40 C 57 44 54 47 49 50" 
          fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
    <path d="M 58 22 C 66 27 70 33 70 40 C 70 47 66 53 58 58" 
          fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
  </g>

  <!-- Title & Subtitle -->
  <text x="220" y="175" font-size="28" font-weight="800" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">EchoScope</text>
  <text x="220" y="202" font-size="14" font-weight="600" font-family="'Segoe UI', Roboto, sans-serif" fill="#34d399" text-anchor="middle">Laravel Reverb and WebSocket Inspector</text>
  <text x="220" y="228" font-size="12" font-weight="500" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8" text-anchor="middle">Realtime Events • Private Auth • Pusher v7</text>
</svg>
`;

const resvgPromo = new Resvg(promoSmallSvg, { fitTo: { mode: 'width', value: 440 } });
fs.writeFileSync(path.join(outDir, 'echoscope-small-promo-440x280.png'), resvgPromo.render().asPng());
console.log('Generated echoscope-small-promo-440x280.png');

// 3. Screenshot (1280 x 800)
const screenshotSvg = `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b121e" />
      <stop offset="100%" stop-color="#041f17" />
    </linearGradient>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bg)" />
  <circle cx="950" cy="400" r="300" fill="#10b981" opacity="0.06" filter="blur(80px)" />
  <circle cx="300" cy="500" r="250" fill="#06b6d4" opacity="0.05" filter="blur(80px)" />

  <!-- Top Header Title -->
  <text x="100" y="85" font-size="42" font-weight="900" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff">EchoScope — Real-Time WebSocket Inspector</text>
  <text x="100" y="125" font-size="18" font-weight="500" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8">Debug Laravel Reverb and Pusher broadcast channels, private event auth, and JSON payloads live.</text>

  <!-- Main Inspector Console Card -->
  <g transform="translate(100, 160)" filter="url(#cardShadow)">
    <rect width="1080" height="580" rx="16" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
    
    <!-- Top Bar -->
    <rect width="1080" height="46" rx="16" fill="#0f172a" />
    <circle cx="25" cy="23" r="6" fill="#ef4444" />
    <circle cx="45" cy="23" r="6" fill="#f59e0b" />
    <circle cx="65" cy="23" r="6" fill="#10b981" />
    
    <!-- Status Indicator -->
    <circle cx="100" cy="23" r="5" fill="#10b981" />
    <text x="114" y="27" font-size="13" font-weight="600" font-family="'Segoe UI', Roboto, sans-serif" fill="#34d399">Echo Service Active (127.0.0.1:8080)</text>
    
    <text x="960" y="27" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#64748b">Socket Active</text>

    <!-- Subscriptions Row -->
    <g transform="translate(30, 70)">
      <text x="0" y="18" font-size="13" font-weight="700" font-family="'Segoe UI', Roboto, sans-serif" fill="#64748b">SUBSCRIBE CHANNEL</text>
      
      <!-- Select Type -->
      <rect x="0" y="28" width="140" height="40" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="16" y="53" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff">Private</text>

      <!-- Channel Input -->
      <rect x="155" y="28" width="340" height="40" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="175" y="53" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff">user.1</text>

      <!-- Event Name Input -->
      <rect x="510" y="28" width="320" height="40" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="530" y="53" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8">OrderCreated (Optional)</text>

      <!-- Subscribe Button -->
      <rect x="845" y="28" width="175" height="40" rx="8" fill="url(#brand)" />
      <text x="932" y="53" font-size="13" font-weight="700" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">+ Subscribe Channel</text>
    </g>

    <!-- Subscribed Badges -->
    <g transform="translate(30, 160)">
      <rect width="280" height="34" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
      <text x="16" y="22" font-size="12" font-weight="700" font-family="'Segoe UI', Roboto, sans-serif" fill="#34d399">PRIVATE: user.1  •  OrderCreated (3 events)</text>
    </g>

    <!-- Logs Filter Tabs -->
    <g transform="translate(30, 215)">
      <rect width="1020" height="38" rx="8" fill="#111827" />
      <rect x="5" y="4" width="80" height="30" rx="6" fill="#10b981" />
      <text x="45" y="24" font-size="12" font-weight="700" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">All (4)</text>
      <text x="135" y="24" font-size="12" font-weight="600" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8">Events (2)</text>
      <text x="215" y="24" font-size="12" font-weight="600" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8">System (2)</text>
      <text x="295" y="24" font-size="12" font-weight="600" font-family="'Segoe UI', Roboto, sans-serif" fill="#94a3b8">Errors (0)</text>
    </g>

    <!-- Real-time Console Log Stream Rows -->
    <g transform="translate(30, 275)">
      <!-- Row 1: System Connect -->
      <rect width="1020" height="48" rx="8" fill="#0f172a" />
      <text x="16" y="29" font-size="12" font-family="monospace" fill="#64748b">10:52:14</text>
      <rect x="85" y="14" width="60" height="20" rx="4" fill="#0284c7" />
      <text x="115" y="28" font-size="10" font-weight="800" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">SYSTEM</text>
      <text x="160" y="29" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#cbd5e1">Connected to Reverb at 127.0.0.1:8080 (Assigned Socket ID: 948212.49120)</text>

      <!-- Row 2: Subscribed -->
      <g transform="translate(0, 56)">
        <rect width="1020" height="48" rx="8" fill="#0f172a" />
        <text x="16" y="29" font-size="12" font-family="monospace" fill="#64748b">10:52:16</text>
        <rect x="85" y="14" width="65" height="20" rx="4" fill="#10b981" />
        <text x="117" y="28" font-size="10" font-weight="800" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">SUCCESS</text>
        <text x="165" y="29" font-size="13" font-family="'Segoe UI', Roboto, sans-serif" fill="#cbd5e1">Subscribed to private channel: "user.1" (Auth signature verified via /broadcasting/auth)</text>
      </g>

      <!-- Row 3: Live Broadcast Event with JSON Payload -->
      <g transform="translate(0, 112)">
        <rect width="1020" height="150" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
        <text x="16" y="29" font-size="12" font-family="monospace" fill="#64748b">10:53:01</text>
        <rect x="85" y="14" width="55" height="20" rx="4" fill="#8b5cf6" />
        <text x="112" y="28" font-size="10" font-weight="800" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">EVENT</text>
        <text x="155" y="29" font-size="13" font-weight="700" font-family="'Segoe UI', Roboto, sans-serif" fill="#ffffff">Event: App\Events\OrderCreated on "user.1"</text>
        
        <!-- JSON Payload Box -->
        <rect x="85" y="44" width="910" height="92" rx="6" fill="#020617" />
        <text x="100" y="66" font-size="12" font-family="monospace" fill="#38bdf8">{</text>
        <text x="120" y="84" font-size="12" font-family="monospace" fill="#a5f3fc">"order_id": <tspan fill="#f59e0b">10492</tspan>, "amount": <tspan fill="#f59e0b">249.00</tspan>, "currency": <tspan fill="#34d399">"USD"</tspan>, "status": <tspan fill="#34d399">"paid"</tspan></text>
        <text x="120" y="102" font-size="12" font-family="monospace" fill="#a5f3fc">"customer": { "id": <tspan fill="#f59e0b">1</tspan>, "name": <tspan fill="#34d399">"Alex Morgan"</tspan>, "email": <tspan fill="#34d399">"alex@example.com"</tspan> }</text>
        <text x="100" y="120" font-size="12" font-family="monospace" fill="#38bdf8">}</text>
      </g>
    </g>
  </g>
</svg>
`;

const resvgScreen = new Resvg(screenshotSvg, { fitTo: { mode: 'width', value: 1280 } });
fs.writeFileSync(path.join(outDir, 'echoscope-screenshot-1280x800.png'), resvgScreen.render().asPng());
console.log('Generated echoscope-screenshot-1280x800.png');

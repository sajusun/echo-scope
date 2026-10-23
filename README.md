<div align="center">

# 📡 EchoScope
### Real-Time WebSocket & Laravel Reverb Broadcast Inspector

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel Reverb](https://img.shields.io/badge/Laravel-Reverb_Ready-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://reverb.laravel.com/)
[![pnpm](https://img.shields.io/badge/pnpm-12.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**Test backend WebSocket channels and broadcast events without writing a single line of temporary frontend test code.**  
Zero boilerplate. Zero throwaway Blade templates. Native Laravel Reverb, Pusher & Raw WebSocket support.

[Features](#-features) • [Quick Start](#-quick-start) • [Mock Server Testing](#-built-in-mock-server-testing) • [Architecture](#-architecture) • [License](#-license)

</div>

---

## 💡 The Problem EchoScope Solves

When developing real-time features in **Laravel (Reverb, Soketi, Pusher)** or Node.js WebSockets:
1. Backend developers create event classes (`App\Events\OrderCreated`) and broadcast channels (`orders`, `private-user.1`).
2. To test if broadcasts are actually firing with the right payload, developers are forced to create temporary test views (`test.blade.php`), pull in Laravel Echo & Pusher.js, and inspect `console.log()` outputs.
3. Once done, they have to remember to delete these test views and routes before committing.

**EchoScope replaces all of that with a zero-setup browser console:**
- Direct connection to `localhost:8080` (or remote hosts).
- Subscribes to multiple channels simultaneously.
- Automatic Private Channel authorization (`/broadcasting/auth`).
- Live terminal feed with syntax-highlighted, expandable JSON payloads.
- 1-Click payload export to `.json` files for frontend handoff!

---

## ✨ Features

- **⚡ Native Reverb & Pusher Protocol v7:** Full protocol handshake, heartbeat ping/pong, and socket ID tracking.
- **🔒 Smart Private & Presence Channel Auth:** Sends signatures to `/broadcasting/auth` with session cookies or Bearer tokens.
- **📡 Multi-Channel Subscriptions:** Monitor `public`, `private-*`, and `presence-*` channels concurrently with per-channel event counters.
- **🔍 Filter & Search:** Real-time search by event name (e.g. `OrderShipped`) or payload text.
- **📋 1-Click Copy & Export:** Copy formatted JSON payloads with one click, or export the entire session log as a `.json` file.
- **💬 Mock Client Events (Whisper):** Send client events directly into the channel to test two-way communication.
- **🧪 Built-in Mock Laboratory:** Comes with a ready-to-run mock Reverb server so you can test broadcasts without a running Laravel app!

---

## 🚀 Quick Start

### 1. Install & Build
```bash
git clone https://github.com/sajusun/EchoScope.git
cd echoscope
pnpm install
pnpm run build
```

### 2. Load into Chrome / Brave / Edge
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `echoscope/dist` folder.

🎉 **EchoScope is installed! Pin it to your toolbar.**

---

## 🧪 Built-in Mock Server Testing

You can test EchoScope immediately without running any Laravel project:

1. In your terminal, run:
   ```bash
   pnpm run mock-server
   ```
2. Open EchoScope in your browser.
3. Click **Connect** (default: `localhost:8080`, key `reverb-key`).
4. Type `orders` or `notifications` in the channel box and click **+ Subscribe**.
5. Watch live simulated broadcasts stream in with formatted JSON payloads every 3 seconds!

---

## 🛠️ How It Works (Protocol Handshake)

```
EchoScope                                         Laravel Reverb Server
   │                                                         │
   │─── ws://localhost:8080/app/reverb-key?protocol=7 ──────>│
   │<── {"event":"pusher:connection_established"} ───────────│
   │                                                         │
   │─── {"event":"pusher:subscribe","data":{"channel":"..."}}│
   │<── {"event":"pusher_internal:subscription_succeeded"} ──│
   │                                                         │
   │<── {"event":"App\\Events\\OrderCreated","data":{...}} ──│
   │                                                         │
```

---

## 📂 Project Structure

```
echoscope/
├── manifest.json              # Chrome Manifest V3
├── package.json               # pnpm build pipeline & scripts
├── tsconfig.json              # TypeScript strict configuration
├── mock-server.js             # Standalone mock Reverb & Auth server
├── scripts/
│   ├── build.js               # Multi-target bundler
│   └── generate-icons.js      # Zero-dependency radar icon generator
├── public/icons/              # High-res 16, 32, 48, 128px PNG icons
├── src/
│   ├── types/index.ts         # Protocols & channel models
│   ├── engine/
│   │   ├── reverb-client.ts   # Pusher Protocol v7 client engine
│   │   ├── raw-client.ts      # Generic WebSocket client
│   │   └── auth-service.ts    # /broadcasting/auth resolver
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── background/
│       └── index.ts
└── dist/                      # Ready-to-load unpacked Chrome Extension
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).  
Built with ❤️ by [Sakhawat](https://github.com/sajusun).

# 📡 EchoScope – Laravel Reverb & WebSocket Live Event Inspector
> **Production-Ready Browser Extension for Testing & Debugging Real-time Broadcasts (Laravel Reverb, Pusher, Soketi, Raw WebSockets)**

---

## 🎯 Executive Summary
**EchoScope** solves the #1 developer friction in backend real-time development: **How to test WebSockets & Broadcast Events without creating throwaway test pages, frontend boilerplate, or polluting git repositories.**

It is a zero-setup Chrome Extension (Manifest V3) that connects directly to local or remote WebSocket servers (including **Laravel Reverb**, Pusher, and Soketi), handles private channel authentication, subscribes to multiple channels simultaneously, and displays formatted, searchable incoming events in real-time.

---

## 🏗️ Technical Architecture

```
[EchoScope Extension UI]
        │
        ├──────────────────────────────────────────────────────┐
        ▼                                                      ▼
[Laravel Reverb / Pusher Engine]                     [Raw WebSocket Engine]
- Protocol 7 Handshake                               - Generic ws:// or wss://
- Ping/Pong Heartbeat                                - Custom JSON / Text frames
- Socket ID capture                                  - Raw stream inspector
        │
        ▼ (For Private & Presence Channels)
[Auth Resolver]
- POST /broadcasting/auth
- Session Cookie / Bearer token
- CSRF token forwarding
        │
        ▼
[Real-Time Event Stream]
- Channel tag (orders, chat, notifications)
- Event classifier (App\Events\OrderShipped)
- Pretty JSON syntax highlighted tree
- Export to JSON / Mock payload for Frontend team
```

---

## ✨ Core Features

1. **Native Laravel Reverb & Pusher Protocol Support:**
   - Full implementation of Pusher Protocol v7 over WebSocket.
   - Handshake format: `ws://{host}:{port}/app/{key}?protocol=7&client=js&version=8.4.0-reverb`.
   - Automatic Ping/Pong heartbeat to maintain alive connection.

2. **Smart Private & Presence Channel Auth:**
   - Handles `private-*` and `presence-*` channel subscription signatures.
   - Automatically posts to `/broadcasting/auth` using cookies or bearer token.

3. **Multi-Channel & Multi-Event Management:**
   - Subscribe to any number of public, private, or presence channels at once.
   - Live counter of events per channel.
   - 1-click unsubscribe or pause stream.

4. **Live Event Stream & JSON Inspector:**
   - High-performance, virtualized live feed of incoming events.
   - Expandable, color-coded JSON tree view.
   - 1-click "Copy Payload" button.
   - Search/Filter by event name (e.g. `OrderCreated`) or payload string.

5. **1-Click Mock Broadcast Trigger (Client Whisper):**
   - Send mock client events (e.g. `client-typing` or custom messages) directly to the channel to test two-way communication.

6. **Export Payloads for Frontend Handoff:**
   - Export captured events as a `.json` file to give frontend developers exact mock data before integration.

---

## 📂 Project Structure

```
echoscope/
├── manifest.json              # Manifest V3 schema
├── package.json               # pnpm build pipeline & scripts
├── tsconfig.json              # TypeScript strict configuration
├── vite.config.ts             # Vite multi-entry builder
├── scripts/
│   ├── build.js               # Multi-target bundler
│   └── generate-icons.js      # Zero-dependency pulse/radar PNG icon generator
├── mock-server.js             # Standalone mock Reverb server for instant local testing!
├── public/icons/              # High-res 16, 32, 48, 128px PNG icons
├── src/
│   ├── types/index.ts         # TypeScript interfaces & message protocols
│   ├── engine/                # WebSocket & Reverb Engine
│   │   ├── reverb-client.ts   # Pusher v7 & Laravel Reverb client implementation
│   │   ├── raw-client.ts      # Raw WebSocket client
│   │   └── auth-service.ts    # Private channel authentication resolver
│   ├── popup/                 # Sleek Cyberpunk/Terminal UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── background/            # Manifest V3 Service Worker
│       └── index.ts
└── dist/                      # Ready-to-load unpacked Chrome Extension
```

<div align="center">

# 📡 EchoScope
### Real-Time WebSocket & Laravel Reverb Broadcast Inspector

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel Reverb](https://img.shields.io/badge/Laravel-Reverb_Ready-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://reverb.laravel.com/)
[![pnpm](https://img.shields.io/badge/pnpm-12.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**Test backend WebSocket channels and broadcast events without writing a single line of temporary frontend test code.**  
Zero throwaway Blade templates. Zero frontend boilerplate. Native support for Laravel Reverb, Pusher, Soketi, and Raw WebSockets.

[Key Features](#-key-features) • [Quick Start](#-quick-start) • [User Guide & Examples](#-complete-user-guide--examples) • [Mock Testing](#-zero-laravel-testing-built-in-mock-server) • [Troubleshooting](#-troubleshooting--faq) • [Credits](#-developer--credits)

</div>

---

## 💡 The Problem EchoScope Solves

When developing real-time features in **Laravel (Reverb, Soketi, Pusher)**:

1. **The Temporary View Trap:** Backend developers write an Event class (`App\Events\OrderCreated`) and broadcast channel (`orders`, `private-user.1`). To verify that events are actually firing with the expected payload, they are forced to spin up temporary Blade templates (`test.blade.php`), configure Laravel Echo and Pusher.js in JavaScript, and inspect `console.log()` outputs.
2. **Accidental Git Commits:** Temporary test routes, Blade templates, and testing scripts often linger in the codebase and accidentally get committed to version control.
3. **Frontend Blockers:** Frontend engineers have to wait or construct mock listeners just to see what the real backend broadcast payload schema looks like.

### 🚀 The EchoScope Solution
EchoScope transforms your browser into a dedicated **Broadcast Laboratory**:
- Connect directly to your local or remote Reverb server (`127.0.0.1:8080`, `reverb.yourdomain.com`).
- Subscribe to **Public**, **Private**, and **Presence** channels with zero frontend setup.
- Automatic Private Channel authentication (`/broadcasting/auth`).
- Watch events stream in with live formatted, syntax-highlighted JSON payloads.
- 1-Click Copy or Export JSON payloads for immediate frontend handoff.

---

## ✨ Key Features

- **⚡ Native Reverb & Pusher Protocol v7:** Full protocol handshake, heartbeat ping/pong, and socket ID tracking out of the box.
- **🎛️ 2-Column Professional Stream Console:**
  - **Left Sidebar:** Channel type selection (`Public`, `Private`, `Presence`), targeted event filters, active subscription cards, and instant unsubscribe buttons.
  - **Right Console Stream:** Real-time log feed, category tabs (`All Logs`, `Events`, `Errors`, `System Info`), and live text search.
- **🔒 Smart Channel Type Auto-Prefixing:**
  - Type `user.1` with `Private` selected &rarr; EchoScope automatically translates it to `private-user.1` over the wire, matching standard Laravel Echo conventions.
  - Type `chat.room` with `Presence` selected &rarr; EchoScope automatically prefixes `presence-chat.room`.
- **🎯 Targeted Event Filtering:** Subscribe to a channel and optionally specify an event filter (e.g. `.OrderCreated` or `MessageSent`) to only catch the exact events you are debugging.
- **📋 1-Click Copy & JSON Export:** Copy any individual payload with one click, or export the entire session log to a `.json` file for bug reports and documentation.
- **🧹 Memory & Cache Utilities:**
  - `Clear Screen UI Logs`: Clears in-memory stream without disconnecting.
  - `Clear Local Storage Cache`: Wipes saved channels and restores default configurations.
- **🧪 Built-in Mock Laboratory:** Run `pnpm run mock-server` to test WebSocket broadcasts without needing a running Laravel installation.

---

## 🚀 Quick Start

### 1. Installation & Build

```bash
# Clone the repository
git clone https://github.com/sajusun/echo-scope.git
cd echo-scope

# Install dependencies (using pnpm)
pnpm install

# Build the extension bundle
pnpm run build
```

The production-ready unpacked extension will be generated in the `./dist` folder.

### 2. Load into Chrome / Brave / Edge

1. Open your browser and navigate to `chrome://extensions/`
2. Enable **Developer mode** via the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist` folder located inside the `echo-scope` project directory:
   ```
   c:\Users\...\echo-scope\dist
   ```
5. 🎉 **EchoScope is installed!** Click the Extensions puzzle icon in Chrome and **Pin** EchoScope to your toolbar.

---

## 📖 Complete User Guide & Examples

### ⚙️ Step 1: Configure Connection Settings

Click the **Settings Gear Icon (⚙️)** in the sidebar header to open the connection drawer:

| Setting | Default Value | Description |
| :--- | :--- | :--- |
| **Protocol** | `Laravel Reverb` | Protocol dialect (`reverb` or `pusher`) |
| **Scheme** | `ws://` | `ws://` for local development, `wss://` for SSL/production |
| **Host** | `127.0.0.1` | Your Reverb server host (e.g. `127.0.0.1` or `localhost`) |
| **Port** | `8080` | Port where Reverb is running |
| **App Key** | `reverb-key` | `REVERB_APP_KEY` from your `.env` file |
| **Auth URL** | `http://your-app.test/broadcasting/auth` | Laravel broadcasting authorization endpoint |
| **Bearer Token** | *(Optional)* | Sanctum / Passport token if using API token authentication |

Click **Save & Reconnect**. The status dot in the bottom footer will turn **Green** (`Echo Service Active`).

---

### 📡 Step 2: Testing Channels & Events (Real Laravel Examples)

#### Example 1: Public Channel (`orders`)

Use public channels for events that anyone can listen to without authentication.

1. **In Laravel:** Create an event that broadcasts on a public channel:
   ```php
   namespace App\Events;

   use Illuminate\Broadcasting\Channel;
   use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
   use Illuminate\Queue\SerializesModels;

   class OrderCreated implements ShouldBroadcast
   {
       use SerializesModels;

       public function __construct(public array $order) {}

       public function broadcastOn(): array
       {
           return [
               new Channel('orders'),
           ];
       }

       public function broadcastAs(): string
       {
           return 'OrderCreated';
       }
   }
   ```

2. **In EchoScope:**
   - **Channel Type:** Select `Public`
   - **Channel Name:** `orders`
   - **Event Name (Optional):** `OrderCreated` (or leave blank to listen to all events)
   - Click **+ Subscribe Channel**

3. **Trigger Event via Artisan Tinker:**
   ```bash
   php artisan tinker
   ```
   ```php
   broadcast(new \App\Events\OrderCreated([
       'id' => 1042,
       'customer' => 'John Doe',
       'amount' => 189.50,
       'currency' => 'USD',
       'status' => 'paid'
   ]));
   ```

4. **Result:** An `EVENT` badge instantly appears in the EchoScope console stream displaying the channel `orders`, event `OrderCreated`, timestamp, and formatted JSON payload.

---

#### Example 2: Private Channel with Authentication (`user.{id}`)

Private channels require authorization via Laravel's `/broadcasting/auth` endpoint.

1. **In Laravel:** Define channel authorization in `routes/channels.php`:
   ```php
   use Illuminate\Support\Facades\Broadcast;

   Broadcast::channel('user.{id}', function ($user, $id) {
       return (int) $user->id === (int) $id;
   });
   ```

   And create the event:
   ```php
   namespace App\Events;

   use Illuminate\Broadcasting\PrivateChannel;
   use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

   class UserNotificationSent implements ShouldBroadcast
   {
       public function __construct(public int $userId, public string $message) {}

       public function broadcastOn(): array
       {
           return [
               new PrivateChannel('user.' . $this->userId),
           ];
       }
   }
   ```

2. **In EchoScope:**
   - In Settings (⚙️), ensure your **Auth URL** is set (e.g. `http://127.0.0.1:8000/broadcasting/auth` or `http://my-app.test/broadcasting/auth`).
   - If using API tokens, enter your **Bearer Token**.
   - If testing in the browser while logged into your Laravel app, session cookies are automatically forwarded!
   - **Channel Type:** Select `Private`
   - **Channel Name:** `user.1` *(Note: Do NOT type `private-`; EchoScope handles prefixing automatically!)*
   - Click **+ Subscribe Channel**

3. **Trigger Event via Artisan Tinker:**
   ```php
   broadcast(new \App\Events\UserNotificationSent(1, 'Your payout has been processed successfully.'));
   ```

4. **Result:** EchoScope sends the socket ID and channel to `/broadcasting/auth`, receives the auth signature, completes the subscription, and logs:
   - `[INFO] Connecting to private channel: "user.1"...`
   - `[SUCCESS] Subscribed to private channel: "user.1"`
   - `[EVENT] UserNotificationSent on private-user.1`

---

#### Example 3: Presence Channel (`chat.room.{id}`)

Presence channels allow you to see who else is currently subscribed to the channel.

1. **In Laravel:** Define presence channel authorization in `routes/channels.php`:
   ```php
   Broadcast::channel('chat.room.{roomId}', function ($user, $roomId) {
       return [
           'id' => $user->id,
           'name' => $user->name,
           'avatar' => $user->avatar_url,
       ];
   });
   ```

2. **In EchoScope:**
   - **Channel Type:** Select `Presence`
   - **Channel Name:** `chat.room.1`
   - Click **+ Subscribe Channel**

3. **Result:** EchoScope authenticates with channel data and logs `subscription_succeeded` along with member presence state!

---

## 🧪 Zero-Laravel Testing (Built-in Mock Server)

Don't have a Laravel project running right now? You can test EchoScope immediately using the included mock Reverb server:

1. In your terminal, run:
   ```bash
   pnpm run mock-server
   ```
   *This starts a standalone WebSocket mock server on `127.0.0.1:8080` with mock auth support at `http://127.0.0.1:8080/broadcasting/auth`.*

2. Open EchoScope in Chrome.
3. In Settings (⚙️), set:
   - Host: `127.0.0.1`
   - Port: `8080`
   - App Key: `reverb-key`
   - Auth URL: `http://127.0.0.1:8080/broadcasting/auth`
4. Subscribe to `orders` (Public) or `user.1` (Private).
5. Watch simulated live broadcast events stream in every 3 seconds!

---

## 🛠️ Protocol Handshake Architecture

```
EchoScope (Extension)                              Laravel Reverb Server
        │                                                     │
        │─── ws://127.0.0.1:8080/app/{key}?protocol=7 ───────>│  (Handshake)
        │<── {"event":"pusher:connection_established"} ───────│  (Socket ID Received)
        │                                                     │
   [If Private / Presence Channel]                            │
        │─── POST /broadcasting/auth ────────────────────────>│  (Laravel Auth Controller)
        │<── {"auth":"key:signature", "channel_data":"..."} ──│
        │                                                     │
        │─── {"event":"pusher:subscribe","data":{...}} ──────>│  (Subscription)
        │<── {"event":"pusher_internal:subscription_succeeded"}│ (Subscribed!)
        │                                                     │
        │<── {"event":"OrderCreated","data":{...},"channel":..│ (Live Broadcast!)
        │                                                     │
```

---

## 🔍 Troubleshooting & FAQ

### 1. Status shows "Echo Service Inactive" or "Connection Error"
- Make sure Laravel Reverb is running in your terminal:
  ```bash
  php artisan reverb:start --debug
  ```
- Check that the **Port** matches your `.env` (`REVERB_PORT=8080`).
- If you are running Herd, Valet, or Docker, ensure `127.0.0.1:8080` is reachable.

### 2. Private Channel subscription fails (403 Forbidden / CSRF)
- Ensure the **Auth URL** is reachable from your browser (e.g. `http://my-app.test/broadcasting/auth`).
- If your Laravel app requires an authenticated session, ensure you are logged into the app in the same browser profile, or supply a valid API **Bearer Token** in the EchoScope connection drawer.

### 3. Events not appearing for custom namespaces
- In Laravel, by default events are prefixed with `App\Events\`. In frontend Laravel Echo, developers often prefix with a dot (e.g. `.OrderCreated`).
- EchoScope supports both formats: leave the event filter blank to receive all events, or specify `.OrderCreated` to match exact event names.

---

## 📂 Project Structure

```
echo-scope/
├── manifest.json              # Chrome Extension Manifest V3
├── package.json               # pnpm build pipeline & scripts
├── tsconfig.json              # TypeScript strict configuration
├── mock-server.js             # Standalone mock Reverb & Auth server
├── scripts/
│   ├── build.js               # Multi-target bundler (Vite + Rollup)
│   └── generate-icons.js      # Zero-dependency radar icon generator
├── public/icons/              # High-resolution 16, 32, 48, 128px PNG icons
├── src/
│   ├── types/index.ts         # Protocols, log categories, channel types
│   ├── engine/
│   │   ├── reverb-client.ts   # Pusher Protocol v7 client engine
│   │   ├── raw-client.ts      # Generic WebSocket client
│   │   └── auth-service.ts    # /broadcasting/auth signature resolver
│   ├── popup/
│   │   ├── popup.html         # 2-Column broadcast console markup
│   │   ├── popup.css          # Terminal UI, badges, ultra-thin scrollbars
│   │   └── popup.ts           # Console streams, active channel manager
│   └── background/
│       └── index.ts           # Service worker
└── dist/                      # Production unpacked extension for Chrome
```

---

## 👨‍💻 Developer & Credits

**EchoScope** is architected and built with ❤️ by:

### **Sakhawat Hossain**
- 🌐 **Portfolio & Website:** [https://sajusun.github.io](https://sajusun.github.io)
- 🐙 **GitHub:** [@sajusun](https://github.com/sajusun)
- 💼 **Role:** Full-Stack & Developer Tooling Engineer
- 📬 **Repository:** [https://github.com/sajusun/echo-scope](https://github.com/sajusun/echo-scope)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use it in your personal and commercial workflows. Contributions and pull requests are warmly welcomed!
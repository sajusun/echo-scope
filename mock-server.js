import { WebSocketServer } from 'ws';
import http from 'http';

const WS_PORT = 8080;
const HTTP_PORT = 8000;

console.log('⚡ Starting EchoScope Mock Server Laboratory...');

// 1. Mock Laravel Broadcasting Auth HTTP Server (port 8000)
const authServer = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-TOKEN, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/broadcasting/auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('🔑 Mock Auth Request received:', body);
      // Return dummy signature
      const response = {
        auth: 'reverb-key:mock_signature_' + Math.random().toString(36).slice(2, 8),
        channel_data: JSON.stringify({ user_id: 101, user_info: { name: 'Sakhawat (Dev)' } })
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

authServer.listen(HTTP_PORT, () => {
  console.log(`🌐 Mock Auth API running at: http://localhost:${HTTP_PORT}/broadcasting/auth`);
});

// 2. Mock Laravel Reverb WebSocket Server (port 8080)
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`📡 Mock Reverb WebSocket Server running at: ws://localhost:${WS_PORT}`);
console.log('👉 Open EchoScope in your browser, connect to localhost:8080, and subscribe to "orders" or "notifications"!');

const clientChannels = new Map(); // ws => Set<channelName>

wss.on('connection', (ws) => {
  const socketId = `${Math.floor(Math.random() * 90000) + 10000}.${Math.floor(Math.random() * 90000) + 10000}`;
  clientChannels.set(ws, new Set());

  console.log(`\n[+] New client connected. Assigned Socket ID: ${socketId}`);

  // Send Pusher handshake
  ws.send(JSON.stringify({
    event: 'pusher:connection_established',
    data: JSON.stringify({
      socket_id: socketId,
      activity_timeout: 120
    })
  }));

  ws.on('message', (message) => {
    try {
      const packet = JSON.parse(message.toString());
      console.log('📥 Received from EchoScope:', packet);

      if (packet.event === 'pusher:ping') {
        ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
        return;
      }

      if (packet.event === 'pusher:subscribe') {
        const channel = packet.data.channel;
        clientChannels.get(ws)?.add(channel);
        console.log(`✅ Client subscribed to channel: [${channel}]`);

        ws.send(JSON.stringify({
          event: 'pusher_internal:subscription_succeeded',
          channel
        }));
        return;
      }

      if (packet.event === 'pusher:unsubscribe') {
        const channel = packet.data.channel;
        clientChannels.get(ws)?.delete(channel);
        console.log(`⛔ Client unsubscribed from channel: [${channel}]`);
        return;
      }

      // Handle client whispers
      if (packet.event && packet.event.startsWith('client-')) {
        console.log(`💬 Whisper received: [${packet.event}] on [${packet.channel}]`);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    clientChannels.delete(ws);
    console.log(`[-] Client disconnected (${socketId})`);
  });
});

// Broadcast periodic demo events every 4 seconds
let orderId = 1001;
setInterval(() => {
  if (wss.clients.size === 0) return;

  orderId++;
  const events = [
    {
      channel: 'orders',
      event: 'App\\Events\\OrderCreated',
      data: {
        order_id: orderId,
        customer: 'Tanvir Hossain',
        amount: Math.floor(Math.random() * 5000) + 500,
        currency: 'BDT',
        status: 'pending',
        items_count: Math.floor(Math.random() * 4) + 1,
        timestamp: new Date().toISOString()
      }
    },
    {
      channel: 'orders',
      event: 'App\\Events\\PaymentReceived',
      data: {
        order_id: orderId - 1,
        transaction_id: 'TRX-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
        method: 'bKash',
        amount: 3200,
        verified: true
      }
    },
    {
      channel: 'notifications',
      event: 'App\\Events\\SystemNotification',
      data: {
        id: Math.floor(Math.random() * 1000) + 1,
        title: 'New Deployment Successful',
        environment: 'production',
        duration_ms: 412
      }
    },
    {
      channel: 'private-orders.1',
      event: 'App\\Events\\OrderDispatched',
      data: {
        order_id: orderId,
        courier: 'Pathao Courier',
        tracking_code: 'PTH-' + Math.floor(Math.random() * 900000 + 100000),
        estimated_delivery: '2026-10-24'
      }
    }
  ];

  const pick = events[Math.floor(Math.random() * events.length)];

  wss.clients.forEach((client) => {
    const subscribed = clientChannels.get(client);
    // Send if client subscribed to this channel, or broadcast demo
    if (client.readyState === 1 && (!subscribed || subscribed.size === 0 || subscribed.has(pick.channel))) {
      client.send(JSON.stringify({
        event: pick.event,
        channel: pick.channel,
        data: pick.data
      }));
      console.log(`📡 Broadcasted [${pick.event}] on channel [${pick.channel}]`);
    }
  });
}, 3500);

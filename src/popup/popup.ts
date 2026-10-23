import { BroadcastEvent, ChannelSubscription, ConnectionStatus, DEFAULT_CONFIG, ReverbConfig } from '../types';
import { ReverbClient } from '../engine/reverb-client';

let currentConfig: ReverbConfig = { ...DEFAULT_CONFIG };
let client: ReverbClient | null = null;
let events: BroadcastEvent[] = [];
let subscribedChannels: ChannelSubscription[] = [];

// DOM Elements
const statusDot = document.getElementById('status-dot') as HTMLSpanElement;
const statusLabel = document.getElementById('status-label') as HTMLSpanElement;
const btnConnect = document.getElementById('btn-connect') as HTMLButtonElement;
const btnToggleConfig = document.getElementById('btn-toggle-config') as HTMLButtonElement;
const configDrawer = document.getElementById('config-drawer') as HTMLDivElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;

// Config Inputs
const cfgProtocol = document.getElementById('cfg-protocol') as HTMLSelectElement;
const cfgScheme = document.getElementById('cfg-scheme') as HTMLSelectElement;
const cfgHost = document.getElementById('cfg-host') as HTMLInputElement;
const cfgPort = document.getElementById('cfg-port') as HTMLInputElement;
const cfgKey = document.getElementById('cfg-key') as HTMLInputElement;
const cfgAuth = document.getElementById('cfg-auth') as HTMLInputElement;
const cfgToken = document.getElementById('cfg-token') as HTMLInputElement;

// Channel Elements
const inputChannel = document.getElementById('input-channel') as HTMLInputElement;
const btnSubscribe = document.getElementById('btn-subscribe') as HTMLButtonElement;
const channelsContainer = document.getElementById('channels-container') as HTMLDivElement;

// Feed Elements
const eventFeed = document.getElementById('event-feed') as HTMLDivElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const filterInput = document.getElementById('filter-input') as HTMLInputElement;
const eventCounter = document.getElementById('event-counter') as HTMLSpanElement;
const toggleAutoscroll = document.getElementById('toggle-autoscroll') as HTMLInputElement;

// Whisper Elements
const whisperEvent = document.getElementById('whisper-event') as HTMLInputElement;
const btnSendWhisper = document.getElementById('btn-send-whisper') as HTMLButtonElement;
const toast = document.getElementById('toast') as HTMLDivElement;

function init(): void {
  loadConfig();
  setupEventListeners();
}

function loadConfig(): void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(DEFAULT_CONFIG, (items) => {
      currentConfig = items as ReverbConfig;
      syncFormWithConfig();
    });
  } else {
    syncFormWithConfig();
  }
}

function syncFormWithConfig(): void {
  cfgProtocol.value = currentConfig.protocol;
  cfgScheme.value = currentConfig.scheme;
  cfgHost.value = currentConfig.host;
  cfgPort.value = currentConfig.port;
  cfgKey.value = currentConfig.appKey;
  cfgAuth.value = currentConfig.authEndpoint;
  cfgToken.value = currentConfig.bearerToken || '';
}

function readConfigFromForm(): ReverbConfig {
  return {
    protocol: cfgProtocol.value as ReverbConfig['protocol'],
    scheme: cfgScheme.value as 'ws' | 'wss',
    host: cfgHost.value.trim() || 'localhost',
    port: cfgPort.value.trim(),
    appKey: cfgKey.value.trim() || 'reverb-key',
    authEndpoint: cfgAuth.value.trim() || 'http://localhost:8000/broadcasting/auth',
    bearerToken: cfgToken.value.trim()
  };
}

function saveConfig(): void {
  currentConfig = readConfigFromForm();
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(currentConfig);
  }
}

function setupEventListeners(): void {
  btnToggleConfig.addEventListener('click', () => {
    configDrawer.classList.toggle('open');
  });

  [cfgProtocol, cfgScheme, cfgHost, cfgPort, cfgKey, cfgAuth, cfgToken].forEach((input) => {
    input.addEventListener('change', saveConfig);
  });

  btnConnect.addEventListener('click', () => {
    if (client && btnConnect.classList.contains('connected')) {
      client.disconnect();
      return;
    }

    saveConfig();
    startClient();
  });

  btnSubscribe.addEventListener('click', handleSubscribe);
  inputChannel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubscribe();
  });

  btnClear.addEventListener('click', () => {
    events = [];
    renderEvents();
  });

  btnExport.addEventListener('click', exportEventsJson);

  filterInput.addEventListener('input', () => {
    renderEvents();
  });

  btnSendWhisper.addEventListener('click', () => {
    const eventName = whisperEvent.value.trim();
    if (!eventName || !client) return;

    const firstChannel = subscribedChannels[0]?.name;
    if (!firstChannel) {
      showToast('Subscribe to a channel first');
      return;
    }

    try {
      client.triggerClientEvent(firstChannel, eventName, {
        triggered_by: 'EchoScope',
        timestamp: new Date().toISOString()
      });
      showToast(`Sent ${eventName} on ${firstChannel}`);
      whisperEvent.value = '';
    } catch (err) {
      showToast('Error: ' + (err as Error).message);
    }
  });
}

function startClient(): void {
  if (client) {
    client.disconnect();
  }

  client = new ReverbClient(
    currentConfig,
    (event) => {
      events.push(event);
      renderEvents();
      if (toggleAutoscroll.checked) {
        eventFeed.scrollTop = eventFeed.scrollHeight;
      }
    },
    (status, message) => {
      updateStatusUI(status, message);
    },
    (channels) => {
      subscribedChannels = channels;
      renderChannels();
    }
  );

  client.connect();

  // If user entered a channel before connecting, subscribe now
  const initial = inputChannel.value.trim();
  if (initial) {
    client.subscribe(initial);
  }
}

function handleSubscribe(): void {
  const channelName = inputChannel.value.trim();
  if (!channelName) return;

  if (!client) {
    startClient();
  } else {
    client.subscribe(channelName);
  }

  inputChannel.value = '';
}

function updateStatusUI(status: ConnectionStatus, message?: string): void {
  statusDot.className = 'status-dot ' + status.toLowerCase();
  statusLabel.textContent = message || status;

  if (status === 'CONNECTED') {
    btnConnect.textContent = 'Disconnect';
    btnConnect.classList.add('connected');
  } else if (status === 'CONNECTING') {
    btnConnect.textContent = 'Connecting...';
    btnConnect.classList.remove('connected');
  } else {
    btnConnect.textContent = 'Connect';
    btnConnect.classList.remove('connected');
  }
}

function renderChannels(): void {
  if (subscribedChannels.length === 0) {
    channelsContainer.innerHTML = '<span class="no-channels-text">No active channels. Subscribe above.</span>';
    return;
  }

  channelsContainer.innerHTML = '';
  subscribedChannels.forEach((ch) => {
    const chip = document.createElement('div');
    chip.className = 'channel-chip';

    const tag = document.createElement('span');
    tag.className = `chip-tag ${ch.type}`;
    tag.textContent = ch.type.slice(0, 3);

    const name = document.createElement('span');
    name.textContent = ch.name;

    const count = document.createElement('span');
    count.className = 'chip-count';
    count.textContent = ch.eventCount.toString();

    const del = document.createElement('span');
    del.className = 'chip-del';
    del.textContent = '×';
    del.title = 'Unsubscribe';
    del.addEventListener('click', () => {
      if (client) client.unsubscribe(ch.name);
    });

    chip.appendChild(tag);
    chip.appendChild(name);
    chip.appendChild(count);
    chip.appendChild(del);
    channelsContainer.appendChild(chip);
  });
}

function renderEvents(): void {
  const filter = filterInput.value.toLowerCase().trim();
  const filtered = filter
    ? events.filter(
        (e) =>
          e.event.toLowerCase().includes(filter) ||
          e.channel.toLowerCase().includes(filter) ||
          e.raw.toLowerCase().includes(filter)
      )
    : events;

  eventCounter.textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    eventFeed.querySelectorAll('.event-card').forEach((el) => el.remove());
    return;
  }

  emptyState.style.display = 'none';
  eventFeed.querySelectorAll('.event-card').forEach((el) => el.remove());

  filtered.forEach((ev) => {
    const card = document.createElement('div');
    card.className = 'event-card';

    const header = document.createElement('div');
    header.className = 'event-header';

    const meta = document.createElement('div');
    meta.className = 'event-meta';

    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = ev.timestamp;

    const chBadge = document.createElement('span');
    chBadge.className = 'event-channel-badge';
    chBadge.textContent = ev.channel;

    const nameBadge = document.createElement('span');
    nameBadge.className = 'event-name-badge';
    nameBadge.textContent = ev.event;

    meta.appendChild(time);
    meta.appendChild(chBadge);
    meta.appendChild(nameBadge);

    const actions = document.createElement('div');
    actions.className = 'event-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(JSON.stringify(ev.data, null, 2));
      showToast('Payload copied to clipboard!');
    });

    actions.appendChild(copyBtn);
    header.appendChild(meta);
    header.appendChild(actions);

    const payload = document.createElement('pre');
    payload.className = 'event-payload';
    payload.textContent = typeof ev.data === 'object' ? JSON.stringify(ev.data, null, 2) : String(ev.data);

    card.appendChild(header);
    card.appendChild(payload);
    eventFeed.appendChild(card);
  });
}

function exportEventsJson(): void {
  if (events.length === 0) {
    showToast('No events to export');
    return;
  }

  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `echoscope-events-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported events JSON file');
}

function showToast(text: string): void {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

document.addEventListener('DOMContentLoaded', init);

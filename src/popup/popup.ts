import { ChannelSubscription, ChannelType, ConnectionStatus, ConsoleLogItem, DEFAULT_CONFIG, LogCategory, ReverbConfig } from '../types';
import { ReverbClient } from '../engine/reverb-client';

let currentConfig: ReverbConfig = { ...DEFAULT_CONFIG };
let client: ReverbClient | null = null;
let allLogs: ConsoleLogItem[] = [];
let activeChannels: ChannelSubscription[] = [];
let currentTab: LogCategory = 'all';

// DOM: Left Sidebar
const selectChannelType = document.getElementById('select-channel-type') as HTMLSelectElement;
const inputChannelName = document.getElementById('input-channel-name') as HTMLInputElement;
const inputEventName = document.getElementById('input-event-name') as HTMLInputElement;
const btnSubscribe = document.getElementById('btn-subscribe') as HTMLButtonElement;
const activeChannelsList = document.getElementById('active-channels-list') as HTMLDivElement;
const btnClearLogs = document.getElementById('btn-clear-logs') as HTMLButtonElement;
const btnClearCache = document.getElementById('btn-clear-cache') as HTMLButtonElement;

// DOM: Config Drawer
const btnToggleConfig = document.getElementById('btn-toggle-config') as HTMLButtonElement;
const configDrawer = document.getElementById('config-drawer') as HTMLDivElement;
const cfgHost = document.getElementById('cfg-host') as HTMLInputElement;
const cfgPort = document.getElementById('cfg-port') as HTMLInputElement;
const cfgScheme = document.getElementById('cfg-scheme') as HTMLSelectElement;
const cfgProtocol = document.getElementById('cfg-protocol') as HTMLSelectElement;
const cfgKey = document.getElementById('cfg-key') as HTMLInputElement;
const cfgAuth = document.getElementById('cfg-auth') as HTMLInputElement;
const cfgToken = document.getElementById('cfg-token') as HTMLInputElement;
const btnSaveConn = document.getElementById('btn-save-conn') as HTMLButtonElement;

// DOM: Right Main Console
const clientBadge = document.getElementById('client-badge') as HTMLSpanElement;
const btnOpenTab = document.getElementById('btn-open-tab') as HTMLButtonElement | null;
const btnExportJson = document.getElementById('btn-export-json') as HTMLButtonElement;
const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const inputFilterLogs = document.getElementById('input-filter-logs') as HTMLInputElement;
const consoleStream = document.getElementById('console-stream') as HTMLDivElement;
const streamEmpty = document.getElementById('stream-empty') as HTMLDivElement;
const statusDot = document.getElementById('status-dot') as HTMLSpanElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const logsSummary = document.getElementById('logs-summary') as HTMLDivElement;

// Tab Counters
const countAll = document.getElementById('count-all') as HTMLSpanElement;
const countEvents = document.getElementById('count-events') as HTMLSpanElement;
const countErrors = document.getElementById('count-errors') as HTMLSpanElement;
const countSystem = document.getElementById('count-system') as HTMLSpanElement;
const toast = document.getElementById('toast') as HTMLDivElement;

function init(): void {
  loadStoredData();
  setupEventListeners();
}

function loadStoredData(): void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['config', 'channels'], (res) => {
      if (res.config) currentConfig = res.config;
      syncConfigDrawer();
      startReverbClient();

      if (Array.isArray(res.channels)) {
        res.channels.forEach((ch: ChannelSubscription) => {
          if (client) client.subscribe(ch.name, ch.type, ch.eventName);
        });
      }
    });
  } else {
    syncConfigDrawer();
    startReverbClient();
  }
}

function syncConfigDrawer(): void {
  cfgHost.value = currentConfig.host;
  cfgPort.value = currentConfig.port;
  cfgScheme.value = currentConfig.scheme;
  cfgProtocol.value = currentConfig.protocol;
  cfgKey.value = currentConfig.appKey;
  cfgAuth.value = currentConfig.authEndpoint;
  cfgToken.value = currentConfig.bearerToken || '';
}

function readConfigFromDrawer(): ReverbConfig {
  return {
    protocol: cfgProtocol.value as ReverbConfig['protocol'],
    scheme: cfgScheme.value as 'ws' | 'wss',
    host: cfgHost.value.trim() || '127.0.0.1',
    port: cfgPort.value.trim() || '8080',
    appKey: cfgKey.value.trim() || 'reverb-key',
    authEndpoint: cfgAuth.value.trim() || 'http://127.0.0.1:8000/broadcasting/auth',
    bearerToken: cfgToken.value.trim()
  };
}

function saveConfigToStorage(): void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ config: currentConfig, channels: activeChannels });
  }
}

function setupEventListeners(): void {
  // Config Drawer Toggle & Save
  btnToggleConfig.addEventListener('click', () => {
    configDrawer.classList.toggle('open');
  });

  btnSaveConn.addEventListener('click', () => {
    currentConfig = readConfigFromDrawer();
    saveConfigToStorage();
    configDrawer.classList.remove('open');
    showToast('Reverb configuration saved!');
    startReverbClient();
  });

  // Subscribe Action
  btnSubscribe.addEventListener('click', handleSubscribe);
  inputChannelName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubscribe();
  });
  inputEventName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubscribe();
  });

  // Sidebar Utilities
  btnClearLogs.addEventListener('click', () => {
    allLogs = [];
    renderStream();
    showToast('Screen logs cleared');
  });

  btnClearCache.addEventListener('click', () => {
    if (client) client.disconnect();
    allLogs = [];
    activeChannels = [];
    currentConfig = { ...DEFAULT_CONFIG };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.clear(() => {
        syncConfigDrawer();
        renderActiveChannels();
        renderStream();
        showToast('Local storage cache wiped!');
        startReverbClient();
      });
    } else {
      renderActiveChannels();
      renderStream();
      showToast('Cache wiped');
    }
  });

  // Tabs Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab') as LogCategory;
      renderStream();
    });
  });

  // Filter logs search
  inputFilterLogs.addEventListener('input', () => {
    renderStream();
  });

  // Open Full Tab (if button exists in DOM)
  if (btnOpenTab) {
    btnOpenTab.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
      } else {
        window.open(window.location.href, '_blank');
      }
    });
  }

  // Export JSON
  btnExportJson.addEventListener('click', exportLogsJson);
}

function startReverbClient(): void {
  if (client) {
    client.disconnect();
  }

  client = new ReverbClient(
    currentConfig,
    (logItem) => {
      allLogs.push(logItem);
      renderStream();
    },
    (status, message) => {
      updateStatusUI(status, message);
    },
    (channels) => {
      activeChannels = channels;
      renderActiveChannels();
      saveConfigToStorage();
    }
  );

  client.connect();
}

function handleSubscribe(): void {
  const channelName = inputChannelName.value.trim();
  if (!channelName) return;

  const type = selectChannelType.value as ChannelType;
  const eventName = inputEventName.value.trim() || undefined;

  if (!client) {
    startReverbClient();
  }

  if (client) {
    client.subscribe(channelName, type, eventName);
  }

  inputChannelName.value = '';
  inputEventName.value = '';
}

function updateStatusUI(status: ConnectionStatus, message?: string): void {
  statusDot.className = 'status-indicator-dot ' + status.toLowerCase();

  if (status === 'CONNECTED') {
    statusText.textContent = `Echo Service Active (${currentConfig.host}:${currentConfig.port})`;
    clientBadge.textContent = 'Socket Active';
  } else if (status === 'CONNECTING') {
    statusText.textContent = 'Connecting to Reverb...';
    clientBadge.textContent = 'Connecting...';
  } else if (status === 'ERROR') {
    statusText.textContent = message || 'Connection Error';
    clientBadge.textContent = 'Error';
  } else {
    statusText.textContent = 'Echo Service Inactive';
    clientBadge.textContent = 'Disconnected';
  }
}

function renderActiveChannels(): void {
  if (activeChannels.length === 0) {
    activeChannelsList.innerHTML = '<div class="empty-channels">No active channels subscribed.</div>';
    return;
  }

  activeChannelsList.innerHTML = '';
  activeChannels.forEach((ch) => {
    const card = document.createElement('div');
    card.className = 'active-channel-card';

    const info = document.createElement('div');
    info.className = 'channel-info-text';

    const prefix = document.createElement('span');
    prefix.className = 'channel-type-prefix';
    prefix.textContent = `${ch.type.toUpperCase()}:`;

    const name = document.createElement('span');
    name.className = 'channel-name-val';
    name.textContent = ch.name;

    info.appendChild(prefix);
    info.appendChild(name);

    if (ch.eventName) {
      const evTag = document.createElement('span');
      evTag.className = 'channel-event-filter-tag';
      evTag.textContent = ch.eventName;
      info.appendChild(evTag);
    }

    const unsubBtn = document.createElement('button');
    unsubBtn.className = 'btn-unsub';
    unsubBtn.textContent = 'Unsubscribe';
    unsubBtn.addEventListener('click', () => {
      if (client) client.unsubscribe(ch.wireName);
    });

    card.appendChild(info);
    card.appendChild(unsubBtn);
    activeChannelsList.appendChild(card);
  });
}

function renderStream(): void {
  // Update Tab Badges
  const countEv = allLogs.filter((l) => l.category === 'events').length;
  const countErr = allLogs.filter((l) => l.category === 'errors').length;
  const countSys = allLogs.filter((l) => l.category === 'system').length;

  countAll.textContent = allLogs.length.toString();
  countEvents.textContent = countEv.toString();
  countErrors.textContent = countErr.toString();
  countSystem.textContent = countSys.toString();

  // Filter by active Tab
  let filtered = allLogs;
  if (currentTab !== 'all') {
    filtered = allLogs.filter((l) => l.category === currentTab);
  }

  // Filter by text search
  const textFilter = inputFilterLogs.value.toLowerCase().trim();
  if (textFilter) {
    filtered = filtered.filter(
      (l) =>
        l.message.toLowerCase().includes(textFilter) ||
        (l.channel && l.channel.toLowerCase().includes(textFilter)) ||
        (l.event && l.event.toLowerCase().includes(textFilter)) ||
        (l.payload && JSON.stringify(l.payload).toLowerCase().includes(textFilter))
    );
  }

  logsSummary.textContent = `${filtered.length} log${filtered.length === 1 ? '' : 's'} shown`;

  if (filtered.length === 0) {
    streamEmpty.style.display = 'block';
    consoleStream.querySelectorAll('.stream-row').forEach((el) => el.remove());
    return;
  }

  streamEmpty.style.display = 'none';
  consoleStream.querySelectorAll('.stream-row').forEach((el) => el.remove());

  filtered.forEach((log) => {
    const row = document.createElement('div');
    row.className = 'stream-row';

    const top = document.createElement('div');
    top.className = 'row-top';

    const time = document.createElement('span');
    time.className = 'row-time';
    time.textContent = log.timestamp;

    const badge = document.createElement('span');
    badge.className = `badge-tag ${log.badge}`;
    badge.textContent = log.badge;

    const msg = document.createElement('span');
    msg.className = 'row-msg';
    msg.textContent = log.message;

    top.appendChild(time);
    top.appendChild(badge);
    top.appendChild(msg);

    if (log.payload !== undefined) {
      const actions = document.createElement('div');
      actions.className = 'row-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-copy-sm';
      copyBtn.textContent = 'Copy JSON';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
        showToast('Payload copied!');
      });

      actions.appendChild(copyBtn);
      top.appendChild(actions);
    }

    row.appendChild(top);

    if (log.payload !== undefined) {
      const payloadBox = document.createElement('pre');
      payloadBox.className = 'row-payload';
      payloadBox.textContent = typeof log.payload === 'object' ? JSON.stringify(log.payload, null, 2) : String(log.payload);
      row.appendChild(payloadBox);
    }

    consoleStream.appendChild(row);
  });

  // Auto scroll to bottom
  consoleStream.scrollTop = consoleStream.scrollHeight;
}

function exportLogsJson(): void {
  if (allLogs.length === 0) {
    showToast('No logs to export');
    return;
  }

  const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `echoscope-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Logs exported to JSON');
}

function showToast(text: string): void {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

document.addEventListener('DOMContentLoaded', init);

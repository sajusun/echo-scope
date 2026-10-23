import { ChannelSubscription, ChannelType, ConnectionStatus, ConsoleLogItem, ReverbConfig } from '../types';
import { AuthService } from './auth-service';

export type LogCallback = (item: ConsoleLogItem) => void;
export type StatusCallback = (status: ConnectionStatus, message?: string) => void;
export type ChannelCallback = (channels: ChannelSubscription[]) => void;

export class ReverbClient {
  private ws: WebSocket | null = null;
  private config: ReverbConfig;
  private socketId: string | null = null;
  private channels: Map<string, ChannelSubscription> = new Map(); // key is wireName
  private onLog: LogCallback;
  private onStatus: StatusCallback;
  private onChannelsChange: ChannelCallback;
  private pingInterval: number | null = null;
  private isManuallyClosed = false;

  constructor(
    config: ReverbConfig,
    onLog: LogCallback,
    onStatus: StatusCallback,
    onChannelsChange: ChannelCallback
  ) {
    this.config = config;
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.onChannelsChange = onChannelsChange;
  }

  public updateConfig(config: ReverbConfig): void {
    this.config = config;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isManuallyClosed = false;
    this.emitLog('INFO', 'system', `Connecting to Reverb at ${this.config.host}:${this.config.port}...`);
    this.onStatus('CONNECTING', 'Connecting to Reverb...');

    try {
      const portPart = this.config.port ? `:${this.config.port}` : '';
      const url = `${this.config.scheme}://${this.config.host}${portPart}/app/${this.config.appKey}?protocol=7&client=js&version=8.4.0-reverb&flash=false`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.emitLog('INFO', 'system', 'WebSocket connection opened, awaiting protocol handshake...');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        this.emitLog('ERROR', 'errors', `Connection failed to ${this.config.host}:${this.config.port}`);
        this.onStatus('ERROR', 'Connection failed or refused');
      };

      this.ws.onclose = (event) => {
        this.cleanup();
        const reason = !this.isManuallyClosed ? `Disconnected (code ${event.code})` : 'Disconnected';
        this.emitLog('INFO', 'system', `WebSocket connection closed (${reason})`);
        this.onStatus('DISCONNECTED', reason);
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.emitLog('ERROR', 'errors', `Connection initialization error: ${msg}`);
      this.onStatus('ERROR', msg);
    }
  }

  public disconnect(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
    this.onStatus('DISCONNECTED', 'Disconnected');
  }

  public async subscribe(nameInput: string, type: ChannelType, eventName?: string): Promise<void> {
    const rawName = nameInput.trim();
    if (!rawName) return;

    let wireName = rawName;
    if (type === 'private' && !wireName.startsWith('private-')) {
      wireName = `private-${wireName}`;
    } else if (type === 'presence' && !wireName.startsWith('presence-')) {
      wireName = `presence-${wireName}`;
    }

    const cleanName = rawName.replace(/^(private-|presence-)/, '');

    const sub: ChannelSubscription = {
      name: cleanName,
      wireName,
      type,
      eventName: eventName && eventName.trim() ? eventName.trim() : undefined,
      status: 'subscribing',
      eventCount: 0
    };

    this.channels.set(wireName, sub);
    this.emitChannels();

    this.emitLog('INFO', 'system', `Connecting to ${type} channel: "${cleanName}"...`, cleanName);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.socketId) {
      // Connect first if needed
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
      return;
    }

    await this.dispatchSubscription(sub);
  }

  public unsubscribe(wireName: string): void {
    const sub = this.channels.get(wireName);
    if (sub) {
      this.channels.delete(wireName);
      this.emitChannels();

      this.emitLog('INFO', 'system', `Unsubscribed from ${sub.type} channel: "${sub.name}"`, sub.name);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          event: 'pusher:unsubscribe',
          data: { channel: wireName }
        });
      }
    }
  }

  private async dispatchSubscription(sub: ChannelSubscription): Promise<void> {
    try {
      if (sub.type === 'private' || sub.type === 'presence') {
        if (!this.socketId) {
          throw new Error('Socket ID not available for authorization');
        }

        const authData = await AuthService.authorizeChannel(this.config, sub.wireName, this.socketId);
        this.send({
          event: 'pusher:subscribe',
          data: {
            channel: sub.wireName,
            auth: authData.auth,
            channel_data: authData.channel_data
          }
        });
      } else {
        this.send({
          event: 'pusher:subscribe',
          data: { channel: sub.wireName }
        });
      }
    } catch (err: unknown) {
      sub.status = 'error';
      this.emitChannels();
      const msg = err instanceof Error ? err.message : 'Auth error';
      this.emitLog('ERROR', 'errors', `Subscription failed for ${sub.name}: ${msg}`, sub.name);
    }
  }

  private handleMessage(rawMessage: string): void {
    try {
      const packet = JSON.parse(rawMessage);
      const eventName: string = packet.event || '';

      // Protocol Handshake
      if (eventName === 'pusher:connection_established') {
        const connData = typeof packet.data === 'string' ? JSON.parse(packet.data) : packet.data;
        this.socketId = connData.socket_id;
        this.emitLog('SUCCESS', 'system', `Handshake complete. Assigned Socket ID: ${this.socketId}`);
        this.onStatus('CONNECTED', `Connected (Socket ID: ${this.socketId})`);
        this.startHeartbeat();
        this.resubscribeAll();
        return;
      }

      // Ping/Pong
      if (eventName === 'pusher:ping') {
        this.send({ event: 'pusher:pong', data: {} });
        return;
      }

      // Subscription Succeeded
      if (eventName === 'pusher_internal:subscription_succeeded') {
        const wireName = packet.channel;
        const sub = this.channels.get(wireName);
        if (sub) {
          sub.status = 'subscribed';
          this.emitChannels();
          this.emitLog('SUCCESS', 'system', `Subscribed to ${sub.type} channel: "${sub.name}"`, sub.name);
        }
        return;
      }

      // Subscription Error
      if (eventName === 'pusher:subscription_error') {
        const wireName = packet.channel;
        const sub = this.channels.get(wireName);
        if (sub) {
          sub.status = 'error';
          this.emitChannels();
          const errText = typeof packet.data === 'string' ? packet.data : JSON.stringify(packet.data);
          this.emitLog('ERROR', 'errors', `Subscription error on "${sub.name}": ${errText}`, sub.name);
        }
        return;
      }

      // Regular Custom Broadcast Event!
      if (!eventName.startsWith('pusher:')) {
        let parsedData = packet.data;
        if (typeof parsedData === 'string') {
          try {
            parsedData = JSON.parse(parsedData);
          } catch {
            // Keep as string
          }
        }

        const wireName = packet.channel || '';
        const sub = this.channels.get(wireName);

        // Check if event name matches subscription filter (if specified)
        if (sub && sub.eventName) {
          const expected = sub.eventName.replace(/^\./, '');
          const actualClean = eventName.replace(/^\./, '');
          const matches = actualClean === expected || actualClean.endsWith(`\\${expected}`) || actualClean.endsWith(`.${expected}`);
          if (!matches) {
            // Skip event that does not match targeted event name
            return;
          }
        }

        if (sub) {
          sub.eventCount++;
          this.emitChannels();
        }

        const channelLabel = sub ? sub.name : wireName;
        this.emitLog(
          'EVENT',
          'events',
          `Event: ${eventName} on "${channelLabel}"`,
          channelLabel,
          eventName,
          parsedData
        );
      }
    } catch (err) {
      console.warn('Failed to parse incoming WebSocket message:', err, rawMessage);
    }
  }

  private resubscribeAll(): void {
    for (const sub of this.channels.values()) {
      this.dispatchSubscription(sub);
    }
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ event: 'pusher:ping', data: {} });
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
    this.socketId = null;
    this.ws = null;
    for (const sub of this.channels.values()) {
      sub.status = 'subscribing';
    }
    this.emitChannels();
  }

  private emitChannels(): void {
    this.onChannelsChange(Array.from(this.channels.values()));
  }

  private emitLog(
    badge: ConsoleLogItem['badge'],
    category: ConsoleLogItem['category'],
    message: string,
    channel?: string,
    event?: string,
    payload?: unknown
  ): void {
    const item: ConsoleLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      badge,
      category,
      channel,
      event,
      message,
      payload
    };
    this.onLog(item);
  }
}

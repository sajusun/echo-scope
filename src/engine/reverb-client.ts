import { BroadcastEvent, ChannelSubscription, ConnectionStatus, ReverbConfig } from '../types';
import { AuthService } from './auth-service';

export type EventCallback = (event: BroadcastEvent) => void;
export type StatusCallback = (status: ConnectionStatus, message?: string) => void;
export type ChannelCallback = (channels: ChannelSubscription[]) => void;

export class ReverbClient {
  private ws: WebSocket | null = null;
  private config: ReverbConfig;
  private socketId: string | null = null;
  private channels: Map<string, ChannelSubscription> = new Map();
  private onEvent: EventCallback;
  private onStatus: StatusCallback;
  private onChannelsChange: ChannelCallback;
  private pingInterval: number | null = null;
  private isManuallyClosed = false;

  constructor(
    config: ReverbConfig,
    onEvent: EventCallback,
    onStatus: StatusCallback,
    onChannelsChange: ChannelCallback
  ) {
    this.config = config;
    this.onEvent = onEvent;
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
    this.onStatus('CONNECTING', 'Connecting to Reverb...');

    try {
      const portPart = this.config.port ? `:${this.config.port}` : '';
      const url = `${this.config.scheme}://${this.config.host}${portPart}/app/${this.config.appKey}?protocol=7&client=js&version=8.4.0-reverb&flash=false`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.onStatus('CONNECTING', 'Handshaking protocol v7...');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        this.onStatus('ERROR', 'Connection failed or refused');
      };

      this.ws.onclose = (event) => {
        this.cleanup();
        if (!this.isManuallyClosed) {
          this.onStatus('DISCONNECTED', `Disconnected (code ${event.code})`);
        } else {
          this.onStatus('DISCONNECTED', 'Disconnected');
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
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

  public async subscribe(channelName: string): Promise<void> {
    const trimmed = channelName.trim();
    if (!trimmed) return;

    const isPrivate = trimmed.startsWith('private-');
    const isPresence = trimmed.startsWith('presence-');
    const type = isPresence ? 'presence' : isPrivate ? 'private' : 'public';

    const sub: ChannelSubscription = {
      name: trimmed,
      type,
      status: 'subscribing',
      eventCount: 0
    };

    this.channels.set(trimmed, sub);
    this.emitChannels();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.socketId) {
      return; // Will be subscribed once connected and socketId established
    }

    try {
      if (isPrivate || isPresence) {
        const authData = await AuthService.authorizeChannel(this.config, trimmed, this.socketId);
        this.send({
          event: 'pusher:subscribe',
          data: {
            channel: trimmed,
            auth: authData.auth,
            channel_data: authData.channel_data
          }
        });
      } else {
        this.send({
          event: 'pusher:subscribe',
          data: { channel: trimmed }
        });
      }
    } catch (err: unknown) {
      sub.status = 'error';
      this.emitChannels();
      const msg = err instanceof Error ? err.message : 'Auth error';
      this.onStatus('ERROR', `Channel ${trimmed}: ${msg}`);
    }
  }

  public unsubscribe(channelName: string): void {
    if (this.channels.has(channelName)) {
      this.channels.delete(channelName);
      this.emitChannels();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          event: 'pusher:unsubscribe',
          data: { channel: channelName }
        });
      }
    }
  }

  public triggerClientEvent(channel: string, eventName: string, data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const prefixedEvent = eventName.startsWith('client-') ? eventName : `client-${eventName}`;
    this.send({
      event: prefixedEvent,
      channel,
      data
    });
  }

  private handleMessage(rawMessage: string): void {
    try {
      const packet = JSON.parse(rawMessage);
      const eventName: string = packet.event || '';

      // Protocol Handshake
      if (eventName === 'pusher:connection_established') {
        const connData = typeof packet.data === 'string' ? JSON.parse(packet.data) : packet.data;
        this.socketId = connData.socket_id;
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
        const channelName = packet.channel;
        const sub = this.channels.get(channelName);
        if (sub) {
          sub.status = 'subscribed';
          this.emitChannels();
        }
        return;
      }

      // Subscription Error
      if (eventName === 'pusher:subscription_error') {
        const channelName = packet.channel;
        const sub = this.channels.get(channelName);
        if (sub) {
          sub.status = 'error';
          this.emitChannels();
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
            // keep as string
          }
        }

        const channel = packet.channel || 'general';
        const sub = this.channels.get(channel);
        if (sub) {
          sub.eventCount++;
          this.emitChannels();
        }

        const broadcastEvent: BroadcastEvent = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
          channel,
          event: eventName,
          data: parsedData,
          raw: rawMessage
        };

        this.onEvent(broadcastEvent);
      }
    } catch (err) {
      console.warn('Failed to parse incoming WebSocket message:', err, rawMessage);
    }
  }

  private resubscribeAll(): void {
    for (const [name] of this.channels) {
      this.subscribe(name);
    }
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Reverb / Pusher expects ping roughly every 30 seconds
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
}

import { BroadcastEvent, ConnectionStatus } from '../types';

export type RawEventCallback = (event: BroadcastEvent) => void;
export type RawStatusCallback = (status: ConnectionStatus, message?: string) => void;

export class RawWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onEvent: RawEventCallback;
  private onStatus: RawStatusCallback;

  constructor(url: string, onEvent: RawEventCallback, onStatus: RawStatusCallback) {
    this.url = url;
    this.onEvent = onEvent;
    this.onStatus = onStatus;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.onStatus('CONNECTING', 'Connecting to raw WebSocket...');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.onStatus('CONNECTED', `Connected to ${this.url}`);
      };

      this.ws.onmessage = (event) => {
        let parsed: unknown = event.data;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          // raw string
        }

        const broadcastEvent: BroadcastEvent = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          channel: 'raw',
          event: 'message',
          data: parsed,
          raw: String(event.data)
        };

        this.onEvent(broadcastEvent);
      };

      this.ws.onerror = (err) => {
        console.error('Raw WebSocket error:', err);
        this.onStatus('ERROR', 'Raw connection error');
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.onStatus('DISCONNECTED', 'Disconnected');
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.onStatus('ERROR', msg);
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatus('DISCONNECTED', 'Disconnected');
  }

  public send(payload: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      throw new Error('Raw WebSocket is not open');
    }
  }
}

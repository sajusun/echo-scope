import { ConnectionStatus, ConsoleLogItem } from '../types';

export type RawLogCallback = (item: ConsoleLogItem) => void;
export type RawStatusCallback = (status: ConnectionStatus, message?: string) => void;

export class RawWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onLog: RawLogCallback;
  private onStatus: RawStatusCallback;

  constructor(url: string, onLog: RawLogCallback, onStatus: RawStatusCallback) {
    this.url = url;
    this.onLog = onLog;
    this.onStatus = onStatus;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.onStatus('CONNECTING', 'Connecting to raw WebSocket...');
    this.emitLog('INFO', 'system', `Connecting to raw WebSocket at ${this.url}`);

  try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.onStatus('CONNECTED', `Connected to ${this.url}`);
        this.emitLog('SUCCESS', 'system', `Raw WebSocket connected to ${this.url}`);
      };

      this.ws.onmessage = (event) => {
        let parsed: unknown = event.data;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          // raw string
        }

        this.emitLog(
          'EVENT',
          'events',
          'Raw WebSocket frame received',
          'raw',
          'message',
          parsed
        );
      };

      this.ws.onerror = (err) => {
        console.error('Raw WebSocket error:', err);
        this.onStatus('ERROR', 'Raw connection error');
        this.emitLog('ERROR', 'errors', 'Raw WebSocket connection error');
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.onStatus('DISCONNECTED', 'Disconnected');
        this.emitLog('INFO', 'system', 'Raw WebSocket disconnected');
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.onStatus('ERROR', msg);
      this.emitLog('ERROR', 'errors', `Raw WebSocket error: ${msg}`);
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
      this.emitLog('INFO', 'system', `Sent raw frame: ${payload.slice(0, 50)}`);
    } else {
      throw new Error('Raw WebSocket is not open');
    }
  }

  private emitLog(
    badge: ConsoleLogItem['badge'],
    category: ConsoleLogItem['category'],
    message: string,
    channel?: string,
    event?: string,
    payload?: unknown
  ): void {
    this.onLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      badge,
      category,
      channel,
      event,
      message,
      payload
    });
  }
}

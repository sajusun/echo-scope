export type ConnectionProtocol = 'reverb' | 'pusher' | 'raw';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type ChannelType = 'public' | 'private' | 'presence';

export interface ReverbConfig {
  protocol: ConnectionProtocol;
  host: string;
  port: string;
  appKey: string;
  scheme: 'ws' | 'wss';
  authEndpoint: string;
  bearerToken?: string;
}

export interface BroadcastEvent {
  id: string;
  timestamp: string;
  channel: string;
  event: string;
  data: unknown;
  raw: string;
}

export interface ChannelSubscription {
  name: string;
  type: ChannelType;
  status: 'subscribing' | 'subscribed' | 'error';
  eventCount: number;
}

export const DEFAULT_CONFIG: ReverbConfig = {
  protocol: 'reverb',
  host: 'localhost',
  port: '8080',
  appKey: 'reverb-key',
  scheme: 'ws',
  authEndpoint: 'http://localhost:8000/broadcasting/auth',
  bearerToken: ''
};

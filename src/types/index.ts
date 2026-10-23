export type ConnectionProtocol = 'reverb' | 'pusher' | 'raw';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type ChannelType = 'public' | 'private' | 'presence';

export type LogCategory = 'all' | 'events' | 'errors' | 'system';

export type LogBadge = 'INFO' | 'SUCCESS' | 'EVENT' | 'ERROR' | 'SYSTEM';

export interface ConsoleLogItem {
  id: string;
  timestamp: string;
  badge: LogBadge;
  category: 'events' | 'errors' | 'system';
  channel?: string;
  event?: string;
  message: string;
  payload?: unknown;
}

export interface ReverbConfig {
  protocol: ConnectionProtocol;
  host: string;
  port: string;
  appKey: string;
  scheme: 'ws' | 'wss';
  authEndpoint: string;
  bearerToken?: string;
}

export interface ChannelSubscription {
  name: string;          // user.1
  wireName: string;      // private-user.1
  type: ChannelType;     // private
  eventName?: string;    // OrderCreated
  status: 'subscribing' | 'subscribed' | 'error';
  eventCount: number;
}

export const DEFAULT_CONFIG: ReverbConfig = {
  protocol: 'reverb',
  host: '127.0.0.1',
  port: '8080',
  appKey: '1dvx2vkq68nbt7ugr5q8',
  scheme: 'ws',
  authEndpoint: 'http://robertcravatt.test/broadcasting/auth',
  bearerToken: ''
};

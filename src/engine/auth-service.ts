import { ReverbConfig } from '../types';

export interface AuthResponse {
  auth: string;
  channel_data?: string;
}

export class AuthService {
  /**
   * Authorizes a private or presence channel with the backend
   */
  public static async authorizeChannel(
    config: ReverbConfig,
    channelName: string,
    socketId: string
  ): Promise<AuthResponse> {
    const endpoint = config.authEndpoint || 'http://localhost:8000/broadcasting/auth';

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (config.bearerToken && config.bearerToken.trim()) {
      headers['Authorization'] = `Bearer ${config.bearerToken.trim()}`;
    }

    const body = new URLSearchParams();
    body.append('socket_id', socketId);
    body.append('channel_name', channelName);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: body.toString(),
      credentials: 'include' // Sends cookies like laravel_session
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed (${response.status}): ${errorText.slice(0, 100)}`);
    }

    return await response.json();
  }
}

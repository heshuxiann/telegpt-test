/**
 * MCP WebSocket 管理器
 * 负责与服务端建立 WebSocket 连接，发送工具调用请求并接收结果
 */

import { getGlobal } from '../../../global';

export type McpToolRequest = {
  requestId: string;
  action: string;
  params: Record<string, any>;
};

export type McpToolResponse = {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
};

type RequestCallback = {
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timeout: number;
};

class McpWebSocketManager {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, RequestCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private requestTimeout = 30000; // 30 seconds

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const global = getGlobal();
      const { currentUserId } = global;

      // WebSocket URL - 需要根据实际配置调整
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/mcp-ws?userId=${currentUserId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.log('[MCP WebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        // eslint-disable-next-line no-console
        console.error('[MCP WebSocket] Error:', error);
      };

      this.ws.onclose = () => {
        // eslint-disable-next-line no-console
        console.log('[MCP WebSocket] Disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.handleReconnect();
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[MCP WebSocket] Connection failed:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // eslint-disable-next-line no-console
      console.error('[MCP WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    // eslint-disable-next-line no-console
    console.log(`[MCP WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(data: string) {
    try {
      const response: McpToolResponse = JSON.parse(data);
      const callback = this.pendingRequests.get(response.requestId);

      if (callback) {
        window.clearTimeout(callback.timeout);
        this.pendingRequests.delete(response.requestId);

        if (response.success) {
          callback.resolve(response.data);
        } else {
          callback.reject(new Error(response.error || 'Unknown error'));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[MCP WebSocket] Failed to parse message:', error);
    }
  }

  public sendRequest(action: string, params: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const requestId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const request: McpToolRequest = {
        requestId,
        action,
        params,
      };

      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      try {
        this.ws.send(JSON.stringify(request));
      } catch (error) {
        window.clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 单例实例
let mcpWebSocketInstance: McpWebSocketManager | null = null;

export function getMcpWebSocket(): McpWebSocketManager {
  if (!mcpWebSocketInstance) {
    mcpWebSocketInstance = new McpWebSocketManager();
  }
  return mcpWebSocketInstance;
}

export function disconnectMcpWebSocket() {
  if (mcpWebSocketInstance) {
    mcpWebSocketInstance.disconnect();
    mcpWebSocketInstance = null;
  }
}

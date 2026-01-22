import { TELEGPT_WS } from '../config';

export type TelGPTMessage = {
  type: string;
  data?: any;
  timestamp?: number;
};

export type TelGPTWSOptions = {
  userId: string;
  deviceId: string;
  onMessage?: (message: TelGPTMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  heartbeatInterval?: number;
  reconnectDelay?: number;
};

const DEFAULT_HEARTBEAT_INTERVAL = 30000; // 30秒
const DEFAULT_RECONNECT_DELAY = 5000; // 5秒，参考Telegram重连逻辑

class TelGPTWebSocket {
  private ws?: WebSocket;

  private url: string;

  private heartbeatInterval: number;

  private reconnectDelay: number;

  private heartbeatTimer?: ReturnType<typeof setInterval>;

  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private isManualClose = false;

  private isConnected = false;

  private onMessageCallback?: (message: TelGPTMessage) => void;

  private onConnectCallback?: () => void;

  private onDisconnectCallback?: () => void;

  private onErrorCallback?: (error: Event) => void;

  constructor(options: TelGPTWSOptions) {
    const {
      userId,
      deviceId,
      onMessage,
      onConnect,
      onDisconnect,
      onError,
      heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
      reconnectDelay = DEFAULT_RECONNECT_DELAY,
    } = options;

    if (!TELEGPT_WS) {
      throw new Error('TELEGPT_WS is not defined in environment variables');
    }

    this.url = `${TELEGPT_WS}/api/ws?userId=${userId}&deviceId=${deviceId}`;
    this.heartbeatInterval = heartbeatInterval;
    this.reconnectDelay = reconnectDelay;

    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;
    this.onErrorCallback = onError;
  }

  /**
   * 建立WebSocket连接
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TelGPT WebSocket] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.isConnected = false;
  }

  /**
   * 发送消息
   */
  send(message: TelGPTMessage) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // eslint-disable-next-line no-console
      console.warn('[TelGPT WebSocket] Cannot send message: not connected');
      return false;
    }

    try {
      const payload = JSON.stringify({
        ...message,
        timestamp: Date.now(),
      });
      this.ws.send(payload);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TelGPT WebSocket] Send error:', error);
      return false;
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState,
    };
  }

  /**
   * 处理连接建立
   */
  private handleOpen() {
    // eslint-disable-next-line no-console
    console.log('[TelGPT WebSocket] Connected');

    this.isConnected = true;

    this.startHeartbeat();

    this.onConnectCallback?.();
  }

  /**
   * 处理接收消息
   */
  private handleMessage(event: MessageEvent) {
    try {
      const message: TelGPTMessage = JSON.parse(event.data);

      // 处理心跳响应
      if (message.type === 'pong') {
        return;
      }

      this.onMessageCallback?.(message);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TelGPT WebSocket] Message parse error:', error);
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Event) {
    // eslint-disable-next-line no-console
    console.error('[TelGPT WebSocket] Error:', error);

    this.onErrorCallback?.(error);
  }

  /**
   * 处理连接关闭
   */
  private handleClose() {
    // eslint-disable-next-line no-console
    console.log('[TelGPT WebSocket] Disconnected');

    this.isConnected = false;
    this.stopHeartbeat();

    this.onDisconnectCallback?.();

    if (!this.isManualClose) {
      this.scheduleReconnect();
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * 调度重连（参考Telegram逻辑：无限重连，固定间隔）
   */
  private scheduleReconnect() {
    this.stopReconnect();

    // eslint-disable-next-line no-console
    console.log(`[TelGPT WebSocket] Reconnecting in ${this.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 停止重连
   */
  private stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * 更新回调函数
   */
  updateCallbacks(callbacks: {
    onMessage?: (message: TelGPTMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
  }) {
    if (callbacks.onMessage) this.onMessageCallback = callbacks.onMessage;
    if (callbacks.onConnect) this.onConnectCallback = callbacks.onConnect;
    if (callbacks.onDisconnect) this.onDisconnectCallback = callbacks.onDisconnect;
    if (callbacks.onError) this.onErrorCallback = callbacks.onError;
  }
}

let telegptWSInstance: TelGPTWebSocket | undefined;

/**
 * 初始化TelGPT WebSocket连接
 */
export function initTelGPTWebSocket(options: TelGPTWSOptions): TelGPTWebSocket {
  if (telegptWSInstance) {
    telegptWSInstance.disconnect();
  }

  telegptWSInstance = new TelGPTWebSocket(options);
  telegptWSInstance.connect();

  return telegptWSInstance;
}

/**
 * 获取TelGPT WebSocket实例
 */
export function getTelGPTWebSocket(): TelGPTWebSocket | undefined {
  return telegptWSInstance;
}

/**
 * 断开TelGPT WebSocket连接
 */
export function disconnectTelGPTWebSocket() {
  if (telegptWSInstance) {
    telegptWSInstance.disconnect();
    telegptWSInstance = undefined;
  }
}

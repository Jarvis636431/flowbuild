// 原生WebSocket状态枚举
export const WebSocketStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type WebSocketStatus =
  (typeof WebSocketStatus)[keyof typeof WebSocketStatus];

// WebSocket事件类型
export interface WebSocketEventMap {
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Event) => void;
  message: (data: unknown) => void;
  statusChange: (status: WebSocketStatus) => void;
}

// WebSocket配置选项
export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

// WebSocket消息接口
export interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
  id?: string;
}

/**
 * 原生WebSocket服务类
 * 提供WebSocket连接管理、消息发送接收、状态监控、自动重连等功能
 */
export class NativeWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> =
    new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...config,
    };
    this.maxReconnectAttempts = this.config.reconnectAttempts || 5;
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.status = WebSocketStatus.CONNECTING;
      this.emitStatusChange();

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        this.setupEventListeners();

        // 连接超时处理
        this.connectionTimer = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.status = WebSocketStatus.ERROR;
            this.emitStatusChange();
            reject(new Error('WebSocket连接超时'));
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }
          this.status = WebSocketStatus.CONNECTED;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emitStatusChange();
          this.emitEvent('connect');
          resolve();
        };

        this.ws.onerror = (error) => {
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }
          this.status = WebSocketStatus.ERROR;
          this.emitStatusChange();
          this.emitEvent('error', error);
          reject(error);
        };
      } catch (error) {
        this.status = WebSocketStatus.ERROR;
        this.emitStatusChange();
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = WebSocketStatus.DISCONNECTED;
    this.emitStatusChange();
  }

  /**
   * 发送消息
   */
  emit(event: string, data?: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: event,
        data,
        timestamp: Date.now(),
        id: this.generateMessageId(),
      };

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }

  /**
   * 直接发送原始数据
   */
  sendRaw(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('发送原始消息失败:', error);
      return false;
    }
  }

  /**
   * 监听事件
   */
  on<K extends keyof WebSocketEventMap>(
    event: K,
    listener: WebSocketEventMap[K]
  ): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听
   */
  off(event: string, listener?: (...args: unknown[]) => void): void {
    if (listener) {
      this.eventListeners.get(event)?.delete(listener);
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 重新连接
   */
  reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  /**
   * 设置WebSocket事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emitEvent('message', message);

        // 处理特定类型的消息
        if (message.type) {
          const listeners = this.eventListeners.get(message.type);
          if (listeners) {
            listeners.forEach((listener) => {
              try {
                listener(message.data);
              } catch (error) {
                console.error('消息处理错误:', error);
              }
            });
          }
        }
      } catch (error) {
        console.error('消息解析失败:', error);
        this.emitEvent('message', event.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      this.status = WebSocketStatus.ERROR;
      this.emitStatusChange();
      this.emitEvent(
        'error',
        error.type || error.message || '未知WebSocket错误'
      );
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      this.status = WebSocketStatus.DISCONNECTED;
      this.emitStatusChange();
      this.emitEvent('disconnect', event.reason || '连接已关闭');

      // 自动重连逻辑
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      }
    };
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    this.status = WebSocketStatus.RECONNECTING;
    this.emitStatusChange();
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch(() => {
          // 重连失败，继续尝试
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnect();
          }
        });
      }
    }, delay);
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.isConnected()) {
          this.emit('ping', { timestamp: Date.now() });
        }
      }, this.config.heartbeatInterval);
    }
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 清理所有定时器
   */
  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 触发状态变化事件
   */
  private emitStatusChange(): void {
    const listeners = this.eventListeners.get('statusChange');
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as (status: WebSocketStatus) => void)(this.status);
        } catch (error) {
          console.error('状态变化事件处理错误:', error);
        }
      });
    }
  }

  /**
   * 触发内部事件
   */
  private emitEvent(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`事件 ${event} 处理错误:`, error);
        }
      });
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// 默认WebSocket服务实例
let defaultWebSocketService: NativeWebSocketService | null = null;

/**
 * 创建WebSocket服务实例
 */
export function createWebSocketService(
  config: WebSocketConfig
): NativeWebSocketService {
  return new NativeWebSocketService(config);
}

/**
 * 获取默认WebSocket服务实例
 */
export function getDefaultWebSocketService(): NativeWebSocketService | null {
  return defaultWebSocketService;
}

/**
 * 设置默认WebSocket服务实例
 */
export function setDefaultWebSocketService(
  service: NativeWebSocketService
): void {
  defaultWebSocketService = service;
}

/**
 * 初始化默认WebSocket服务
 */
export function initDefaultWebSocketService(
  config: WebSocketConfig
): NativeWebSocketService {
  defaultWebSocketService = new NativeWebSocketService(config);
  return defaultWebSocketService;
}

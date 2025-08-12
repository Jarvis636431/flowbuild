import { io, Socket } from 'socket.io-client';

// Socket连接状态枚举
export const SocketStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type SocketStatus = (typeof SocketStatus)[keyof typeof SocketStatus];

// Socket事件类型
export interface SocketEventMap {
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
  message: (data: unknown) => void;
}

// Socket配置选项
export interface SocketConfig {
  url: string;
  options?: {
    autoConnect?: boolean;
    timeout?: number;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    maxReconnectionAttempts?: number;
    forceNew?: boolean;
    transports?: string[];
    auth?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
}

// Socket消息接口
export interface SocketMessage {
  event: string;
  data?: unknown;
  timestamp?: number;
  id?: string;
}

/**
 * Socket服务类
 * 提供WebSocket连接管理、消息发送接收、状态监控等功能
 */
export class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private status: SocketStatus = SocketStatus.DISCONNECTED;
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> =
    new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout = 30000; // 30秒心跳间隔

  constructor(config: SocketConfig) {
    this.config = {
      ...config,
      options: {
        autoConnect: false,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling'],
        ...config.options,
      },
    };
    this.maxReconnectAttempts = this.config.options?.reconnectionAttempts || 5;
  }

  /**
   * 连接Socket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.status = SocketStatus.CONNECTING;
      this.emitStatusChange();

      try {
        this.socket = io(this.config.url, this.config.options);
        this.setupEventListeners();

        this.socket.on('connect', () => {
          this.status = SocketStatus.CONNECTED;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emitStatusChange();
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          this.status = SocketStatus.ERROR;
          this.emitStatusChange();
          reject(error);
        });

        this.socket.connect();
      } catch (error) {
        this.status = SocketStatus.ERROR;
        this.emitStatusChange();
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
    }
    this.status = SocketStatus.DISCONNECTED;
    this.emitStatusChange();
  }

  /**
   * 发送消息
   */
  emit(event: string, data?: unknown): boolean {
    if (!this.socket?.connected) {
      console.warn('Socket未连接，无法发送消息');
      return false;
    }

    try {
      const message: SocketMessage = {
        event,
        data,
        timestamp: Date.now(),
        id: this.generateMessageId(),
      };

      this.socket.emit(event, message);
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }

  /**
   * 监听事件
   */
  on<K extends keyof SocketEventMap>(
    event: K,
    listener: SocketEventMap[K]
  ): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    // 如果socket已存在，直接绑定事件
    if (this.socket) {
      this.socket.on(event, listener);
    }
  }

  /**
   * 移除事件监听
   */
  off(event: string, listener?: (...args: unknown[]) => void): void {
    if (listener) {
      this.eventListeners.get(event)?.delete(listener);
      this.socket?.off(event, listener);
    } else {
      this.eventListeners.delete(event);
      this.socket?.off(event);
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): SocketStatus {
    return this.status;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 获取Socket实例
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 设置认证信息
   */
  setAuth(auth: Record<string, unknown>): void {
    if (this.socket) {
      this.socket.auth = auth;
    }
    if (this.config.options) {
      this.config.options.auth = auth;
    }
  }

  /**
   * 重新连接
   */
  reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 绑定预设的事件监听器
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach((listener) => {
        this.socket!.on(event, listener);
      });
    });

    // 内置事件处理
    this.socket.on('disconnect', (reason: string) => {
      this.status = SocketStatus.DISCONNECTED;
      this.stopHeartbeat();
      this.emitStatusChange();

      // 自动重连逻辑
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不自动重连
        return;
      }

      if (
        this.config.options?.reconnection &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error: Error) => {
      this.status = SocketStatus.ERROR;
      this.emitStatusChange();
      console.error('Socket错误:', error);
    });
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    this.status = SocketStatus.RECONNECTING;
    this.emitStatusChange();
    this.reconnectAttempts++;

    const delay = Math.min(
      (this.config.options?.reconnectionDelay || 1000) *
        Math.pow(2, this.reconnectAttempts - 1),
      this.config.options?.reconnectionDelayMax || 5000
    );

    setTimeout(() => {
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
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, this.heartbeatTimeout);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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
          (listener as (status: SocketStatus) => void)(this.status);
        } catch (error) {
          console.error('状态变化事件处理错误:', error);
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

// 默认Socket服务实例
let defaultSocketService: SocketService | null = null;

/**
 * 创建Socket服务实例
 */
export function createSocketService(config: SocketConfig): SocketService {
  return new SocketService(config);
}

/**
 * 获取默认Socket服务实例
 */
export function getDefaultSocketService(): SocketService | null {
  return defaultSocketService;
}

/**
 * 设置默认Socket服务实例
 */
export function setDefaultSocketService(service: SocketService): void {
  defaultSocketService = service;
}

/**
 * 初始化默认Socket服务
 */
export function initDefaultSocketService(config: SocketConfig): SocketService {
  defaultSocketService = new SocketService(config);
  return defaultSocketService;
}

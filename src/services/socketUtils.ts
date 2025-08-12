import { SocketService, SocketStatus } from './socketService';
import type { SocketMessage } from './socketService';
import type { SocketError } from './socketTypes';

/**
 * Socket连接配置验证
 */
export function validateSocketConfig(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 格式化Socket URL
 */
export function formatSocketUrl(url: string, namespace?: string): string {
  let formattedUrl = url;

  // 确保URL以协议开头
  if (!url.startsWith('http') && !url.startsWith('ws')) {
    formattedUrl = `ws://${url}`;
  }

  // 添加命名空间
  if (namespace) {
    formattedUrl = `${formattedUrl}/${namespace.replace(/^\//, '')}`;
  }

  return formattedUrl;
}

/**
 * 获取Socket状态的中文描述
 */
export function getSocketStatusText(status: SocketStatus): string {
  const statusMap: Record<SocketStatus, string> = {
    [SocketStatus.DISCONNECTED]: '已断开',
    [SocketStatus.CONNECTING]: '连接中',
    [SocketStatus.CONNECTED]: '已连接',
    [SocketStatus.RECONNECTING]: '重连中',
    [SocketStatus.ERROR]: '连接错误',
  };

  return statusMap[status] || '未知状态';
}

/**
 * 获取Socket状态对应的颜色
 */
export function getSocketStatusColor(status: SocketStatus): string {
  const colorMap: Record<SocketStatus, string> = {
    [SocketStatus.DISCONNECTED]: '#gray',
    [SocketStatus.CONNECTING]: '#blue',
    [SocketStatus.CONNECTED]: '#green',
    [SocketStatus.RECONNECTING]: '#orange',
    [SocketStatus.ERROR]: '#red',
  };

  return colorMap[status] || '#gray';
}

/**
 * 创建标准化的Socket消息
 */
export function createSocketMessage(
  event: string,
  data?: unknown,
  options?: {
    id?: string;
    timestamp?: number;
    metadata?: Record<string, unknown>;
  }
): SocketMessage {
  return {
    event,
    data,
    timestamp: options?.timestamp || Date.now(),
    id: options?.id || generateMessageId(),
    ...options?.metadata,
  };
}

/**
 * 生成唯一的消息ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成唯一的房间ID
 */
export function generateRoomId(prefix = 'room'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 序列化数据为JSON字符串
 */
export function serializeData(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('数据序列化失败:', error);
    return '{}';
  }
}

/**
 * 反序列化JSON字符串为数据
 */
export function deserializeData<T = unknown>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('数据反序列化失败:', error);
    return null;
  }
}

/**
 * 检查消息是否有效
 */
export function isValidMessage(message: unknown): message is SocketMessage {
  return (
    message !== null &&
    typeof message === 'object' &&
    'event' in message &&
    typeof (message as Record<string, unknown>).event === 'string' &&
    (message as Record<string, unknown>).event !== ''
  );
}

/**
 * 格式化时间戳为可读字符串
 */
export function formatTimestamp(
  timestamp: number,
  format = 'YYYY-MM-DD HH:mm:ss'
): string {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 计算重连延迟时间（指数退避算法）
 */
export function calculateReconnectDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000,
  factor = 2
): number {
  const delay = baseDelay * Math.pow(factor, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Socket事件名称常量
 */
export const SOCKET_EVENTS = {
  // 连接相关
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',

  // 心跳相关
  PING: 'ping',
  PONG: 'pong',

  // 消息相关
  MESSAGE: 'message',
  BROADCAST: 'broadcast',

  // 房间相关
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_MESSAGE: 'room_message',

  // 用户相关
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_LIST: 'user_list',

  // 状态相关
  STATUS_CHANGE: 'statusChange',
  ERROR: 'error',
} as const;

/**
 * Socket错误类型
 */
export const SocketErrorType = {
  CONNECTION_FAILED: 'connection_failed',
  AUTHENTICATION_FAILED: 'authentication_failed',
  TIMEOUT: 'timeout',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type SocketErrorType =
  (typeof SocketErrorType)[keyof typeof SocketErrorType];

/**
 * 创建Socket错误对象
 */
export function createSocketError(
  type: SocketErrorType,
  message: string,
  originalError?: Error
): SocketError {
  return {
    type,
    message,
    timestamp: Date.now(),
    originalError,
  };
}

/**
 * Socket连接质量监控
 */
export class SocketMonitor {
  private service: SocketService;
  private pingTimes: number[] = [];
  private maxPingHistory = 10;

  constructor(service: SocketService) {
    this.service = service;
    this.setupMonitoring();
  }

  /**
   * 设置监控
   */
  private setupMonitoring(): void {
    this.service.on(SOCKET_EVENTS.PONG, (data: unknown) => {
      if (data && typeof data === 'object' && 'timestamp' in data) {
        const pingTime = Date.now() - (data as { timestamp: number }).timestamp;
        this.addPingTime(pingTime);
      }
    });
  }

  /**
   * 添加ping时间记录
   */
  private addPingTime(time: number): void {
    this.pingTimes.push(time);
    if (this.pingTimes.length > this.maxPingHistory) {
      this.pingTimes.shift();
    }
  }

  /**
   * 获取平均延迟
   */
  getAverageLatency(): number {
    if (this.pingTimes.length === 0) return 0;
    const sum = this.pingTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.pingTimes.length);
  }

  /**
   * 获取连接质量评级
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgLatency = this.getAverageLatency();

    if (avgLatency < 50) return 'excellent';
    if (avgLatency < 150) return 'good';
    if (avgLatency < 300) return 'fair';
    return 'poor';
  }

  /**
   * 获取连接统计信息
   */
  getStats(): {
    averageLatency: number;
    quality: string;
    isConnected: boolean;
    status: SocketStatus;
  } {
    return {
      averageLatency: this.getAverageLatency(),
      quality: this.getConnectionQuality(),
      isConnected: this.service.isConnected(),
      status: this.service.getStatus(),
    };
  }
}

/**
 * 创建Socket监控实例
 */
export function createSocketMonitor(service: SocketService): SocketMonitor {
  return new SocketMonitor(service);
}

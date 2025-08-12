/**
 * Socket相关的TypeScript类型定义
 */

// Socket连接状态
export const SocketStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type SocketStatus = (typeof SocketStatus)[keyof typeof SocketStatus];

// Socket错误类型
export const SocketErrorType = {
  CONNECTION_FAILED: 'connection_failed',
  AUTHENTICATION_FAILED: 'authentication_failed',
  TIMEOUT: 'timeout',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type SocketErrorTypeValue =
  (typeof SocketErrorType)[keyof typeof SocketErrorType];

// Socket消息接口
export interface SocketMessage {
  event: string;
  data?: unknown;
  timestamp?: number;
  id?: string;
  userId?: string;
  roomId?: string;
  metadata?: Record<string, unknown>;
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
    withCredentials?: boolean;
    extraHeaders?: Record<string, string>;
  };
}

// Socket事件映射
export interface SocketEventMap {
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
  message: (data: SocketMessage) => void;
  statusChange: (status: SocketStatus) => void;
  ping: (data: { timestamp: number }) => void;
  pong: (data: { timestamp: number }) => void;
}

// Socket监听器类型
export type SocketListener<T = unknown> = (data: T) => void;

// Socket房间信息
export interface SocketRoom {
  id: string;
  name: string;
  users: SocketUser[];
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// Socket用户信息
export interface SocketUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  joinedAt: Date;
  metadata?: Record<string, unknown>;
}

// Socket连接信息
export interface SocketConnectionInfo {
  id: string;
  status: SocketStatus;
  connectedAt?: Date;
  lastPingAt?: Date;
  latency?: number;
  reconnectAttempts: number;
  transport?: string;
}

// Socket统计信息
export interface SocketStats {
  averageLatency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isConnected: boolean;
  status: SocketStatus;
  messagesSent: number;
  messagesReceived: number;
  reconnectCount: number;
  uptime: number;
}

// Socket错误信息
export interface SocketError {
  type: SocketErrorTypeValue;
  message: string;
  timestamp: number;
  originalError?: Error;
  context?: Record<string, unknown>;
}

// Socket中间件函数
export type SocketMiddleware = (
  message: SocketMessage,
  next: (error?: Error) => void
) => void;

// Socket插件接口
export interface SocketPlugin {
  name: string;
  version: string;
  install: (service: ISocketService) => void;
  uninstall?: (service: ISocketService) => void;
}

// Socket认证信息
export interface SocketAuth {
  token?: string;
  userId?: string;
  username?: string;
  credentials?: Record<string, unknown>;
}

// Socket查询参数
export interface SocketQuery {
  [key: string]: string | number | boolean;
}

// Socket传输选项
export type SocketTransport = 'websocket' | 'polling' | 'webtransport';

// Socket命名空间
export interface SocketNamespace {
  name: string;
  path: string;
  auth?: SocketAuth;
  middleware?: SocketMiddleware[];
}

// Socket事件处理器
export interface SocketEventHandler {
  event: string;
  handler: SocketListener;
  once?: boolean;
  priority?: number;
}

// Socket重连策略
export interface SocketReconnectStrategy {
  enabled: boolean;
  maxAttempts: number;
  delay: number;
  maxDelay: number;
  factor: number;
  randomize?: boolean;
}

// Socket心跳配置
export interface SocketHeartbeatConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  maxMissed: number;
}

// Socket缓冲区配置
export interface SocketBufferConfig {
  enabled: boolean;
  maxSize: number;
  flushInterval: number;
  strategy: 'fifo' | 'lifo' | 'priority';
}

// Socket日志配置
export interface SocketLogConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'remote';
}

// Socket性能监控配置
export interface SocketPerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  metricsInterval: number;
  historySize: number;
}

// Socket安全配置
export interface SocketSecurityConfig {
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean;
    methods?: string[];
  };
  rateLimit?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  encryption?: {
    enabled: boolean;
    algorithm: string;
    key: string;
  };
}

// Socket完整配置
export interface SocketFullConfig extends SocketConfig {
  namespace?: SocketNamespace;
  reconnect?: SocketReconnectStrategy;
  heartbeat?: SocketHeartbeatConfig;
  buffer?: SocketBufferConfig;
  logging?: SocketLogConfig;
  performance?: SocketPerformanceConfig;
  security?: SocketSecurityConfig;
  plugins?: SocketPlugin[];
  middleware?: SocketMiddleware[];
}

// Socket服务接口
export interface ISocketService {
  connect(): Promise<void>;
  disconnect(): void;
  emit(event: string, data?: unknown): boolean;
  on<K extends keyof SocketEventMap>(
    event: K,
    listener: SocketEventMap[K]
  ): void;
  on(event: string, listener: SocketListener): void;
  off(event: string, listener?: SocketListener): void;
  getStatus(): SocketStatus;
  isConnected(): boolean;
  reconnect(): Promise<void>;
  setAuth(auth: SocketAuth): void;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(roomId: string): Promise<void>;
  getStats(): SocketStats;
  destroy(): void;
}

// Socket事件常量
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

// Socket事件类型
export type SocketEventType =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// Socket回调函数类型
export type SocketCallback<T = unknown> = (
  error: Error | null,
  data?: T
) => void;

// Socket Promise包装器类型
export type SocketPromise<T = unknown> = Promise<T>;

// Socket中间件上下文
export interface SocketMiddlewareContext {
  message: SocketMessage;
  socket: ISocketService;
  user?: SocketUser;
  room?: SocketRoom;
  metadata: Record<string, unknown>;
}

// Socket插件上下文
export interface SocketPluginContext {
  service: ISocketService;
  config: SocketFullConfig;
  logger: Console;
  metrics: Record<string, unknown>;
}

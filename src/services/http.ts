import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
  AxiosProgressEvent,
} from 'axios';
import { ENV_CONFIG } from '../config/features';
import { TokenManager } from './authService';

// 基础响应接口
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  retry?: number; // 重试次数
  retryDelay?: number; // 重试延迟
  skipAuth?: boolean;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

// 文件上传配置
export interface UploadConfig {
  file: File;
  name?: string;
  data?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
}

// 错误类型
export interface HttpError {
  code: number;
  message: string;
  data?: unknown;
}

class HttpClient {
  private instance: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();
  private requestQueue: Set<string> = new Set();
  private isRefreshingToken = false;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: this.getBaseURL(),
      timeout: 15000, // 增加超时时间
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();

    // 开发环境下输出配置信息
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.log(
        '🌐 HTTP Client initialized with baseURL:',
        this.getBaseURL()
      );
    }
  }

  // 动态获取API基础URL
  private getBaseURL(): string {
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      return ENV_CONFIG.API_BASE_URL || 'http://localhost:3000/api';
    }
    return ENV_CONFIG.API_BASE_URL || '/api';
  }

  // 设置拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加请求标识
        const requestId = this.generateRequestId(config);
        config.metadata = { requestId };
        this.requestQueue.add(requestId);

        // 添加认证token
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        config.headers['X-Request-Time'] = Date.now().toString();

        console.log(
          `[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`,
          config
        );
        return config;
      },
      (error) => {
        console.error('[HTTP Request Error]', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.metadata?.requestId;
        if (requestId) {
          this.requestQueue.delete(requestId);
        }

        console.log(`[HTTP Response] ${response.status}`, response.data);

        // 统一处理响应数据格式
        if (response.data && typeof response.data === 'object') {
          if (response.data.code !== undefined) {
            // 后端返回的标准格式
            if (response.data.code === 0 || response.data.success) {
              return response.data;
            } else {
              throw new Error(response.data.message || '请求失败');
            }
          }
        }

        return response.data;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.metadata?.requestId;
        if (requestId) {
          this.requestQueue.delete(requestId);
        }

        console.error('[HTTP Response Error]', error);

        // 处理401错误和token刷新
        if (
          error.response?.status === 401 &&
          !(error.config as RequestConfig)?.skipAuth
        ) {
          try {
            const newToken = await this.refreshAuthToken();
            // 重新发送原始请求
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return this.instance.request(error.config);
            }
          } catch {
            console.error('Token refresh failed, redirecting to login');
            return Promise.reject(this.handleError(error));
          }
        }

        // 处理重试逻辑
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  // 生成请求ID
  private generateRequestId(config: AxiosRequestConfig): string {
    return `${config.method}_${config.url}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取认证token
  private getAuthToken(): string | null {
    return TokenManager.getToken();
  }

  // 刷新token
  private async refreshAuthToken(): Promise<string> {
    if (this.isRefreshingToken && this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.isRefreshingToken = true;
    this.refreshTokenPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshTokenPromise;
      return newToken;
    } finally {
      this.isRefreshingToken = false;
      this.refreshTokenPromise = null;
    }
  }

  // 执行token刷新
  private async performTokenRefresh(): Promise<string> {
    try {
      // 动态导入AuthService以避免循环依赖
      const { AuthService } = await import('./authService');
      return await AuthService.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleUnauthorized();
      throw error;
    }
  }

  // 判断是否需要重试
  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as RequestConfig;
    if (!config || config.retry === 0) return false;

    // 只对网络错误和5xx错误进行重试
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600) ||
      error.code === 'ECONNABORTED'
    );
  }

  // 重试请求
  private async retryRequest(error: AxiosError): Promise<unknown> {
    const config = error.config as RequestConfig;
    config.retry = (config.retry || 3) - 1;

    const delay = config.retryDelay || 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(`[HTTP Retry] Retrying request, ${config.retry} attempts left`);
    return this.instance.request(config);
  }

  // 错误处理
  private handleError(error: AxiosError): HttpError {
    let httpError: HttpError = {
      code: 0,
      message: '未知错误',
    };

    if (error.response) {
      // 服务器响应错误
      httpError = {
        code: error.response.status,
        message:
          (error.response.data as { message?: string })?.message ||
          error.message ||
          '服务器错误',
        data: error.response.data,
      };

      // 特殊状态码处理
      switch (error.response.status) {
        case 401:
          httpError.message = '未授权，请重新登录';
          this.handleUnauthorized();
          break;
        case 403:
          httpError.message = '拒绝访问';
          break;
        case 404:
          httpError.message = '请求的资源不存在';
          break;
        case 500:
          httpError.message = '服务器内部错误';
          break;
        default:
          break;
      }
    } else if (error.request) {
      // 网络错误
      httpError = {
        code: -1,
        message: '网络连接失败，请检查网络设置',
      };
    } else {
      // 其他错误
      httpError = {
        code: -2,
        message: error.message || '请求配置错误',
      };
    }

    return httpError;
  }

  // 处理未授权
  private handleUnauthorized(): void {
    TokenManager.clearAuth();
    // 可以在这里添加跳转到登录页的逻辑
    // window.location.href = '/login';

    // 触发自定义事件，通知应用用户需要重新登录
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  // GET 请求
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  // POST 请求
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  // PUT 请求
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  // DELETE 请求
  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  // PATCH 请求
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  // 文件上传
  public async upload<T = unknown>(
    url: string,
    uploadConfig: UploadConfig,
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append(uploadConfig.name || 'file', uploadConfig.file);

    // 添加额外数据
    if (uploadConfig.data) {
      Object.keys(uploadConfig.data).forEach((key) => {
        const value = uploadConfig.data![key];
        if (typeof value === 'string' || value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const requestConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (uploadConfig.onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          uploadConfig.onProgress(progress);
        }
      },
    };

    return this.instance.post(url, formData, requestConfig);
  }

  // 下载文件
  public async download(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // 取消请求
  public cancelRequest(requestId: string): void {
    const cancelToken = this.cancelTokens.get(requestId);
    if (cancelToken) {
      cancelToken.cancel('Request canceled by user');
      this.cancelTokens.delete(requestId);
    }
  }

  // 取消所有请求
  public cancelAllRequests(): void {
    this.cancelTokens.forEach((cancelToken) => {
      cancelToken.cancel('All requests canceled');
    });
    this.cancelTokens.clear();
    this.requestQueue.clear();
  }

  // 创建带取消功能的请求
  public createCancelableRequest<T = unknown>(
    requestFn: (cancelToken: CancelTokenSource) => Promise<T>
  ): { request: Promise<T>; cancel: () => void } {
    const cancelTokenSource = axios.CancelToken.source();
    const requestId = `cancelable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.cancelTokens.set(requestId, cancelTokenSource);

    const request = requestFn(cancelTokenSource).finally(() => {
      this.cancelTokens.delete(requestId);
    });

    const cancel = () => {
      this.cancelRequest(requestId);
    };

    return { request, cancel };
  }

  // 获取当前请求队列状态
  public getRequestQueueStatus(): { pending: number; requests: string[] } {
    return {
      pending: this.requestQueue.size,
      requests: Array.from(this.requestQueue),
    };
  }

  // 设置基础URL
  public setBaseURL(baseURL: string): void {
    this.instance.defaults.baseURL = baseURL;
  }

  // 设置默认headers
  public setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.instance.defaults.headers, headers);
  }

  // 设置认证token
  public setAuthToken(
    token: string,
    storage: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): void {
    TokenManager.setToken(token, storage);
  }

  // 清除认证token
  public clearAuthToken(): void {
    TokenManager.clearAuth();
  }

  // 检查是否已认证
  public isAuthenticated(): boolean {
    return TokenManager.hasToken();
  }

  // 获取当前用户信息（同步）
  public getCurrentUser() {
    return TokenManager.getUser();
  }
}

// 创建默认实例
const http = new HttpClient();

// 导出实例和类
export { HttpClient };
export default http;

// 声明模块扩展，为axios配置添加metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
    };
  }
}

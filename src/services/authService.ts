// 认证服务
import http from './http';
import { UserServiceUrls } from './apiConfig';
import { FEATURE_FLAGS } from '../config/features';

// 认证相关接口定义
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  role?: string;
}

export interface User {
  user_id: string;
  username: string;
  role: string;
  projects?: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface AuthError {
  code: number;
  message: string;
  details?: unknown;
}

// Token管理类
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'current_user';

  // 存储token
  static setToken(
    token: string,
    storage: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): void {
    if (storage === 'localStorage') {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // 获取token
  static getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  // 存储刷新token
  static setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // 获取刷新token
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // 存储用户信息
  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // 获取用户信息
  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        return null;
      }
    }
    return null;
  }

  // 清除所有认证信息
  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // 检查token是否存在
  static hasToken(): boolean {
    return !!this.getToken();
  }
}

// 模拟认证数据
const mockAuthData = {
  users: [
    {
      user_id: 'user_001',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      projects: ['project_001', 'project_002'],
    },
    {
      user_id: 'user_002',
      username: 'user',
      password: 'user123',
      role: 'user',
      projects: ['project_001'],
    },
  ],
};

// 模拟JWT token生成
const generateMockToken = (user: {
  user_id: string;
  username: string;
  role: string;
}): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24小时过期
    })
  );
  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
};

// 认证服务类
export class AuthService {
  // 用户登录
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.post<AuthResponse>(
          UserServiceUrls.login(),
          credentials
        );

        // 存储认证信息
        if (response.access_token) {
          TokenManager.setToken(response.access_token);

          // 立即获取完整的用户信息
          try {
            const userInfo = await this.getCurrentUser();
            // 用户信息已在getCurrentUser中存储，这里构造完整响应
            return {
              access_token: response.access_token,
              token_type: response.token_type,
              user: userInfo,
            };
          } catch (userError) {
            console.warn(
              '获取用户信息失败，使用登录响应中的用户信息:',
              userError
            );
            if (response.user) {
              TokenManager.setUser(response.user);
            }
          }
        }

        return response;
      } else {
        // 使用模拟数据
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟

        const user = mockAuthData.users.find(
          (u) =>
            u.username === credentials.username &&
            u.password === credentials.password
        );

        if (!user) {
          throw new Error('用户名或密码错误');
        }

        const token = generateMockToken(user);
        const authResponse: AuthResponse = {
          access_token: token,
          token_type: 'bearer',
          user: {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            projects: user.projects,
          },
        };

        // 存储认证信息
        TokenManager.setToken(token);
        if (authResponse.user) {
          TokenManager.setUser(authResponse.user);
        }

        return authResponse;
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw this.handleAuthError(error);
    }
  }

  // 用户注册
  static async register(userData: RegisterData): Promise<{ message: string }> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.post<{ message: string }>(
          UserServiceUrls.register(),
          userData
        );
        return response;
      } else {
        // 使用模拟数据
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟

        // 检查用户名是否已存在
        const existingUser = mockAuthData.users.find(
          (u) => u.username === userData.username
        );
        if (existingUser) {
          throw new Error('用户名已存在');
        }

        // 模拟注册成功
        return { message: '用户注册成功' };
      }
    } catch (error) {
      console.error('注册失败:', error);
      throw this.handleAuthError(error);
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<User> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.get<User>(UserServiceUrls.me());

        // 更新本地用户信息
        TokenManager.setUser(response);

        return response;
      } else {
        // 使用模拟数据
        await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟网络延迟

        const storedUser = TokenManager.getUser();
        if (!storedUser) {
          throw new Error('用户未登录');
        }

        return storedUser;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw this.handleAuthError(error);
    }
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 如果有真实的登出API，可以在这里调用
        // await http.post(UserServiceUrls.logout());
      }

      // 清除本地认证信息
      TokenManager.clearAuth();
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也要清除本地认证信息
      TokenManager.clearAuth();
    }
  }

  // 刷新token
  static async refreshToken(): Promise<string> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API刷新token
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('没有刷新token');
        }

        // 这里需要根据实际API调整
        const response = await http.post<AuthResponse>('/auth/refresh', {
          refresh_token: refreshToken,
        });

        if (response.access_token) {
          TokenManager.setToken(response.access_token);
          return response.access_token;
        }

        throw new Error('刷新token失败');
      } else {
        // 模拟token刷新
        const user = TokenManager.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }

        const newToken = generateMockToken(user);
        TokenManager.setToken(newToken);
        return newToken;
      }
    } catch (error) {
      console.error('刷新token失败:', error);
      // 刷新失败，清除认证信息
      TokenManager.clearAuth();
      throw this.handleAuthError(error);
    }
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    return TokenManager.hasToken();
  }

  // 获取当前token
  static getToken(): string | null {
    return TokenManager.getToken();
  }

  // 获取当前用户（同步）
  static getCurrentUserSync(): User | null {
    return TokenManager.getUser();
  }

  // 错误处理
  private static handleAuthError(error: unknown): AuthError {
    const err = error as {
      response?: { status: number; data?: { message?: string } };
      message?: string;
    };
    if (err.response) {
      // HTTP错误响应
      return {
        code: err.response.status,
        message: err.response.data?.message || err.message || '认证失败',
        details: err.response.data,
      };
    } else if (err.message) {
      // 其他错误
      return {
        code: -1,
        message: err.message,
      };
    } else {
      // 未知错误
      return {
        code: -1,
        message: '未知错误',
      };
    }
  }
}

// 导出默认实例和工具函数
export default AuthService;
export { TokenManager };

// 导出authService实例供组件使用
export const authService = AuthService;

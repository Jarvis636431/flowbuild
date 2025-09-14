// 功能开关配置
export const FEATURE_FLAGS = {
  USE_REAL_API: import.meta.env.VITE_USE_REAL_API === 'true',
  USE_MOCK_CHAT: import.meta.env.VITE_USE_MOCK_CHAT === 'true',
  ENABLE_SOCKET: import.meta.env.VITE_ENABLE_SOCKET === 'true',
};

// 环境配置
export const ENV_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  ENVIRONMENT: import.meta.env.VITE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.VITE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_ENV === 'production',
};

// 调试信息
// if (ENV_CONFIG.IS_DEVELOPMENT) {
//   // 开发环境下的调试信息
// }

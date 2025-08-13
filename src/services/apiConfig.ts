// API端点配置
export const API_ENDPOINTS = {
  // 项目相关
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: number) => `/projects/${id}`,
  PROJECT_TASKS: (id: number) => `/projects/${id}/tasks`,

  // 任务相关
  TASKS: '/tasks',
  TASK_BY_ID: (id: number) => `/tasks/${id}`,

  // 聊天相关
  CHAT: '/chat',
  CHAT_HISTORY: '/chat/history',

  // 文件上传
  UPLOAD: '/upload',
  FILE_UPLOAD: '/files/upload',

  // 用户认证
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // 数据分析
  ANALYTICS: {
    CHARTS: '/analytics/charts',
    REPORTS: '/analytics/reports',
  },
};

// API版本配置
export const API_VERSION = 'v1';

// 完整的API路径构建函数
export const buildApiPath = (endpoint: string): string => {
  return `/${API_VERSION}${endpoint}`;
};

// 常用的HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

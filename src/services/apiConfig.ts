// API端点配置
// 根据后端微服务架构配置不同服务的端点

// 用户服务端点 (端口: 8001)
export const USER_SERVICE_ENDPOINTS = {
  // 用户认证
  REGISTER: '/register',
  LOGIN: '/login',
  ME: '/me',

  // 测试接口 (仅开发/测试环境)
  TEST: {
    DELETE_USER: (userId: string) => `/test/user/${userId}`,
  },
};

// 管理服务端点 (端口: 8002)
export const MANAGEMENT_SERVICE_ENDPOINTS = {
  // 项目管理
  PRECREATE: '/precreate',
  INFO_CHECK: '/infocheck',
  UPLOAD_DOCS: '/upload_docs',
  UPLOADS: (fileType: string) => `/uploads/${fileType}`,
  FINALIZE_CREATION: '/create',
  PROJECT_LIST: '/project_list',
  VIEW: '/view',
  PROJECT_CONFIG: '/project_config',
  UPDATE: '/update',
  PROCESS_INFO: '/process_info',
  POLLING: '/polling',
  GET_VERSIONS: '/get_versions',
  GET_IFC: '/get_ifc',

  // 图表数据接口
  CREW: '/mgmt/crew',
  BUDGET: '/mgmt/budget',

  // 操作员接口
  OPERATOR: {
    PROJECTS: '/operator/projects',
    PROJECT_VIEW: '/operator/project_view',
    UPLOADS: '/operator/uploads',
    DOWNLOADS: '/operator/downloads',
    FINISH: '/operator/finish',
  },

  // 测试接口 (仅开发/测试环境)
  TEST: {
    DELETE_PROJECT: (projectId: string) => `/test/delete_project/${projectId}`,
    DELETE_PROJECT_MEMBER: (projectId: string) =>
      `/test/delete_project_member/${projectId}`,
    DELETE_DOCUMENT: (projectId: string) =>
      `/test/delete_document/${projectId}`,
    DELETE_ARTIFACT: (projectId: string) =>
      `/test/delete_artifact/${projectId}`,
    DELETE_WORKPROCESS: (projectId: string) =>
      `/test/delete_workprocess/${projectId}`,
    DELETE_WORKORDER: (projectId: string) =>
      `/test/delete_workorder/${projectId}`,
  },
};

// 服务基础URL配置
export const SERVICE_BASE_URLS = {
  USER_SERVICE:
    import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8001',
  MANAGEMENT_SERVICE:
    import.meta.env.VITE_MANAGEMENT_SERVICE_URL || 'http://localhost:8002',
};

// 动态获取服务URL的函数
export const getServiceUrl = (service: 'user' | 'management'): string => {
  switch (service) {
    case 'user':
      return SERVICE_BASE_URLS.USER_SERVICE;
    case 'management':
      return SERVICE_BASE_URLS.MANAGEMENT_SERVICE;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
};

// 构建完整API URL的函数
export const buildApiUrl = (
  service: 'user' | 'management',
  endpoint: string
): string => {
  const baseUrl = getServiceUrl(service);
  return `${baseUrl}${endpoint}`;
};

// 统一API端点配置 (向后兼容)
export const API_ENDPOINTS = {
  // 用户相关 (用户服务)
  AUTH: {
    REGISTER: USER_SERVICE_ENDPOINTS.REGISTER,
    LOGIN: USER_SERVICE_ENDPOINTS.LOGIN,
    ME: USER_SERVICE_ENDPOINTS.ME,
  },

  // 项目相关 (管理服务)
  PROJECTS: {
    PRECREATE: MANAGEMENT_SERVICE_ENDPOINTS.PRECREATE,
    INFO_CHECK: MANAGEMENT_SERVICE_ENDPOINTS.INFO_CHECK,
    UPLOAD_DOCS: MANAGEMENT_SERVICE_ENDPOINTS.UPLOAD_DOCS,
    FINALIZE_CREATION: MANAGEMENT_SERVICE_ENDPOINTS.FINALIZE_CREATION,
    LIST: MANAGEMENT_SERVICE_ENDPOINTS.PROJECT_LIST,
    VIEW: MANAGEMENT_SERVICE_ENDPOINTS.VIEW,
    CONFIG: MANAGEMENT_SERVICE_ENDPOINTS.PROJECT_CONFIG,
    UPDATE: MANAGEMENT_SERVICE_ENDPOINTS.UPDATE,
    PROCESS_INFO: MANAGEMENT_SERVICE_ENDPOINTS.PROCESS_INFO,
    POLLING: MANAGEMENT_SERVICE_ENDPOINTS.POLLING,
    VERSIONS: MANAGEMENT_SERVICE_ENDPOINTS.GET_VERSIONS,
    IFC: MANAGEMENT_SERVICE_ENDPOINTS.GET_IFC,
  },

  // 操作员相关 (管理服务)
  OPERATOR: MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR,
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

// 便捷的URL构建函数
export const UserServiceUrls = {
  register: () => buildApiUrl('user', USER_SERVICE_ENDPOINTS.REGISTER),
  login: () => buildApiUrl('user', USER_SERVICE_ENDPOINTS.LOGIN),
  me: () => buildApiUrl('user', USER_SERVICE_ENDPOINTS.ME),
  deleteUser: (userId: string) =>
    buildApiUrl('user', USER_SERVICE_ENDPOINTS.TEST.DELETE_USER(userId)),
};

export const ManagementServiceUrls = {
  precreate: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.PRECREATE),
  infoCheck: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.INFO_CHECK),
  uploadDocs: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.UPLOAD_DOCS),
  uploads: (fileType: string) =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.UPLOADS(fileType)),
  finalizeCreation: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.FINALIZE_CREATION),
  projectList: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.PROJECT_LIST),
  view: () => buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.VIEW),
  projectConfig: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.PROJECT_CONFIG),
  update: () => buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.UPDATE),
  processInfo: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.PROCESS_INFO),
  polling: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.POLLING),
  getVersions: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.GET_VERSIONS),
  getIfc: () => buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.GET_IFC),

  // 图表数据接口
  crew: (projectId: string) =>
    buildApiUrl(
      'management',
      `${MANAGEMENT_SERVICE_ENDPOINTS.CREW}?project_id=${projectId}`
    ),
  budget: (projectId: string) =>
    buildApiUrl(
      'management',
      `${MANAGEMENT_SERVICE_ENDPOINTS.BUDGET}?project_id=${projectId}`
    ),

  // 操作员接口
  operatorProjects: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR.PROJECTS),
  operatorProjectView: () =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR.PROJECT_VIEW
    ),
  operatorUploads: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR.UPLOADS),
  operatorDownloads: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR.DOWNLOADS),
  operatorFinish: () =>
    buildApiUrl('management', MANAGEMENT_SERVICE_ENDPOINTS.OPERATOR.FINISH),
  // 测试接口
  deleteProject: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_PROJECT(projectId)
    ),
  deleteProjectMember: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_PROJECT_MEMBER(projectId)
    ),
  deleteDocument: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_DOCUMENT(projectId)
    ),
  deleteArtifact: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_ARTIFACT(projectId)
    ),
  deleteWorkprocess: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_WORKPROCESS(projectId)
    ),
  deleteWorkorder: (projectId: string) =>
    buildApiUrl(
      'management',
      MANAGEMENT_SERVICE_ENDPOINTS.TEST.DELETE_WORKORDER(projectId)
    ),
};

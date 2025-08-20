import { FEATURE_FLAGS } from '../config/features';
import { ManagementServiceUrls } from './apiConfig';
import http from './http';
import { AuthService } from './authService';
import type { TaskItem, CrewData, BudgetData } from './api';

// 项目相关接口定义
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  totalCost?: number; // 可选字段，将通过任务数据动态计算
  totalDays?: number; // 可选字段，将通过任务数据动态计算
  color?: string; // 项目主题色
  tasks?: TaskItem[]; // 项目包含的任务列表
}

// 项目列表API响应接口
export interface ProjectListResponse {
  result: ApiProject[];
}

// 后端API响应接口
export interface ApiProject {
  project_id: string;
  name: string; // 修正字段名：从project_name改为name
  description: string;
  status: string; // 添加必需的status字段
  created_at: string;
  updated_at?: string; // 改为可选字段
  config?: Record<string, unknown>; // 项目配置
  total_cost?: number;
  total_days?: number;
  color?: string;
}

// 项目创建相关接口
export interface ProjectCreateRequest {
  project_name: string;
  description: string;
}

export interface ProjectPrecreateResponse {
  project_id: string;
  status: string;
}

export interface ProjectInfoCheckRequest {
  project_id: string;
  project_info: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
  };
}

// 项目最终配置接口
export interface FinalConfig {
  construction_methods: Record<string, unknown>[];
  overtime_tasks: string[];
  shutdown_events: Record<string, unknown>[];
  work_time: {
    start_hour: number;
    end_hour: number;
    work_days: string[];
  };
  background: string;
  compress_strategy: Record<string, unknown>;
}

export interface ProjectFinalizeRequest {
  project_id: string;
  final_config: FinalConfig;
}

// 工序信息相关接口
export interface ProcessInfoRequest {
  project_id: string;
  work_process_name: string;
}

// 工序详细信息
export interface ProcessInfo {
  施工工序: string;
  持续时间: string | number;
  开始时间: string | null;
  结束时间: string | null;
  施工人数: string | number;
  施工工种: string;
  人工成本: string | number;
  拆单名称: string;
}

// 工单信息
export interface OrderInfo {
  工单内容: string;
  详细信息: string;
  设计交底: string;
  安全交底: string;
  技术验收标准: string;
}

// API响应结构
export interface ProcessInfoResponse {
  process_info: ProcessInfo;
  order_info?: OrderInfo; // 可选字段
}

// 文件上传相关接口定义
export interface FileUploadConfig {
  file: File;
  project_id: string;
  file_type: 'document' | 'cad';
  name?: string;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResponse {
  success: boolean;
  file_id?: string;
  message?: string;
  uploaded_files?: string[];
  parse_ids?: string[];
  project_id?: string;
  status?: 'success' | 'error';
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'document' | 'cad';
}

export interface FileUploadRequest {
  project_id: string;
  uploaded_by: string;
  category: string;
  file: File;
  file_type: 'document' | 'cad';
}

// 支持的文件类型配置
export const SUPPORTED_FILE_TYPES: Record<
  'document' | 'cad',
  {
    extensions: string[];
    mimeTypes: string[];
    maxSize: number;
    description: string;
  }
> = {
  document: {
    extensions: ['.doc', '.docx', '.pdf', '.txt'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'text/plain',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: '项目文档文件',
  },
  cad: {
    extensions: ['.dwg', '.dwf', '.dxf', '.gbq', '.gbd'],
    mimeTypes: [
      'application/octet-stream',
      'application/x-autocad',
      'image/vnd.dwg',
      'application/acad',
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    description: 'CAD文件或广联达模型文件',
  },
};
// 模拟数据（从api.ts移动过来）
let mockProjects: Project[] = [];

// 数据转换函数
const convertApiProjectToProject = (apiProject: ApiProject): Project => {
  try {
    console.log('转换API项目数据:', apiProject);

    // 验证必需字段
    if (!apiProject) {
      throw new Error('API项目数据为空');
    }

    if (!apiProject.project_id) {
      throw new Error('API项目数据缺少project_id字段');
    }

    const convertedProject: Project = {
      id: apiProject.project_id,
      name: apiProject.name || '未命名项目', // 添加默认值
      description: apiProject.description || '', // 添加默认值
      createdAt: apiProject.created_at
        ? new Date(apiProject.created_at)
        : new Date(),
      updatedAt: apiProject.updated_at
        ? new Date(apiProject.updated_at)
        : new Date(),
      totalCost: apiProject.total_cost,
      totalDays: apiProject.total_days,
      color: apiProject.color,
    };

    console.log('成功转换项目数据:', convertedProject);
    return convertedProject;
  } catch (error) {
    console.error('转换API项目数据失败:', error, '原始数据:', apiProject);
    throw new Error(
      `项目数据转换失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// 项目服务类
export class ProjectService {
  // 设置模拟数据（用于初始化）
  static setMockProjects(projects: Project[]): void {
    mockProjects = projects;
  }

  // 获取所有项目
  static async getProjects(): Promise<Project[]> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 获取当前用户的user_id
        const currentUser = AuthService.getCurrentUserSync();
        if (!currentUser || !currentUser.user_id) {
          throw new Error('无法获取当前用户信息，请重新登录');
        }

        // 使用真实API - 添加user_id查询参数
        const response = await http.get<ProjectListResponse>(
          `${ManagementServiceUrls.projectList()}?user_id=${currentUser.user_id}`
        );

        // 验证API响应格式
        console.log('API响应数据:', response);

        // 检查response.result是否存在且为数组
        if (!response || !response.result) {
          console.error('API响应格式错误: result字段不存在', response);
          throw new Error('API响应格式错误: 缺少result字段');
        }

        if (!Array.isArray(response.result)) {
          console.error('API响应格式错误: result不是数组', response.result);
          throw new Error('API响应格式错误: result字段不是数组');
        }

        // 从result数组中提取数据并转换
        return response.result.map(convertApiProjectToProject);
      } else {
        // 使用模拟数据（保持向后兼容）
        await new Promise((resolve) => setTimeout(resolve, 400));
        return mockProjects;
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);

      // 如果是使用真实API模式，降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据。错误详情:', error);

        // 确保模拟数据是数组
        if (!Array.isArray(mockProjects)) {
          console.warn('模拟数据不是数组，返回空数组');
          return [];
        }

        return mockProjects;
      }

      // 如果是模拟数据模式，直接抛出错误
      throw new Error(
        `获取项目列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 根据ID获取单个项目方法已删除

  // 预创建项目（获取project_id）
  static async precreateProject(request: {
    user_id: string;
    name: string;
  }): Promise<{ project_id: string }> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        const response = await http.post<{ project_id: string }>(
          ManagementServiceUrls.precreate(),
          {
            user_id: request.user_id,
            name: request.name,
          }
        );
        return response;
      } else {
        // 模拟模式
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          project_id: `project_${Date.now()}`,
        };
      }
    } catch (error) {
      console.error('预创建项目失败:', error);
      throw error;
    }
  }

  // 创建新项目（最终确认创建）
  static async createProject(request: {
    project_id: string;
    user_id: string;
  }): Promise<{ job_id: string }> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 获取当前用户信息
        const currentUser = AuthService.getCurrentUserSync();
        if (!currentUser || !currentUser.user_id) {
          throw new Error('用户未登录，请先登录');
        }

        // 最终确认创建项目 - 只传输project_id和user_id
        const finalResponse = await http.post<{ job_id: string }>(
          ManagementServiceUrls.finalizeCreation(),
          {
            project_id: request.project_id,
            user_id: request.user_id,
          }
        );

        return finalResponse;
      } else {
        // 模拟数据逻辑
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          job_id: `job_${Date.now()}`,
        };
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      throw new Error('创建项目失败');
    }
  }

  // 更新项目
  static async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.put<ApiProject>(
          ManagementServiceUrls.update(),
          {
            project_id: id,
            project_name: updates.name,
            description: updates.description,
            color: updates.color,
          }
        );

        return convertApiProjectToProject(response);
      } else {
        // 模拟数据逻辑
        await new Promise((resolve) => setTimeout(resolve, 600));
        const projectIndex = mockProjects.findIndex(
          (project) => project.id === id
        );
        if (projectIndex === -1) {
          throw new Error('项目不存在');
        }
        mockProjects[projectIndex] = {
          ...mockProjects[projectIndex],
          ...updates,
          updatedAt: new Date(),
        };
        return mockProjects[projectIndex];
      }
    } catch (error) {
      console.error('更新项目失败:', error);
      // 降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        const projectIndex = mockProjects.findIndex(
          (project) => project.id === id
        );
        if (projectIndex === -1) {
          throw new Error('项目不存在');
        }
        mockProjects[projectIndex] = {
          ...mockProjects[projectIndex],
          ...updates,
          updatedAt: new Date(),
        };
        return mockProjects[projectIndex];
      }
      throw new Error('更新项目失败');
    }
  }

  // 删除项目
  static async deleteProject(id: string): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API（测试环境）
        await http.delete(ManagementServiceUrls.deleteProject(id.toString()));
      } else {
        // 模拟数据逻辑
        await new Promise((resolve) => setTimeout(resolve, 400));
        const projectIndex = mockProjects.findIndex(
          (project) => project.id === id
        );
        if (projectIndex === -1) {
          throw new Error('项目不存在');
        }
        mockProjects.splice(projectIndex, 1);
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      // 降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        const projectIndex = mockProjects.findIndex(
          (project) => project.id === id
        );
        if (projectIndex === -1) {
          throw new Error('项目不存在');
        }
        mockProjects.splice(projectIndex, 1);
        return;
      }
      throw new Error('删除项目失败');
    }
  }

  // 文件验证方法
  static validateFile(
    file: File,
    fileType: 'document' | 'cad'
  ): FileValidationResult {
    const config = SUPPORTED_FILE_TYPES[fileType];

    // 检查文件大小
    if (file.size > config.maxSize) {
      return {
        isValid: false,
        error: `文件大小超过限制，最大允许 ${(config.maxSize / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    const hasValidExtension = config.extensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        isValid: false,
        error: `不支持的文件格式，请上传 ${config.extensions.join('、')} 格式的文件`,
      };
    }

    // 检查MIME类型（可选，因为某些文件的MIME类型可能不准确）
    if (file.type && !config.mimeTypes.includes(file.type)) {
      console.warn(`文件MIME类型不匹配: ${file.type}，但扩展名有效，继续处理`);
    }

    return {
      isValid: true,
      fileType,
    };
  }

  // 文件上传方法
  static async uploadDocuments(
    config: FileUploadConfig
  ): Promise<FileUploadResponse> {
    try {
      // 验证文件
      const validation = this.validateFile(config.file, config.file_type);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API上传
        const response = await http.upload<FileUploadResponse>(
          ManagementServiceUrls.uploadDocs(),
          {
            file: config.file,
            name: config.name || 'file',
            data: {
              project_id: config.project_id,
              file_type: config.file_type,
            },
            onProgress: config.onProgress,
          }
        );

        return {
          ...response,
          status: 'success',
        };
      } else {
        // 模拟数据模式
        await new Promise((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            if (config.onProgress) {
              config.onProgress(progress);
            }
            if (progress >= 100) {
              clearInterval(interval);
              resolve(undefined);
            }
          }, 100);
        });

        // 模拟响应
        return {
          success: true,
          uploaded_files: [config.file.name],
          parse_ids: [`parse_${Date.now()}`],
          project_id: config.project_id,
          status: 'success',
          message: '文件上传成功（模拟模式）',
        };
      }
    } catch (error) {
      console.error('文件上传失败:', error);

      // 如果是真实API模式，可以考虑降级到模拟模式
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API上传失败，错误详情:', error);
      }

      throw new Error(
        `文件上传失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 批量文件上传方法
  static async uploadMultipleDocuments(
    files: FileUploadConfig[]
  ): Promise<FileUploadResponse[]> {
    const results: FileUploadResponse[] = [];

    for (const fileConfig of files) {
      try {
        const result = await this.uploadDocuments(fileConfig);
        results.push(result);
      } catch (error) {
        console.error(`文件 ${fileConfig.file.name} 上传失败:`, error);
        results.push({
          success: false,
          uploaded_files: [],
          parse_ids: [],
          project_id: fileConfig.project_id,
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  // 上传文件到指定项目
  static async uploadFile(
    request: FileUploadRequest
  ): Promise<FileUploadResponse> {
    if (FEATURE_FLAGS.USE_REAL_API) {
      try {
        const formData = new FormData();
        formData.append('file', request.file);
        formData.append('project_id', request.project_id);
        formData.append('uploaded_by', request.uploaded_by);
        formData.append('category', request.category);

        const response = await http.post<FileUploadResponse>(
          ManagementServiceUrls.uploads(request.file_type),
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        return response;
      } catch (error) {
        console.error('文件上传失败:', error);
        throw error;
      }
    } else {
      // 模拟模式
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            file_id: `file_${Date.now()}`,
            message: '文件上传成功',
          });
        }, 1000);
      });
    }
  }

  // 轮询项目状态
  static async pollProjectStatus(jobId: string): Promise<{
    status: string;
    progress?: number;
    message?: string;
  }> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        const response = await http.get<{
          status: string;
          progress?: number;
          message?: string;
        }>(`${ManagementServiceUrls.polling()}?job_id=${jobId}`);

        return response;
      } else {
        // 模拟模式 - 随机返回状态
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statuses = [
          'processing',
          'processing',
          'processing',
          'completed',
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        return {
          status: randomStatus,
          progress:
            randomStatus === 'completed'
              ? 100
              : Math.floor(Math.random() * 90) + 10,
          message:
            randomStatus === 'completed' ? '项目处理完成' : '项目处理中...',
        };
      }
    } catch (error) {
      console.error('轮询项目状态失败:', error);
      throw new Error(
        `轮询项目状态失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 下载项目Excel文件
  static async downloadProjectExcel(projectId: string): Promise<File> {
    const startTime = Date.now();
    console.log('📥 [ProjectService] 开始下载项目Excel文件', {
      projectId,
      useRealAPI: FEATURE_FLAGS.USE_REAL_API,
      timestamp: new Date().toISOString()
    });
    
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        const apiUrl = `${ManagementServiceUrls.view()}?project_id=${projectId}`;
        console.log('🌐 [ProjectService] 调用真实API', {
          url: apiUrl,
          method: 'GET',
          responseType: 'blob'
        });
        
        const response = await http.get(apiUrl, {
          responseType: 'blob',
        });

        const responseTime = Date.now() - startTime;
        console.log('✅ [ProjectService] API响应成功', {
          responseTime: `${responseTime}ms`,
          responseType: typeof response,
          blobSize: response instanceof Blob ? response.size : 'unknown'
        });

        // 创建File对象
        const blob = response as Blob;
        const file = new File([blob], `project_${projectId}.xlsx`, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        console.log('📄 [ProjectService] File对象创建成功', {
          fileName: file.name,
          fileSize: `${file.size} bytes`,
          fileType: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });
        // // 直接触发浏览器下载
        // const url = URL.createObjectURL(blob);
        // const link = document.createElement('a');
        // link.href = url;
        // link.download = `project_${projectId}.xlsx`;
        // link.style.display = 'none';
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        // URL.revokeObjectURL(url);

        return file;
      } else {
        console.log('🔧 [ProjectService] 使用模拟模式', {
          projectId,
          mockDataSize: '4 bytes'
        });
        
        // 模拟模式 - 创建一个模拟的Excel文件
        const mockExcelData = new Uint8Array([
          0x50,
          0x4b,
          0x03,
          0x04, // ZIP文件头
          // 这里是简化的Excel文件数据
        ]);
        const blob = new Blob([mockExcelData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const file = new File([blob], `mock_project_${projectId}.xlsx`, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const responseTime = Date.now() - startTime;
        console.log('✅ [ProjectService] 模拟文件创建成功', {
          fileName: file.name,
          fileSize: `${file.size} bytes`,
          fileType: file.type,
          responseTime: `${responseTime}ms`
        });

        return file;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ [ProjectService] 下载项目Excel文件失败', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
      throw new Error(
        `下载项目Excel文件失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 创建项目并上传文件的完整流程
  static async createProjectWithFiles(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    files?: {
      file: File;
      fileType: 'document' | 'cad';
      onProgress?: (progress: number) => void;
    }[]
  ): Promise<{ project: Project; uploadResults?: FileUploadResponse[] }> {
    try {
      // 获取当前用户信息
      const currentUser = AuthService.getCurrentUserSync();
      if (!currentUser || !currentUser.user_id) {
        throw new Error('用户未登录，请先登录');
      }

      // 步骤1: 预创建项目
      const precreateResponse = await this.precreateProject({
        user_id: currentUser.user_id,
        name: project.name,
      });

      // 步骤2: 创建项目
      await this.createProject({
        project_id: precreateResponse.project_id,
        user_id: currentUser.user_id,
      });

      // 创建一个临时的Project对象用于兼容性
      const createdProject: Project = {
        id: precreateResponse.project_id,
        name: project.name,
        description: project.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 步骤3: 如果有文件，则上传文件
      if (files && files.length > 0) {
        const uploadConfigs: FileUploadConfig[] = files.map(
          ({ file, fileType, onProgress }) => ({
            file,
            project_id: precreateResponse.project_id,
            file_type: fileType,
            onProgress,
          })
        );

        const uploadResults = await this.uploadMultipleDocuments(uploadConfigs);

        return {
          project: createdProject,
          uploadResults,
        };
      }

      return { project: createdProject };
    } catch (error) {
      console.error('创建项目并上传文件失败:', error);
      throw new Error(
        `创建项目并上传文件失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 获取派单信息
  static async getProcessInfo(
    projectId: string,
    workProcessName: string
  ): Promise<ProcessInfoResponse> {
    try {
      // 调用真实API
      const response = await http.get<ProcessInfoResponse>(
        `${ManagementServiceUrls.processInfo()}?project_id=${encodeURIComponent(projectId)}&work_process_name=${encodeURIComponent(workProcessName)}`
      );
      return response;
    } catch (error) {
      console.error('获取工序信息失败:', error);
      throw new Error('获取工序信息失败');
    }
  }

  // 获取人员配置数据
  static async getCrewData(projectId: string): Promise<CrewData[]> {
    try {
      const response = await http.get<CrewData[]>(
        `/mgmt/crew?project_id=${encodeURIComponent(projectId)}`
      );
      return response;
    } catch (error) {
      console.error('获取人员配置数据失败:', error);
      throw new Error('获取人员配置数据失败');
    }
  }

  // 获取预算数据
  static async getBudgetData(projectId: string): Promise<BudgetData[]> {
    try {
      const response = await http.get<BudgetData[]>(
        `/mgmt/budget?project_id=${encodeURIComponent(projectId)}`
      );
      return response;
    } catch (error) {
      console.error('获取预算数据失败:', error);
      throw new Error('获取预算数据失败');
    }
  }

  // 获取项目配置信息
  static async getProjectConfig(projectId: string): Promise<Record<string, unknown>> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.get<{ config: Record<string, unknown> }>(
          `${ManagementServiceUrls.projectConfig()}?project_id=${encodeURIComponent(projectId)}`
        );

        return response.config || {};
      } else {
        // 模拟数据逻辑
        await new Promise((resolve) => setTimeout(resolve, 500));
        const project = mockProjects.find((p) => p.id === projectId);
        if (!project) {
          throw new Error('项目不存在');
        }
        
        // 返回模拟的配置数据，根据用户提供的示例格式
        return {
          construction_methods: [
            { task_name: "柱钢筋绑扎", method_index: 0 },
            { task_name: "梁板底排钢筋绑扎", method_index: 1 }
          ],
          overtime_tasks: ["短肢剪力墙混凝土浇筑", "柱混凝土浇筑", "梁板混凝土浇筑"],
          shutdown_events: [
            {
              name: "雨天停工",
              start_time: { day: 5, hour: 0 },
              end_time: { day: 7, hour: 0 },
              a_level_tasks: ["短肢剪力墙混凝土浇筑", "柱混凝土浇筑", "梁板混凝土浇筑"],
              b_level_tasks: ["柱钢筋绑扎", "梁板底排钢筋绑扎"]
            }
          ],
          work_start_hour: 8,
          work_end_hour: 20,
          backgrounds: ["标准层施工", "暑期施工"],
          compress: { target_days: 100, add_carpenter_first: true }
        };
      }
    } catch (error) {
      console.error('获取项目配置失败:', error);
      // 降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        return {
          construction_methods: [
            { task_name: "柱钢筋绑扎", method_index: 0 },
            { task_name: "梁板底排钢筋绑扎", method_index: 1 }
          ],
          overtime_tasks: ["短肢剪力墙混凝土浇筑", "柱混凝土浇筑", "梁板混凝土浇筑"],
          shutdown_events: [
            {
              name: "雨天停工",
              start_time: { day: 5, hour: 0 },
              end_time: { day: 7, hour: 0 },
              a_level_tasks: ["短肢剪力墙混凝土浇筑", "柱混凝土浇筑", "梁板混凝土浇筑"],
              b_level_tasks: ["柱钢筋绑扎", "梁板底排钢筋绑扎"]
            }
          ],
          work_start_hour: 8,
          work_end_hour: 20,
          backgrounds: ["标准层施工", "暑期施工"],
          compress: { target_days: 100, add_carpenter_first: true }
        };
      }
      throw new Error('获取项目配置失败');
    }
  }
}

// 导出便捷的API对象（保持向后兼容）
export const projectAPI = {
  getProjects: ProjectService.getProjects,
  createProject: ProjectService.createProject,
  updateProject: ProjectService.updateProject,
  deleteProject: ProjectService.deleteProject,

  getProcessInfo: ProjectService.getProcessInfo,
  // 预创建项目
  precreateProject: ProjectService.precreateProject,
  // 轮询项目状态
  pollProjectStatus: ProjectService.pollProjectStatus,
  // 下载项目Excel文件
  downloadProjectExcel: ProjectService.downloadProjectExcel,
  // 获取项目配置
  getProjectConfig: ProjectService.getProjectConfig,
  // 文件上传相关方法
  validateFile: ProjectService.validateFile,
  uploadFile: ProjectService.uploadFile,
  uploadDocuments: ProjectService.uploadDocuments,
  uploadMultipleDocuments: ProjectService.uploadMultipleDocuments,
  createProjectWithFiles: ProjectService.createProjectWithFiles,
  
  // 图表数据相关方法
  getCrewData: ProjectService.getCrewData,
  getBudgetData: ProjectService.getBudgetData,
};

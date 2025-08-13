import { FEATURE_FLAGS } from '../config/features';
import { ManagementServiceUrls } from './apiConfig';
import http from './http';
import type { TaskItem } from './api';

// 项目相关接口定义
export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  totalCost?: number; // 可选字段，将通过任务数据动态计算
  totalDays?: number; // 可选字段，将通过任务数据动态计算
  color?: string; // 项目主题色
  tasks?: TaskItem[]; // 项目包含的任务列表
}

// 后端API响应接口
export interface ApiProject {
  project_id: string;
  project_name: string;
  description: string;
  created_at: string;
  updated_at: string;
  status?: string;
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

export interface ProjectFinalizeRequest {
  project_id: string;
}

// 模拟数据（从api.ts移动过来）
let mockProjects: Project[] = [];

// 数据转换函数
const convertApiProjectToProject = (apiProject: ApiProject): Project => {
  return {
    id: parseInt(apiProject.project_id),
    name: apiProject.project_name,
    description: apiProject.description,
    createdAt: new Date(apiProject.created_at),
    updatedAt: new Date(apiProject.updated_at),
    totalCost: apiProject.total_cost,
    totalDays: apiProject.total_days,
    color: apiProject.color,
  };
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
        // 使用真实API
        const response = await http.get<ApiProject[]>(
          ManagementServiceUrls.projectList()
        );

        // 转换API响应为前端数据格式
        return response.map(convertApiProjectToProject);
      } else {
        // 使用模拟数据（保持向后兼容）
        await new Promise((resolve) => setTimeout(resolve, 400));
        return mockProjects;
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      // 降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        return mockProjects;
      }
      throw new Error('获取项目列表失败');
    }
  }

  // 根据ID获取单个项目
  static async getProjectById(id: number): Promise<Project | null> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.get<ApiProject>(
          `${ManagementServiceUrls.view()}?project_id=${id}`
        );

        return convertApiProjectToProject(response);
      } else {
        // 使用模拟数据
        await new Promise((resolve) => setTimeout(resolve, 300));
        const project = mockProjects.find((project) => project.id === id);
        return project || null;
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      // 降级到模拟数据
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        const project = mockProjects.find((project) => project.id === id);
        return project || null;
      }
      throw new Error('获取项目详情失败');
    }
  }

  // 创建新项目（三步骤流程）
  static async createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 步骤1: 项目预创建
        const precreateResponse = await http.post<ProjectPrecreateResponse>(
          ManagementServiceUrls.precreate(),
          {
            project_name: project.name,
            description: project.description,
          }
        );

        // 步骤2: 信息检查
        await http.post(ManagementServiceUrls.infoCheck(), {
          project_id: precreateResponse.project_id,
          project_info: {
            name: project.name,
            description: project.description,
            start_date: new Date().toISOString(),
            end_date: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        });

        // 步骤3: 完成项目创建
        const finalResponse = await http.post<ApiProject>(
          ManagementServiceUrls.finalizeCreation(),
          {
            project_id: precreateResponse.project_id,
          }
        );

        return convertApiProjectToProject(finalResponse);
      } else {
        // 模拟数据逻辑
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newProject: Project = {
          ...project,
          id: Math.max(...mockProjects.map((p) => p.id), 0) + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockProjects.push(newProject);
        return newProject;
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      throw new Error('创建项目失败');
    }
  }

  // 更新项目
  static async updateProject(
    id: number,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.put<ApiProject>(
          ManagementServiceUrls.update(),
          {
            project_id: id.toString(),
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
  static async deleteProject(id: number): Promise<void> {
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

  // 根据项目ID获取任务列表
  static async getTasksByProjectId(projectId: number): Promise<TaskItem[]> {
    try {
      if (FEATURE_FLAGS.USE_REAL_API) {
        // 使用真实API
        const response = await http.get<TaskItem[]>(
          `${ManagementServiceUrls.view()}?project_id=${projectId}&include_tasks=true`
        );

        return response;
      } else {
        // 模拟数据逻辑 - 暂时返回空数组，避免循环导入
        await new Promise((resolve) => setTimeout(resolve, 300));
        return [];
      }
    } catch (error) {
      console.error('获取项目任务失败:', error);
      // 降级策略
      if (FEATURE_FLAGS.USE_REAL_API) {
        console.warn('API调用失败，降级到模拟数据');
        return [];
      }
      throw new Error('获取项目任务失败');
    }
  }
}

// 导出便捷的API对象（保持向后兼容）
export const projectAPI = {
  getProjects: ProjectService.getProjects,
  getProjectById: ProjectService.getProjectById,
  createProject: ProjectService.createProject,
  updateProject: ProjectService.updateProject,
  deleteProject: ProjectService.deleteProject,
  getTasksByProjectId: ProjectService.getTasksByProjectId,
};

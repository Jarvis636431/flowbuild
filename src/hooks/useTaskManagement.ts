import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import { projectAPI } from '../services/api';
import type { TaskItem } from '../services/api';
import type { Project, ProcessInfoResponse } from '../services/projectService';
import { useAsyncState } from './useAsyncState';
import { readProjectFromFile } from '../services/excelReader';

export interface UseTaskManagementReturn {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  selectedTask: TaskItem | null;
  processInfo: ProcessInfoResponse | null;
  processInfoLoading: boolean;
  processInfoError: string | null;
  fetchTasks: (viewData?: ArrayBuffer) => Promise<void>;
  handleTaskClick: (
    task: TaskItem,
    event: React.MouseEvent<HTMLElement>
  ) => Promise<void>;
  closePopup: () => void;
}

export const useTaskManagement = (
  currentProject: Project | null
): UseTaskManagementReturn => {
  const {
    data: tasks,
    loading,
    error,
    execute,
  } = useAsyncState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [processInfo, setProcessInfo] = useState<ProcessInfoResponse | null>(
    null
  );
  const [processInfoLoading, setProcessInfoLoading] = useState(false);
  const [processInfoError, setProcessInfoError] = useState<string | null>(null);

  // 获取任务数据
  const fetchTasks = useCallback(
    async (viewData?: ArrayBuffer) => {
      await execute(async () => {
        let tasksData: TaskItem[];

        if (viewData && viewData.byteLength > 0) {
          // 如果有view接口返回的Excel数据，使用readProjectFromFile解析
          try {
            // 将ArrayBuffer转换为File对象
            const blob = new Blob([viewData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const file = new File([blob], 'project-data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const project = await readProjectFromFile(file);
            if (project && project.tasks) {
              tasksData = project.tasks;
            } else {
              tasksData = await taskAPI.getTasks();
            }
          } catch {
            // 解析失败时回退到默认API
            tasksData = await taskAPI.getTasks();
          }
        } else if (viewData && viewData.byteLength === 0) {
          // 如果viewData是空的ArrayBuffer，说明需要从ProjectService获取数据
          
          // 初始化tasksData为默认值
          tasksData = await taskAPI.getTasks();
          
          // 添加重试机制，最多重试3次
          let retryCount = 0;
          const maxRetries = 3;
          const retryDelay = 200; // 200ms延迟
          
          while (retryCount < maxRetries) {
            try {
              // 从ProjectService获取项目数据
              const projects = await import('../services/projectService').then(m => m.ProjectService.getProjects());
              const targetProject = projects.find(p => p.id === currentProject?.id);
              
              if (targetProject && targetProject.tasks && targetProject.tasks.length > 0) {
                tasksData = targetProject.tasks;
                break; // 成功获取数据，跳出重试循环
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
              }
            } catch {
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              }
            }
          }
        } else if (currentProject) {
          // 如果有当前项目但没有Excel数据，获取项目的任务数据
          tasksData = await taskAPI.getTasks();
          tasksData = tasksData.filter(
            (task) => task.projectId === parseInt(currentProject.id)
          );
        } else {
          // 否则获取默认任务数据
          tasksData = await taskAPI.getTasks();
        }
        return tasksData;
      });
    },
    [currentProject, execute]
  );

  // 处理任务行点击事件
  const handleTaskClick = useCallback(
    async (task: TaskItem, event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

  

      setSelectedTask(task);

      // 调用 getProcessInfo 接口获取工序信息
      if (currentProject) {
        try {
          setProcessInfoLoading(true);
          setProcessInfoError(null);

          const processData = await projectAPI.getProcessInfo(
            currentProject.id.toString(),
            task.name
          );

          setProcessInfo(processData);
  
        } catch (error) {
            setProcessInfoError(
              error instanceof Error ? error.message : '获取工序信息失败'
            );
        } finally {
          setProcessInfoLoading(false);
        }
      }
    },
    [currentProject]
  );

  // 关闭弹窗
  const closePopup = useCallback(() => {
    setSelectedTask(null);
    setProcessInfo(null);
    setProcessInfoError(null);
  }, []);

  return {
    tasks: tasks || [],
    loading,
    error,
    selectedTask,
    processInfo,
    processInfoLoading,
    processInfoError,
    fetchTasks,
    handleTaskClick,
    closePopup,
  };
};

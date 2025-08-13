import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import { projectAPI } from '../services/api';
import type { TaskItem } from '../services/api';
import type { Project, ProcessInfoResponse } from '../services/projectService';
import { useAsyncState } from './useAsyncState';

export interface UseTaskManagementReturn {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  selectedTask: TaskItem | null;
  processInfo: ProcessInfoResponse | null;
  processInfoLoading: boolean;
  processInfoError: string | null;
  fetchTasks: () => Promise<void>;
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
  const fetchTasks = useCallback(async () => {
    await execute(async () => {
      let tasksData: TaskItem[];
      if (currentProject) {
        // 如果有当前项目，获取项目的任务数据
        tasksData = await taskAPI.getTasks();
        tasksData = tasksData.filter(
          (task) => task.projectId === currentProject.id
        );
      } else {
        // 否则获取默认任务数据
        tasksData = await taskAPI.getTasks();
      }
      return tasksData;
    });
  }, [currentProject, execute]);

  // 处理任务行点击事件
  const handleTaskClick = useCallback(
    async (task: TaskItem, event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      console.log('Task clicked:', task.name); // 调试信息

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
          console.log('Process info fetched:', processData);
        } catch (error) {
          console.error('获取工序信息失败:', error);
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

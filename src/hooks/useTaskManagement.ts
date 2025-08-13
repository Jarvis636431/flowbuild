import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import type { TaskItem } from '../services/api';
import type { Project } from '../services/projectService';
import { useAsyncState } from './useAsyncState';

export interface UseTaskManagementReturn {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  selectedTask: TaskItem | null;
  fetchTasks: () => Promise<void>;
  handleTaskClick: (
    task: TaskItem,
    event: React.MouseEvent<HTMLElement>
  ) => void;
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

  // 获取任务数据
  const fetchTasks = useCallback(async () => {
    await execute(async () => {
      let tasksData: TaskItem[];
      if (currentProject) {
        // 如果有当前项目，获取项目的任务数据
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
  }, [currentProject, execute]);

  // 处理任务行点击事件
  const handleTaskClick = useCallback(
    (task: TaskItem, event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      console.log('Task clicked:', task.name); // 调试信息

      setSelectedTask(task);
    },
    []
  );

  // 关闭弹窗
  const closePopup = useCallback(() => {
    setSelectedTask(null);
  }, []);

  return {
    tasks: tasks || [],
    loading,
    error,
    selectedTask,
    fetchTasks,
    handleTaskClick,
    closePopup,
  };
};

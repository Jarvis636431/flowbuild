import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import type { TaskItem, Project } from '../services/api';

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
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // 获取任务数据
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

      setTasks(tasksData);
    } catch (err) {
      console.error('获取任务数据失败:', err);
      setError('获取任务数据失败，请重试');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

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
    tasks,
    loading,
    error,
    selectedTask,
    fetchTasks,
    handleTaskClick,
    closePopup,
  };
};

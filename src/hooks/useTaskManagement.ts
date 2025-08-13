import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import { projectAPI } from '../services/api';
import type { TaskItem } from '../services/api';
import type { Project, ProcessInfoResponse } from '../services/projectService';
import { useAsyncState } from './useAsyncState';
import { readExcelFromBuffer } from '../services/excelReader';

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

  // 解析Excel数据为TaskItem格式
  const parseExcelToTasks = useCallback(
    (excelData: unknown[][]): TaskItem[] => {
      const tasks: TaskItem[] = [];

      if (excelData.length < 2) {
        console.warn('Excel数据不足，无法解析任务');
        return tasks;
      }

      // 第一行是表头
      const headers = excelData[0] as string[];
      console.log('Excel表头:', headers);

      excelData.forEach((row, index) => {
        if (index === 0) return; // 跳过表头
        if (!row || !Array.isArray(row) || row.length === 0) return; // 跳过空行

        // 安全地访问数组元素
        const getRowValue = (idx: number): unknown => row[idx];
        const getStringValue = (idx: number, defaultValue = ''): string => {
          const val = getRowValue(idx);
          return val ? String(val) : defaultValue;
        };
        const getNumberValue = (idx: number, defaultValue = 0): number => {
          const val = getRowValue(idx);
          return typeof val === 'number' ? val : defaultValue;
        };

        // 根据表头动态解析数据
        const task: TaskItem = {
          id: index,
          name: getStringValue(0, `任务${index}`),
          serialNumber: index,
          constructionMethod: getStringValue(8),
          workerCount: getNumberValue(9),
          workType: getStringValue(10),
          cost: getNumberValue(11),
          workload: getNumberValue(12),
          unit: getStringValue(13),
          startDay: getNumberValue(1, 1),
          endDay: getNumberValue(2, 1),
          isOvertime: false,
          dependencies: [],
          projectId: currentProject ? parseInt(currentProject.id) : 1,
          startTime: { day: 1, hour: 0, totalHours: 24 },
          endTime: { day: 1, hour: 0, totalHours: 24 }
        };

        // 只添加有名称的任务
        if (task.name && task.name.trim() !== '') {
          tasks.push(task);
        }
      });

      console.log('解析的任务数据:', tasks);
      return tasks;
    },
    [currentProject]
  );

  // 获取任务数据
  const fetchTasks = useCallback(
    async (viewData?: ArrayBuffer) => {
      await execute(async () => {
        let tasksData: TaskItem[];

        if (viewData && viewData.byteLength > 0) {
          // 如果有view接口返回的Excel数据，解析它
          try {
            const excelData = await readExcelFromBuffer(viewData);
            tasksData = parseExcelToTasks(excelData);
            console.log('从Excel数据解析的任务:', tasksData);
          } catch (error) {
            console.error('解析Excel数据失败:', error);
            // 解析失败时回退到默认API
            tasksData = await taskAPI.getTasks();
          }
        } else if (viewData && viewData.byteLength === 0) {
          // 如果viewData是空的ArrayBuffer，说明需要从ProjectService获取数据
          console.log('🔍 检测到空ArrayBuffer标记，从ProjectService获取项目数据');
          try {
            // 从ProjectService获取项目数据
            const projects = await import('../services/projectService').then(m => m.ProjectService.getProjects());
            const targetProject = projects.find(p => p.id === currentProject?.id);
            
            if (targetProject && targetProject.tasks && targetProject.tasks.length > 0) {
              tasksData = targetProject.tasks;
              console.log('✅ 从ProjectService获取到任务数据:', tasksData.length, '个任务');
            } else {
              console.log('⚠️ ProjectService中未找到匹配的项目数据，使用默认API');
              tasksData = await taskAPI.getTasks();
            }
          } catch (error) {
            console.error('从ProjectService获取数据失败:', error);
            tasksData = await taskAPI.getTasks();
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
    [currentProject, execute, parseExcelToTasks]
  );

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

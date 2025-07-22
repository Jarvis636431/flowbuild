import axios from 'axios';

// 定义任务接口
export interface TaskItem {
  id: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  cost: string;
  personnel: string;
  notes: string;
}

// 模拟API基础URL
const API_BASE_URL = '/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 模拟数据
const mockTasks: TaskItem[] = [
  {
    id: 1,
    name: '地面支撑',
    status: 'completed',
    startDate: '2025-07-01',
    endDate: '2025-07-01',
    cost: '¥22400',
    personnel: '张三',
    notes: '铝模板'
  },
  {
    id: 2,
    name: '地面混凝土浇筑',
    status: 'completed',
    startDate: '2025-07-02',
    endDate: '2025-07-03',
    cost: '¥64000',
    personnel: '李四',
    notes: '图片'
  },
  {
    id: 3,
    name: '地面拆模',
    status: 'completed',
    startDate: '2025-07-04',
    endDate: '2025-07-04',
    cost: '¥18000',
    personnel: '张三',
    notes: '无'
  },
  {
    id: 4,
    name: '钢筋混凝土柱支撑',
    status: 'completed',
    startDate: '2025-07-05',
    endDate: '2025-07-05',
    cost: '¥18000',
    personnel: '王五',
    notes: '铝模板'
  },
  {
    id: 5,
    name: '钢筋混凝土柱浇筑',
    status: 'in-progress',
    startDate: '2025-07-06',
    endDate: '2025-07-08',
    cost: '¥96600',
    personnel: '唐六',
    notes: 'C30，4%'
  },
  {
    id: 6,
    name: '柱拆模',
    status: 'pending',
    startDate: '2025-07-09',
    endDate: '2025-07-09',
    cost: '¥12000',
    personnel: '张三',
    notes: '无'
  },
  {
    id: 7,
    name: '钢筋混凝土承重墙支撑',
    status: 'completed',
    startDate: '2025-07-05',
    endDate: '2025-07-05',
    cost: '¥14400',
    personnel: '王五',
    notes: '铝模板'
  },
  {
    id: 8,
    name: '钢筋混凝土承重墙浇筑',
    status: 'in-progress',
    startDate: '2025-07-06',
    endDate: '2025-07-08',
    cost: '¥124500',
    personnel: '唐六',
    notes: 'C30，4%'
  }
];

// API函数
export const taskAPI = {
  // 获取所有任务
  getTasks: async (): Promise<TaskItem[]> => {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在实际项目中，这里会是真实的API调用
      // const response = await apiClient.get('/tasks');
      // return response.data;
      
      // 目前返回模拟数据
      return mockTasks;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw new Error('获取任务列表失败');
    }
  },

  // 根据ID获取单个任务
  getTaskById: async (id: number): Promise<TaskItem | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // const response = await apiClient.get(`/tasks/${id}`);
      // return response.data;
      
      const task = mockTasks.find(task => task.id === id);
      return task || null;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      throw new Error('获取任务详情失败');
    }
  },

  // 创建新任务
  createTask: async (task: Omit<TaskItem, 'id'>): Promise<TaskItem> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // const response = await apiClient.post('/tasks', task);
      // return response.data;
      
      const newTask: TaskItem = {
        ...task,
        id: Math.max(...mockTasks.map(t => t.id)) + 1
      };
      mockTasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw new Error('创建任务失败');
    }
  },

  // 更新任务
  updateTask: async (id: number, updates: Partial<TaskItem>): Promise<TaskItem> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // const response = await apiClient.put(`/tasks/${id}`, updates);
      // return response.data;
      
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        throw new Error('任务不存在');
      }
      
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };
      return mockTasks[taskIndex];
    } catch (error) {
      console.error('更新任务失败:', error);
      throw new Error('更新任务失败');
    }
  },

  // 删除任务
  deleteTask: async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // await apiClient.delete(`/tasks/${id}`);
      
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        throw new Error('任务不存在');
      }
      
      mockTasks.splice(taskIndex, 1);
    } catch (error) {
      console.error('删除任务失败:', error);
      throw new Error('删除任务失败');
    }
  }
};

export default apiClient;
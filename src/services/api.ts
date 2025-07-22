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
  },
  {
    id: 9,
    name: '承重墙拆模',
    status: 'pending',
    startDate: '2025-07-09',
    endDate: '2025-07-10',
    cost: '¥15000',
    personnel: '王五',
    notes: '无'
  },
  {
    id: 10,
    name: '楼板钢筋绑扎',
    status: 'pending',
    startDate: '2025-07-10',
    endDate: '2025-07-12',
    cost: '¥85000',
    personnel: '赵七',
    notes: 'HRB400钢筋'
  },
  {
    id: 11,
    name: '楼板模板安装',
    status: 'pending',
    startDate: '2025-07-13',
    endDate: '2025-07-14',
    cost: '¥32000',
    personnel: '张三',
    notes: '木模板'
  },
  {
    id: 12,
    name: '楼板混凝土浇筑',
    status: 'pending',
    startDate: '2025-07-15',
    endDate: '2025-07-16',
    cost: '¥128000',
    personnel: '李四',
    notes: 'C30混凝土'
  },
  {
    id: 13,
    name: '楼板拆模',
    status: 'pending',
    startDate: '2025-07-22',
    endDate: '2025-07-23',
    cost: '¥18000',
    personnel: '张三',
    notes: '养护7天后'
  },
  {
    id: 14,
    name: '外墙砌筑',
    status: 'pending',
    startDate: '2025-07-17',
    endDate: '2025-07-20',
    cost: '¥76000',
    personnel: '孙八',
    notes: '加气混凝土砌块'
  },
  {
    id: 15,
    name: '内墙砌筑',
    status: 'pending',
    startDate: '2025-07-21',
    endDate: '2025-07-24',
    cost: '¥54000',
    personnel: '孙八',
    notes: '轻质隔墙板'
  },
  {
    id: 16,
    name: '屋面防水施工',
    status: 'pending',
    startDate: '2025-07-25',
    endDate: '2025-07-28',
    cost: '¥95000',
    personnel: '周九',
    notes: 'SBS改性沥青防水卷材'
  },
  {
    id: 17,
    name: '外墙保温施工',
    status: 'pending',
    startDate: '2025-07-29',
    endDate: '2025-08-02',
    cost: '¥112000',
    personnel: '吴十',
    notes: 'EPS外墙保温系统'
  },
  {
    id: 18,
    name: '门窗安装',
    status: 'pending',
    startDate: '2025-08-03',
    endDate: '2025-08-06',
    cost: '¥168000',
    personnel: '郑十一',
    notes: '断桥铝合金门窗'
  },
  {
    id: 19,
    name: '水电预埋',
    status: 'pending',
    startDate: '2025-08-07',
    endDate: '2025-08-12',
    cost: '¥145000',
    personnel: '王十二',
    notes: 'PVC管线预埋'
  },
  {
    id: 20,
    name: '内墙抹灰',
    status: 'pending',
    startDate: '2025-08-13',
    endDate: '2025-08-18',
    cost: '¥89000',
    personnel: '李十三',
    notes: '水泥砂浆抹灰'
  },
  {
    id: 21,
    name: '外墙涂料施工',
    status: 'pending',
    startDate: '2025-08-19',
    endDate: '2025-08-22',
    cost: '¥67000',
    personnel: '张十四',
    notes: '弹性外墙涂料'
  },
  {
    id: 22,
    name: '地面找平',
    status: 'pending',
    startDate: '2025-08-23',
    endDate: '2025-08-25',
    cost: '¥43000',
    personnel: '赵十五',
    notes: '自流平水泥'
  },
  {
    id: 23,
    name: '室内装修',
    status: 'pending',
    startDate: '2025-08-26',
    endDate: '2025-09-05',
    cost: '¥235000',
    personnel: '孙十六',
    notes: '精装修标准'
  },
  {
    id: 24,
    name: '竣工验收',
    status: 'pending',
    startDate: '2025-09-06',
    endDate: '2025-09-08',
    cost: '¥25000',
    personnel: '项目经理',
    notes: '质量验收'
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
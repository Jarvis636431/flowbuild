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

// 定义聊天消息接口
export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// 定义聊天请求接口
export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// 定义聊天响应接口
export interface ChatResponse {
  text: string;
  timestamp: Date;
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

// 聊天模拟数据
const mockChatResponses = {
  // 问候语回复
  greetings: [
    '你好！很高兴与你交流，有什么我可以帮助你的吗？',
    '您好！我是AI助手，随时为您服务。',
    '嗨！欢迎使用AI助手，请告诉我您需要什么帮助。'
  ],
  
  // 感谢回复
  thanks: [
    '不客气！如果还有其他问题，随时可以问我。',
    '很高兴能帮到您！还有什么需要协助的吗？',
    '不用谢！我随时为您提供帮助。'
  ],
  
  // 项目相关回复
  project: [
    '关于项目管理，我可以帮您分析甘特图、跟踪进度、优化资源配置。您具体想了解哪个方面？',
    '项目进展如何？我可以帮您查看任务状态、识别关键路径、预测完成时间。',
    '在项目管理中，及时沟通和进度跟踪非常重要。需要我帮您分析当前项目状况吗？'
  ],
  
  // 甘特图相关回复
  gantt: [
    '甘特图是项目管理的重要工具。我可以帮您分析任务依赖关系、识别关键路径、优化时间安排。',
    '从甘特图可以看出项目的整体进度。您想了解哪个任务的详细情况？',
    '甘特图显示了项目的时间线。我建议关注关键路径上的任务，确保项目按时完成。'
  ],
  
  // 成本相关回复
  cost: [
    '成本控制是项目成功的关键因素。我可以帮您分析预算执行情况、识别成本风险。',
    '从成本角度看，建议定期审查预算执行情况，及时调整资源配置。',
    '成本管理需要平衡质量、时间和预算。您希望我分析哪个方面的成本？'
  ],
  
  // 进度相关回复
  progress: [
    '项目进度管理很重要。我可以帮您分析当前进度、预测完成时间、识别潜在延期风险。',
    '根据甘特图，我建议重点关注关键路径上的任务进度，确保项目整体不延期。',
    '进度跟踪需要定期更新。您希望我帮您分析哪些任务的进度情况？'
  ],
  
  // 通用回复
  general: [
    '这是一个很好的问题！让我来帮你分析一下。',
    '我理解你的需求，这里有几个建议供你参考。',
    '根据你提供的信息，我认为可以这样处理。',
    '这个问题很有趣，让我为你详细解答。',
    '感谢你的提问，我会尽力为你提供帮助。',
    '基于我的理解，这里是一些可能的解决方案。',
    '让我为您分析一下这个情况，并提供一些建议。',
    '这确实是一个需要仔细考虑的问题，我来帮您梳理一下思路。'
  ]
};

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

// 聊天API函数
export const chatAPI = {
  // 发送消息并获取AI回复
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 在实际项目中，这里会是真实的API调用
      // const response = await apiClient.post('/chat', request);
      // return response.data;
      
      // 模拟AI回复逻辑
      const userMessage = request.message.toLowerCase();
      let responseText: string;
      
      // 关键词匹配逻辑
      if (userMessage.includes('你好') || userMessage.includes('hello') || userMessage.includes('hi')) {
        responseText = mockChatResponses.greetings[Math.floor(Math.random() * mockChatResponses.greetings.length)];
      } else if (userMessage.includes('谢谢') || userMessage.includes('感谢') || userMessage.includes('thanks')) {
        responseText = mockChatResponses.thanks[Math.floor(Math.random() * mockChatResponses.thanks.length)];
      } else if (userMessage.includes('项目') || userMessage.includes('project')) {
        responseText = mockChatResponses.project[Math.floor(Math.random() * mockChatResponses.project.length)];
      } else if (userMessage.includes('甘特图') || userMessage.includes('gantt') || userMessage.includes('进度图')) {
        responseText = mockChatResponses.gantt[Math.floor(Math.random() * mockChatResponses.gantt.length)];
      } else if (userMessage.includes('成本') || userMessage.includes('预算') || userMessage.includes('费用') || userMessage.includes('cost')) {
        responseText = mockChatResponses.cost[Math.floor(Math.random() * mockChatResponses.cost.length)];
      } else if (userMessage.includes('进度') || userMessage.includes('进展') || userMessage.includes('完成') || userMessage.includes('progress')) {
        responseText = mockChatResponses.progress[Math.floor(Math.random() * mockChatResponses.progress.length)];
      } else {
        responseText = mockChatResponses.general[Math.floor(Math.random() * mockChatResponses.general.length)];
      }
      
      return {
        text: responseText,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('发送消息失败:', error);
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  },
  
  // 获取聊天历史（如果需要的话）
  getChatHistory: async (): Promise<ChatMessage[]> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // const response = await apiClient.get('/chat/history');
      // return response.data;
      
      // 返回空历史记录，实际项目中可以从后端获取
      return [];
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      throw new Error('获取聊天历史失败');
    }
  }
};

export default apiClient;
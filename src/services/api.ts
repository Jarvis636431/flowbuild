// 定义接口类型
export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  totalCost: number;
  totalDays: number;
  color: string; // 项目主题色
}

export interface TaskItem {
  id: number;
  序号: number; // 序列号
  name: string; // 施工工序
  施工方式: string;
  施工人数: number;
  工种: string;
  cost: number; // 价格
  工程量: number;
  单位: string;
  startDay: number; // 开始时间
  endDay: number; // 结束时间
  是否加班: boolean;
  直接依赖工种: string[];
  projectId: number; // 关联的项目ID
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  text: string;
  timestamp: Date;
}

// 模拟项目数据
const mockProjects: Project[] = [
  {
    id: 1,
    name: '住宅楼建设项目',
    description: '某小区住宅楼建设工程，包含地基、主体结构、装修等全流程施工',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    totalCost: 2500000,
    totalDays: 70,
    color: '#007aff'
  },
  {
    id: 2,
    name: '办公楼改造项目',
    description: '老旧办公楼现代化改造，包含外立面、内部装修、设备更新',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-10'),
    totalCost: 1800000,
    totalDays: 45,
    color: '#34c759'
  },
  {
    id: 3,
    name: '商业综合体项目',
    description: '大型商业综合体建设，包含购物中心、写字楼、酒店等',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-12-31'),
    totalCost: 8500000,
    totalDays: 180,
    color: '#ff9500'
  }
];

// 模拟任务数据
const mockTasks: TaskItem[] = [
  {
    id: 1,
    序号: 1,
    name: '地面支撑',
    施工方式: '机械施工',
    施工人数: 8,
    工种: '模板工',
    cost: 22400,
    工程量: 200,
    单位: '平方米',
    startDay: 1,
    endDay: 1,
    是否加班: false,
    直接依赖工种: [],
    projectId: 1
  },
  {
    id: 2,
    序号: 2,
    name: '地面混凝土浇筑',
    施工方式: '机械浇筑',
    施工人数: 12,
    工种: '混凝土工',
    cost: 64000,
    工程量: 150,
    单位: '立方米',
    startDay: 2,
    endDay: 3,
    是否加班: true,
    直接依赖工种: ['模板工'],
    projectId: 1
  },
  {
    id: 3,
    序号: 3,
    name: '地面拆模',
    施工方式: '人工拆除',
    施工人数: 6,
    工种: '模板工',
    cost: 18000,
    工程量: 200,
    单位: '平方米',
    startDay: 4,
    endDay: 4,
    是否加班: false,
    直接依赖工种: ['混凝土工'],
    projectId: 1
  },
  {
    id: 4,
    序号: 4,
    name: '钢筋混凝土柱支撑',
    施工方式: '机械施工',
    施工人数: 10,
    工种: '模板工',
    cost: 18000,
    工程量: 80,
    单位: '平方米',
    startDay: 5,
    endDay: 5,
    是否加班: false,
    直接依赖工种: [],
    projectId: 1
  },
  {
    id: 5,
    序号: 5,
    name: '钢筋混凝土柱浇筑',
    施工方式: '机械浇筑',
    施工人数: 15,
    工种: '混凝土工',
    cost: 96600,
    工程量: 120,
    单位: '立方米',
    startDay: 6,
    endDay: 8,
    是否加班: true,
    直接依赖工种: ['模板工'],
    projectId: 1
  },
  {
    id: 6,
    序号: 6,
    name: '柱拆模',
    施工方式: '人工拆除',
    施工人数: 8,
    工种: '模板工',
    cost: 12000,
    工程量: 80,
    单位: '平方米',
    startDay: 9,
    endDay: 9,
    是否加班: false,
    直接依赖工种: ['混凝土工'],
    projectId: 1
  },
  {
    id: 7,
    序号: 7,
    name: '钢筋混凝土承重墙支撑',
    施工方式: '机械施工',
    施工人数: 12,
    工种: '模板工',
    cost: 14400,
    工程量: 120,
    单位: '平方米',
    startDay: 5,
    endDay: 5,
    是否加班: false,
    直接依赖工种: [],
    projectId: 1
  },
  {
    id: 8,
    序号: 8,
    name: '钢筋混凝土承重墙浇筑',
    施工方式: '机械浇筑',
    施工人数: 18,
    工种: '混凝土工',
    cost: 124500,
    工程量: 180,
    单位: '立方米',
    startDay: 6,
    endDay: 8,
    是否加班: true,
    直接依赖工种: ['模板工'],
    projectId: 1
  },
  {
    id: 9,
    序号: 9,
    name: '承重墙拆模',
    施工方式: '人工拆除',
    施工人数: 10,
    工种: '模板工',
    cost: 15000,
    工程量: 120,
    单位: '平方米',
    startDay: 9,
    endDay: 10,
    是否加班: false,
    直接依赖工种: ['混凝土工'],
    projectId: 1
  },
  {
    id: 10,
    序号: 10,
    name: '楼板钢筋绑扎',
    施工方式: '人工绑扎',
    施工人数: 20,
    工种: '钢筋工',
    cost: 85000,
    工程量: 500,
    单位: '平方米',
    startDay: 10,
    endDay: 12,
    是否加班: true,
    直接依赖工种: ['模板工'],
    projectId: 1
  },
  {
    id: 11,
    序号: 11,
    name: '楼板模板安装',
    施工方式: '机械施工',
    施工人数: 15,
    工种: '模板工',
    cost: 32000,
    工程量: 500,
    单位: '平方米',
    startDay: 13,
    endDay: 14,
    是否加班: false,
    直接依赖工种: ['钢筋工'],
    projectId: 1
  },
  {
    id: 12,
    序号: 12,
    name: '楼板混凝土浇筑',
    施工方式: '机械浇筑',
    施工人数: 25,
    工种: '混凝土工',
    cost: 128000,
    工程量: 300,
    单位: '立方米',
    startDay: 15,
    endDay: 16,
    是否加班: true,
    直接依赖工种: ['模板工'],
    projectId: 1
  },
  {
    id: 13,
    序号: 13,
    name: '楼板拆模',
    施工方式: '人工拆除',
    施工人数: 12,
    工种: '模板工',
    cost: 18000,
    工程量: 500,
    单位: '平方米',
    startDay: 22,
    endDay: 23,
    是否加班: false,
    直接依赖工种: ['混凝土工'],
    projectId: 1
  },
  {
    id: 14,
    序号: 1,
    name: '外立面清洗',
    施工方式: '机械清洗',
    施工人数: 8,
    工种: '清洁工',
    cost: 25000,
    工程量: 1200,
    单位: '平方米',
    startDay: 1,
    endDay: 3,
    是否加班: false,
    直接依赖工种: [],
    projectId: 2
  },
  {
    id: 15,
    序号: 2,
    name: '外墙保温拆除',
    施工方式: '人工拆除',
    施工人数: 12,
    工种: '拆除工',
    cost: 45000,
    工程量: 800,
    单位: '平方米',
    startDay: 4,
    endDay: 7,
    是否加班: true,
    直接依赖工种: ['清洁工'],
    projectId: 2
  },
  {
    id: 16,
    序号: 3,
    name: '屋面防水施工',
    施工方式: '人工施工',
    施工人数: 10,
    工种: '防水工',
    cost: 95000,
    工程量: 600,
    单位: '平方米',
    startDay: 25,
    endDay: 28,
    是否加班: false,
    直接依赖工种: ['拆除工'],
    projectId: 2
  },
  {
    id: 17,
    序号: 4,
    name: '外墙保温施工',
    施工方式: '机械施工',
    施工人数: 15,
    工种: '保温工',
    cost: 112000,
    工程量: 800,
    单位: '平方米',
    startDay: 29,
    endDay: 33,
    是否加班: true,
    直接依赖工种: ['防水工'],
    projectId: 2
  },
  {
    id: 18,
    序号: 5,
    name: '门窗安装',
    施工方式: '人工安装',
    施工人数: 8,
    工种: '门窗工',
    cost: 168000,
    工程量: 120,
    单位: '套',
    startDay: 34,
    endDay: 37,
    是否加班: false,
    直接依赖工种: ['保温工'],
    projectId: 2
  },
  {
    id: 19,
    序号: 6,
    name: '水电预埋',
    施工方式: '人工施工',
    施工人数: 12,
    工种: '水电工',
    cost: 145000,
    工程量: 2000,
    单位: '米',
    startDay: 38,
    endDay: 43,
    是否加班: true,
    直接依赖工种: ['门窗工'],
    projectId: 2
  },
  {
    id: 20,
    序号: 7,
    name: '内墙抹灰',
    施工方式: '人工施工',
    施工人数: 18,
    工种: '抹灰工',
    cost: 89000,
    工程量: 1500,
    单位: '平方米',
    startDay: 44,
    endDay: 49,
    是否加班: false,
    直接依赖工种: ['水电工'],
    projectId: 2
  },
  {
    id: 21,
    序号: 8,
    name: '外墙涂料施工',
    施工方式: '人工施工',
    施工人数: 10,
    工种: '涂料工',
    cost: 67000,
    工程量: 800,
    单位: '平方米',
    startDay: 50,
    endDay: 53,
    是否加班: false,
    直接依赖工种: ['抹灰工'],
    projectId: 2
  },
  {
    id: 22,
    序号: 9,
    name: '地面找平',
    施工方式: '机械施工',
    施工人数: 6,
    工种: '地面工',
    cost: 43000,
    工程量: 1000,
    单位: '平方米',
    startDay: 54,
    endDay: 56,
    是否加班: false,
    直接依赖工种: ['涂料工'],
    projectId: 2
  },
  {
    id: 23,
    序号: 10,
    name: '室内装修',
    施工方式: '人工施工',
    施工人数: 25,
    工种: '装修工',
    cost: 235000,
    工程量: 1000,
    单位: '平方米',
    startDay: 57,
    endDay: 67,
    是否加班: true,
    直接依赖工种: ['地面工'],
    projectId: 2
  },
  {
    id: 24,
    序号: 14,
    name: '竣工验收',
    施工方式: '检查验收',
    施工人数: 5,
    工种: '质检员',
    cost: 25000,
    工程量: 1,
    单位: '项',
    startDay: 68,
    endDay: 70,
    是否加班: false,
    直接依赖工种: ['装修工'],
    projectId: 1
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

// 项目API函数
export const projectAPI = {
  // 获取所有项目
  getProjects: async (): Promise<Project[]> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockProjects;
    } catch (error) {
      console.error('获取项目列表失败:', error);
      throw new Error('获取项目列表失败');
    }
  },

  // 根据ID获取单个项目
  getProjectById: async (id: number): Promise<Project | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const project = mockProjects.find(project => project.id === id);
      return project || null;
    } catch (error) {
      console.error('获取项目详情失败:', error);
      throw new Error('获取项目详情失败');
    }
  },

  // 创建新项目
  createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newProject: Project = {
        ...project,
        id: Math.max(...mockProjects.map(p => p.id)) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockProjects.push(newProject);
      return newProject;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw new Error('创建项目失败');
    }
  },

  // 更新项目
  updateProject: async (id: number, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const projectIndex = mockProjects.findIndex(project => project.id === id);
      if (projectIndex === -1) {
        throw new Error('项目不存在');
      }
      mockProjects[projectIndex] = {
        ...mockProjects[projectIndex],
        ...updates,
        updatedAt: new Date()
      };
      return mockProjects[projectIndex];
    } catch (error) {
      console.error('更新项目失败:', error);
      throw new Error('更新项目失败');
    }
  },

  // 删除项目
  deleteProject: async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const projectIndex = mockProjects.findIndex(project => project.id === id);
      if (projectIndex === -1) {
        throw new Error('项目不存在');
      }
      // 同时删除该项目下的所有任务
      for (let i = mockTasks.length - 1; i >= 0; i--) {
        if (mockTasks[i].projectId === id) {
          mockTasks.splice(i, 1);
        }
      }
      mockProjects.splice(projectIndex, 1);
    } catch (error) {
      console.error('删除项目失败:', error);
      throw new Error('删除项目失败');
    }
  },

  // 根据项目ID获取任务列表
  getTasksByProjectId: async (projectId: number): Promise<TaskItem[]> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTasks.filter(task => task.projectId === projectId);
    } catch (error) {
      console.error('获取项目任务失败:', error);
      throw new Error('获取项目任务失败');
    }
  }
};
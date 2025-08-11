// 定义接口类型
export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  totalCost: number;
  totalDays: number;
  color: string; // 项目主题色
}

export interface TaskItem {
  id: number;
  name: string;
  status: 'active';
  startDay: number;
  endDay: number;
  cost: number;
  personnel: string;
  notes: string;
  details: string;
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
    status: 'active',
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
    status: 'paused',
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
    status: 'completed',
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
    name: '地面支撑',
    status: 'active',
    startDay: 1,
    endDay: 1,
    cost: 22400,
    personnel: '张三',
    notes: '铝模板',
    details: '地面支撑工程采用铝合金模板系统，包括底板支撑、侧模安装等工序。施工面积约200平方米，使用铝模板可重复利用，提高施工效率。',
    projectId: 1
  },
  {
    id: 2,
    name: '地面混凝土浇筑',
    status: 'active',
    startDay: 2,
    endDay: 3,
    cost: 64000,
    personnel: '李四',
    notes: '图片',
    details: '地面混凝土浇筑采用C30商品混凝土，浇筑厚度150mm。施工过程中需要控制混凝土坍落度，确保浇筑质量。浇筑完成后需要及时养护。',
    projectId: 1
  },
  {
    id: 3,
    name: '地面拆模',
    status: 'active',
    startDay: 4,
    endDay: 4,
    cost: 18000,
    personnel: '张三',
    notes: '无',
    details: '混凝土达到拆模强度后进行拆模作业。拆模时需要小心操作，避免损坏混凝土表面。拆下的模板需要清理并妥善保管，以备下次使用。',
    projectId: 1
  },
  {
    id: 4,
    name: '钢筋混凝土柱支撑',
    status: 'active',
    startDay: 5,
    endDay: 5,
    cost: 18000,
    personnel: '王五',
    notes: '铝模板',
    details: '钢筋混凝土柱支撑采用铝合金模板系统，确保柱子截面尺寸准确。支撑系统需要承受混凝土浇筑时的侧压力，施工时需要严格按照设计要求进行。',
    projectId: 1
  },
  {
    id: 5,
    name: '钢筋混凝土柱浇筑',
    status: 'active',
    startDay: 6,
    endDay: 8,
    cost: 96600,
    personnel: '唐六',
    notes: 'C30，4%',
    details: '柱子混凝土浇筑采用C30强度等级混凝土，钢筋保护层厚度25mm。浇筑过程中需要分层浇筑，每层厚度不超过500mm，并使用振动棒充分振捣。',
    projectId: 1
  },
  {
    id: 6,
    name: '柱拆模',
    status: 'active',
    startDay: 9,
    endDay: 9,
    cost: 12000,
    personnel: '张三',
    notes: '无',
    details: '柱子拆模需要在混凝土强度达到设计强度的70%以上时进行。拆模时要小心操作，避免损坏柱子棱角。拆模后需要对柱子表面进行检查和修补。',
    projectId: 1
  },
  {
    id: 7,
    name: '钢筋混凝土承重墙支撑',
    status: 'active',
    startDay: 5,
    endDay: 5,
    cost: 14400,
    personnel: '王五',
    notes: '铝模板',
    details: '承重墙支撑系统采用铝合金大模板，墙厚200mm。支撑系统包括内外侧模板、拉杆、支撑架等，确保墙体垂直度和平整度符合要求。',
    projectId: 1
  },
  {
    id: 8,
    name: '钢筋混凝土承重墙浇筑',
    status: 'active',
    startDay: 6,
    endDay: 8,
    cost: 124500,
    personnel: '唐六',
    notes: 'C30，4%',
    details: '承重墙混凝土浇筑采用C30混凝土，墙厚200mm。浇筑时需要控制浇筑速度，避免产生蜂窝、麻面等质量缺陷。浇筑完成后需要及时覆盖养护。',
    projectId: 1
  },
  {
    id: 9,
    name: '承重墙拆模',
    status: 'active',
    startDay: 9,
    endDay: 10,
    cost: 15000,
    personnel: '王五',
    notes: '无',
    details: '承重墙拆模需要在混凝土强度达到要求后进行。拆模顺序应先拆非承重侧模板，再拆承重侧模板。拆模后需要检查墙体质量，及时处理表面缺陷。',
    projectId: 1
  },
  {
    id: 10,
    name: '楼板钢筋绑扎',
    status: 'active',
    startDay: 10,
    endDay: 12,
    cost: 85000,
    personnel: '赵七',
    notes: 'HRB400钢筋',
    details: '楼板钢筋绑扎采用HRB400级钢筋，按设计图纸进行配筋。钢筋间距需要严格控制，保护层厚度15mm。绑扎完成后需要进行隐蔽工程验收。',
    projectId: 1
  },
  {
    id: 11,
    name: '楼板模板安装',
    status: 'active',
    startDay: 13,
    endDay: 14,
    cost: 32000,
    personnel: '张三',
    notes: '木模板',
    details: '楼板模板采用18mm厚胶合板，支撑系统采用钢管脚手架。模板安装前需要检查支撑系统的稳定性，确保模板平整度符合要求。',
    projectId: 1
  },
  {
    id: 12,
    name: '楼板混凝土浇筑',
    status: 'active',
    startDay: 15,
    endDay: 16,
    cost: 128000,
    personnel: '李四',
    notes: 'C30混凝土',
    details: '楼板混凝土浇筑采用C30商品混凝土，板厚120mm。浇筑时需要控制浇筑顺序，避免冷缝产生。浇筑完成后需要及时进行表面处理和养护。',
    projectId: 1
  },
  {
    id: 13,
    name: '楼板拆模',
    status: 'active',
    startDay: 22,
    endDay: 23,
    cost: 18000,
    personnel: '张三',
    notes: '养护7天后',
    details: '楼板拆模需要在混凝土强度达到设计强度的75%以上时进行，通常需要养护7天。拆模时应先拆侧模，再拆底模，避免损坏楼板。',
    projectId: 1
  },
  {
    id: 14,
    name: '外立面清洗',
    status: 'active',
    startDay: 1,
    endDay: 3,
    cost: 25000,
    personnel: '孙八',
    notes: '高压水枪清洗',
    details: '办公楼外立面清洗，去除污垢和老化涂层，为后续改造工程做准备。使用高压水枪和专业清洁剂，确保清洗彻底。',
    projectId: 2
  },
  {
    id: 15,
    name: '外墙保温拆除',
    status: 'active',
    startDay: 4,
    endDay: 7,
    cost: 45000,
    personnel: '孙八',
    notes: '旧保温材料拆除',
    details: '拆除老旧的外墙保温材料，检查墙体结构状况。拆除过程中注意安全防护，妥善处理废料。',
    projectId: 2
  },
  {
    id: 16,
    name: '屋面防水施工',
    status: 'active',
    startDay: 25,
    endDay: 28,
    cost: 95000,
    personnel: '周九',
    notes: 'SBS改性沥青防水卷材',
    details: '屋面防水采用SBS改性沥青防水卷材，厚度4mm。施工前需要清理基层，确保干燥平整。卷材铺设时需要控制搭接宽度，热熔施工确保粘结牢固。',
    projectId: 2
  },
  {
    id: 17,
    name: '外墙保温施工',
    status: 'active',
    startDay: 29,
    endDay: 33,
    cost: 112000,
    personnel: '吴十',
    notes: 'EPS外墙保温系统',
    details: 'EPS外墙保温系统包括保温板、粘结砂浆、抗裂砂浆、耐碱玻纤维网格布等。施工时需要控制保温板拼缝，确保系统整体性和保温效果。',
    projectId: 2
  },
  {
    id: 18,
    name: '门窗安装',
    status: 'active',
    startDay: 34,
    endDay: 37,
    cost: 168000,
    personnel: '郑十一',
    notes: '断桥铝合金门窗',
    details: '门窗采用断桥铝合金材质，具有良好的保温隔热性能。安装时需要控制门窗框的垂直度和水平度，密封胶条安装要到位，确保气密性和水密性。',
    projectId: 2
  },
  {
    id: 19,
    name: '水电预埋',
    status: 'active',
    startDay: 38,
    endDay: 43,
    cost: 145000,
    personnel: '王十二',
    notes: 'PVC管线预埋',
    details: '水电预埋包括给排水管道、电气线路等。采用PVC管材，管径根据设计要求选择。预埋时需要注意管线走向，避免交叉冲突，预留检修口。',
    projectId: 2
  },
  {
    id: 20,
    name: '内墙抹灰',
    status: 'active',
    startDay: 44,
    endDay: 49,
    cost: 89000,
    personnel: '李十三',
    notes: '水泥砂浆抹灰',
    details: '内墙抹灰采用1:3水泥砂浆，分两遍施工。第一遍粗抹找平，第二遍精抹压光。抹灰厚度控制在15-20mm，表面平整度偏差不超过4mm。',
    projectId: 2
  },
  {
    id: 21,
    name: '外墙涂料施工',
    status: 'active',
    startDay: 50,
    endDay: 53,
    cost: 67000,
    personnel: '张十四',
    notes: '弹性外墙涂料',
    details: '外墙涂料采用弹性涂料，具有良好的耐候性和装饰效果。施工前需要处理基层，刮腻子找平。涂料施工分底漆和面漆两遍，确保涂膜厚度均匀。',
    projectId: 2
  },
  {
    id: 22,
    name: '地面找平',
    status: 'active',
    startDay: 54,
    endDay: 56,
    cost: 43000,
    personnel: '赵十五',
    notes: '自流平水泥',
    details: '地面找平采用自流平水泥，厚度3-5mm。施工前需要清理基层，涂刷界面剂。自流平施工需要控制流动性，确保表面平整度达到要求。',
    projectId: 2
  },
  {
    id: 23,
    name: '室内装修',
    status: 'active',
    startDay: 57,
    endDay: 67,
    cost: 235000,
    personnel: '孙十六',
    notes: '精装修标准',
    details: '室内装修按精装修标准执行，包括地面铺装、墙面装饰、吊顶安装、灯具安装等。材料选用环保产品，施工工艺要求精细，确保装修质量和效果。',
    projectId: 2
  },
  {
    id: 24,
    name: '竣工验收',
    status: 'active',
    startDay: 68,
    endDay: 70,
    cost: 25000,
    personnel: '项目经理',
    notes: '质量验收',
    details: '竣工验收包括工程质量检查、安全检查、环保检查等。需要准备完整的工程资料，包括施工记录、检测报告、隐蔽工程验收记录等，确保工程符合验收标准。',
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
// 重新导出projectAPI和Project以保持向后兼容
export { projectAPI, type Project } from './projectService';

// 定义时间接口
export interface TaskTime {
  day: number; // 天数
  hour: number; // 小时 (0-23)
  totalHours: number; // 总小时数 (便于计算)
}

export interface TaskItem {
  id: number;
  serialNumber: number; // 序列号
  name: string; // 施工工序
  constructionMethod: string; // 施工方式
  workerCount: number; // 施工人数
  workType: string; // 工种
  cost: number; // 价格
  workload: number; // 工程量
  unit: string; // 单位
  startTime: TaskTime; // 详细开始时间
  endTime: TaskTime; // 详细结束时间
  isOvertime: boolean; // 是否加班
  dependencies: string[]; // 直接依赖工种
  projectId: number; // 关联的项目ID
}

// 定义approval消息的数据结构
export interface ApprovalData {
  type: string;
  text?: string;
  message?: string;
  approval_id?: string | number;
  title?: string;
  source_node?: string;
  pending_update_call?: {
    tool_name: string;
    args: Record<string, unknown>;
  };
  ai_message?: {
    text: string;
  };
  approved?: boolean;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  needsApproval?: boolean;
  approvalData?: ApprovalData;
  className?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  type: string;
  text?: string;
  timestamp?: Date;
  message?: string;
  approval_id?: string | number;
  title?: string;
  source_node?: string;
  pending_update_call?: {
    tool_name: string;
    args: Record<string, unknown>;
  };
  ai_message?: {
    text: string;
  };
  [key: string]: unknown;
}

// 初始化数据变量
const mockTasks: TaskItem[] = [];



// 聊天模拟数据
const mockChatResponses = {
  // 问候语回复
  greetings: [
    '你好！很高兴与你交流，有什么我可以帮助你的吗？',
    '您好！我是AI助手，随时为您服务。',
    '嗨！欢迎使用AI助手，请告诉我您需要什么帮助。',
  ],

  // 感谢回复
  thanks: [
    '不客气！如果还有其他问题，随时可以问我。',
    '很高兴能帮到您！还有什么需要协助的吗？',
    '不用谢！我随时为您提供帮助。',
  ],

  // 项目相关回复
  project: [
    '关于项目管理，我可以帮您分析甘特图、跟踪进度、优化资源配置。您具体想了解哪个方面？',
    '项目进展如何？我可以帮您查看任务状态、识别关键路径、预测完成时间。',
    '在项目管理中，及时沟通和进度跟踪非常重要。需要我帮您分析当前项目状况吗？',
  ],

  // 甘特图相关回复
  gantt: [
    '甘特图是项目管理的重要工具。我可以帮您分析任务依赖关系、识别关键路径、优化时间安排。',
    '从甘特图可以看出项目的整体进度。您想了解哪个任务的详细情况？',
    '甘特图显示了项目的时间线。我建议关注关键路径上的任务，确保项目按时完成。',
  ],

  // 成本相关回复
  cost: [
    '成本控制是项目成功的关键因素。我可以帮您分析预算执行情况、识别成本风险。',
    '从成本角度看，建议定期审查预算执行情况，及时调整资源配置。',
    '成本管理需要平衡质量、时间和预算。您希望我分析哪个方面的成本？',
  ],

  // 进度相关回复
  progress: [
    '项目进度管理很重要。我可以帮您分析当前进度、预测完成时间、识别潜在延期风险。',
    '根据甘特图，我建议重点关注关键路径上的任务进度，确保项目整体不延期。',
    '进度跟踪需要定期更新。您希望我帮您分析哪些任务的进度情况？',
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
    '这确实是一个需要仔细考虑的问题，我来帮您梳理一下思路。',
  ],
};

// API函数
export const taskAPI = {
  // 获取所有任务
  getTasks: async (): Promise<TaskItem[]> => {
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      await new Promise((resolve) => setTimeout(resolve, 300));

      // const response = await apiClient.get(`/tasks/${id}`);
      // return response.data;

      const task = mockTasks.find((task) => task.id === id);
      return task || null;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      throw new Error('获取任务详情失败');
    }
  },

  // 创建新任务
  createTask: async (task: Omit<TaskItem, 'id'>): Promise<TaskItem> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // const response = await apiClient.post('/tasks', task);
      // return response.data;

      const newTask: TaskItem = {
        ...task,
        id: Math.max(...mockTasks.map((t) => t.id)) + 1,
      };
      mockTasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw new Error('创建任务失败');
    }
  },

  // 更新任务
  updateTask: async (
    id: number,
    updates: Partial<TaskItem>
  ): Promise<TaskItem> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // const response = await apiClient.put(`/tasks/${id}`, updates);
      // return response.data;

      const taskIndex = mockTasks.findIndex((task) => task.id === id);
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
      await new Promise((resolve) => setTimeout(resolve, 400));

      // await apiClient.delete(`/tasks/${id}`);

      const taskIndex = mockTasks.findIndex((task) => task.id === id);
      if (taskIndex === -1) {
        throw new Error('任务不存在');
      }

      mockTasks.splice(taskIndex, 1);
    } catch (error) {
      console.error('删除任务失败:', error);
      throw new Error('删除任务失败');
    }
  },
};



// 聊天API函数
export const chatAPI = {
  // 发送消息并获取AI回复
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      // 模拟网络延迟
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // 在实际项目中，这里会是真实的API调用
      // const response = await apiClient.post('/chat', request);
      // return response.data;

      // 模拟AI回复逻辑
      const userMessage = request.message.toLowerCase();
      let responseText: string;
      let responseType: string;

      // 关键词匹配逻辑，只使用真实API的两种类型：approval、done
      if (
        userMessage.includes('确认') ||
        userMessage.includes('同意') ||
        userMessage.includes('approve') ||
        userMessage.includes('批准')
      ) {
        responseText = '好的，我已收到您的确认。请问您是否同意继续执行此操作？';
        responseType = 'approval';
      } else if (
        userMessage.includes('更新') ||
        userMessage.includes('修改') ||
        userMessage.includes('update') ||
        userMessage.includes('完成')
      ) {
        responseText = '更新操作已完成。';
        responseType = 'done';
      } else {
        // 其他所有情况都使用done类型，根据关键词选择合适的回复
        if (
          userMessage.includes('你好') ||
          userMessage.includes('hello') ||
          userMessage.includes('hi')
        ) {
          responseText =
            mockChatResponses.greetings[
              Math.floor(Math.random() * mockChatResponses.greetings.length)
            ];
        } else if (
          userMessage.includes('谢谢') ||
          userMessage.includes('感谢') ||
          userMessage.includes('thanks')
        ) {
          responseText =
            mockChatResponses.thanks[
              Math.floor(Math.random() * mockChatResponses.thanks.length)
            ];
        } else if (
          userMessage.includes('项目') ||
          userMessage.includes('project')
        ) {
          responseText =
            mockChatResponses.project[
              Math.floor(Math.random() * mockChatResponses.project.length)
            ];
        } else if (
          userMessage.includes('甘特图') ||
          userMessage.includes('gantt') ||
          userMessage.includes('进度图')
        ) {
          responseText =
            mockChatResponses.gantt[
              Math.floor(Math.random() * mockChatResponses.gantt.length)
            ];
        } else if (
          userMessage.includes('成本') ||
          userMessage.includes('预算') ||
          userMessage.includes('费用') ||
          userMessage.includes('cost')
        ) {
          responseText =
            mockChatResponses.cost[
              Math.floor(Math.random() * mockChatResponses.cost.length)
            ];
        } else if (
          userMessage.includes('进度') ||
          userMessage.includes('进展') ||
          userMessage.includes('progress')
        ) {
          responseText =
            mockChatResponses.progress[
              Math.floor(Math.random() * mockChatResponses.progress.length)
            ];
        } else {
          responseText =
            mockChatResponses.general[
              Math.floor(Math.random() * mockChatResponses.general.length)
            ];
        }
        responseType = 'done';
      }

      // 根据响应类型构建不同格式的响应
      if (responseType === 'approval') {
        return {
          type: responseType,
          title: 'Update requires approval',
          source_node: 'apply_update',
          pending_update_call: {
            tool_name: 'update_project_config',
            args: {
              project_id: 'current_project_id',
              update_config: {
                construction_methods: [
                  {
                    task_name: '内隔墙施工',
                    method_index: 0
                  }
                ]
              },
              description: 'Update construction methods to use lightweight partition walls for all interior walls.'
            }
          },
          ai_message: {
            text: responseText
          },
          timestamp: new Date(),
        };
      } else {
        return {
          type: responseType,
          text: responseText,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  },

  // 获取聊天历史（如果需要的话）
  getChatHistory: async (): Promise<ChatMessage[]> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // const response = await apiClient.get('/chat/history');
      // return response.data;

      // 返回空历史记录，实际项目中可以从后端获取
      return [];
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      throw new Error('获取聊天历史失败');
    }
  },
};

// 图表数据接口类型定义
export interface CrewData {
  name: string;
  date: number[];
  data: number[];
}

export interface BudgetData {
  name: string;
  date: number[];
  data: number[];
}

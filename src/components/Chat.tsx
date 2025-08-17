import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage, type ApprovalData, chatAPI } from '../services/api';
import { getDefaultWebSocketService } from '../services/nativeWebSocketService';
import type { WebSocketStatus } from '../services/nativeWebSocketService';
import { AuthService } from '../services/authService';
import { type Project, projectAPI } from '../services/projectService';
import { FEATURE_FLAGS } from '../config/features';

interface ChatProps {
  currentProject?: Project | null;
}

const Chat: React.FC<ChatProps> = ({ currentProject }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '你好！我是AI助手，有什么可以帮你的吗？',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socketStatus, setSocketStatus] =
    useState<WebSocketStatus>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [isAwaitingApprovalResponse, setIsAwaitingApprovalResponse] = useState(false);
  const isAwaitingApprovalResponseRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 监听isAwaitingApprovalResponse状态变化
  useEffect(() => {
    console.log('🔍 [状态监听] isAwaitingApprovalResponse状态变化:', {
      newValue: isAwaitingApprovalResponse,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });
  }, [isAwaitingApprovalResponse]);

  // WebSocket连接管理
  useEffect(() => {
    console.log('🔍 Chat组件 - useEffect触发，项目ID:', currentProject?.id);

    // 项目切换时清空聊天记录
    setMessages([
      {
        id: 1,
        text: '你好！我是AI助手，有什么可以帮你的吗？',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);

    const socketService = getDefaultWebSocketService();
    if (!socketService) {
      console.warn('❌ Chat组件 - WebSocket服务未初始化');
      return;
    }

    console.log(
      '✅ Chat组件 - 获取到WebSocket服务，当前状态:',
      socketService.getStatus()
    );

    // 监听连接状态变化
    const handleStatusChange = (...args: unknown[]) => {
      const status = args[0] as WebSocketStatus;
      console.log('🔄 Chat组件 - 收到状态变化事件:', {
        newStatus: status,
        previousStatus: socketStatus,
        isConnectedBefore: isConnected,
        willBeConnected: status === 'connected',
        timestamp: new Date().toISOString(),
      });

      setSocketStatus(status);
      setIsConnected(status === 'connected');

      // 连接建立后发送初始化消息
      // if (status === 'connected') {
      //   setTimeout(() => {
      //     sendInitMessage();
      //   }, 100); // 稍微延迟确保连接稳定
      // }
    };

    // 监听接收到的消息
    const handleMessage = (...args: unknown[]) => {
      const data = args[0] as ApprovalData;
      console.log('Chat组件 - 收到WebSocket消息:', {
         data,
         currentIsAwaitingApprovalResponse: isAwaitingApprovalResponse,
         currentIsAwaitingApprovalResponseRef: isAwaitingApprovalResponseRef.current,
         timestamp: new Date().toISOString()
       });

      // 处理不同类型的消息
      if (data.type === 'done' && data.text) {
        // 任务完成消息 - 特殊处理确保显示
        console.log('🎯 Chat组件 - 处理 done 消息:', {
          text: data.text,
          timestamp: new Date().toISOString(),
          isConnected: socketService.isConnected(),
          socketStatus: socketService.getStatus(),
          isAwaitingApprovalResponse,
          isAwaitingApprovalResponseRef: isAwaitingApprovalResponseRef.current,
          willTriggerRefresh: isAwaitingApprovalResponseRef.current
        });
        
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: data.text,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        // 立即设置消息，确保显示
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        
        // 如果是确认按钮点击后的响应，调用刷新接口
        const shouldTriggerRefresh = isAwaitingApprovalResponseRef.current;
        if (shouldTriggerRefresh) {
          setIsAwaitingApprovalResponse(false);
          isAwaitingApprovalResponseRef.current = false;
          console.log('🎯 [刷新流程] 确认操作完成，开始调用刷新接口', {
            currentProject: currentProject?.id,
            timestamp: new Date().toISOString(),
            messageType: data.type,
            wasAwaitingApproval: shouldTriggerRefresh
          });
            
            console.log('🔄 [刷新流程] 开始刷新项目数据', { timestamp: new Date().toISOString() });
                 
                 // 调用/view接口刷新数据
                 if (currentProject?.id) {
                   console.log('🚀 [刷新流程] 开始执行数据刷新', {
                     projectId: currentProject.id,
                     projectName: currentProject.name
                   });
                   
                   const refreshData = async () => {
                     try {
                       console.log('📡 [API调用] 开始调用/view接口', {
                         projectId: currentProject.id,
                         apiEndpoint: 'downloadProjectExcel',
                         startTime: new Date().toISOString()
                       });
                       
                       const startTime = performance.now();
                       const file = await projectAPI.downloadProjectExcel(currentProject.id);
                       const downloadTime = performance.now() - startTime;
                       
                       console.log('📥 [API调用] Excel文件下载完成', {
                         downloadTime: `${downloadTime.toFixed(2)}ms`,
                         fileSize: file.size,
                         fileType: file.type
                       });
                       
                       const excelData = await file.arrayBuffer();
                       const totalTime = performance.now() - startTime;
                       
                       console.log('🔄 [数据处理] Excel数据转换完成', {
                         dataSize: excelData.byteLength,
                         totalTime: `${totalTime.toFixed(2)}ms`
                       });
                       
                       // 触发数据刷新事件，通知父组件更新数据
                       const refreshEvent = new CustomEvent('projectDataRefresh', {
                         detail: { projectId: currentProject.id, excelData }
                       });
                       
                       console.log('📢 [事件触发] 发送项目数据刷新事件', {
                         eventType: 'projectDataRefresh',
                         projectId: currentProject.id,
                         dataSize: excelData.byteLength
                       });
                       
                       window.dispatchEvent(refreshEvent);
                       
                       console.log('✅ [刷新流程] 数据刷新成功完成', {
                         totalTime: `${totalTime.toFixed(2)}ms`,
                         projectId: currentProject.id
                       });
                     } catch (error) {
                       console.error('❌ [刷新流程] 数据刷新失败', {
                         error: error instanceof Error ? error.message : String(error),
                         stack: error instanceof Error ? error.stack : undefined,
                         projectId: currentProject.id,
                         timestamp: new Date().toISOString()
                       });
                       
                       console.log('❌ [刷新流程] 数据刷新失败', {
                         errorType: error instanceof Error ? error.constructor.name : 'Unknown'
                       });
                     }
                   };
                   
                   refreshData();
                 } else {
                   console.warn('⚠️ [刷新流程] 无法获取当前项目ID，跳过刷新操作', {
                     currentProject: currentProject,
                     hasProject: !!currentProject,
                     hasProjectId: !!currentProject?.id
                   });
                 }
          }
        
        // 延迟确认消息已显示
        setTimeout(() => {
          console.log('✅ done 消息已添加到聊天界面:', aiMessage);
        }, 100);
        
      } else if (data.type === 'approval') {
        // 需要用户确认的消息 - 新格式支持
        const messageText = data.ai_message?.text || data.text || '需要确认的操作';
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: messageText,
          sender: 'ai',
          timestamp: new Date(),
          needsApproval: true, // 添加标记，表示需要确认按钮
          approvalData: data, // 保存原始数据，用于确认操作
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);

      }
    };

    // 绑定事件监听器
    socketService.on('statusChange', handleStatusChange);
    socketService.on('message', handleMessage);

    // 获取当前连接状态
    const currentStatus = socketService.getStatus();
    console.log('📊 Chat组件 - 初始状态设置:', {
      currentStatus,
      isConnected: currentStatus === 'connected',
      socketServiceExists: !!socketService,
      projectId: currentProject?.id,
    });

    setSocketStatus(currentStatus);
    setIsConnected(currentStatus === 'connected');

    // 延迟检查确保状态同步
    setTimeout(() => {
      const latestStatus = socketService.getStatus();
      console.log('⏰ Chat组件 - 延迟状态检查:', {
        latestStatus,
        currentDisplayStatus: socketStatus,
        shouldUpdate: latestStatus !== currentStatus,
      });

      if (latestStatus !== currentStatus) {
        console.log('🔄 Chat组件 - 状态不一致，强制更新');
        setSocketStatus(latestStatus);
        setIsConnected(latestStatus === 'connected');
      }
    }, 200);

    // 清理函数
    return () => {
      socketService.off('statusChange', handleStatusChange);
      socketService.off('message', handleMessage);
      socketService.off('chat_response', handleMessage);
    };
  }, [currentProject?.id]);

  // 发送初始化消息
  // const sendInitMessage = (): boolean => {
  //   const socketService = getDefaultWebSocketService();
  //   if (!socketService || !socketService.isConnected()) {
  //     return false;
  //   }

  //   try {
  //     const user = AuthService.getCurrentUserSync();
  //     const token = AuthService.getToken();

  //     if (!user || !token) {
  //       return false;
  //     }

  //     let projectId: string | undefined;
  //     if (currentProject?.id) {
  //       projectId = currentProject.id;
  //     } else if (user.projects && user.projects.length > 0) {
  //       projectId = user.projects[0];
  //     }

  //     if (!projectId) {
  //       return false;
  //     }

  //     const initData = {
  //       type: 'init',
  //       project_id: projectId,
  //       token: token,
  //     };

  //     socketService.sendRaw(initData);
  //     console.log('Chat组件 - 发送初始化消息:', initData);
  //     return true;
  //   } catch (error) {
  //     console.error('发送初始化消息失败:', error);
  //     return false;
  //   }
  // };

  // 通过WebSocket发送消息
  const sendSocketMessage = (userMessage: string): boolean => {
    const socketService = getDefaultWebSocketService();
    if (!socketService || !socketService.isConnected()) {
      console.error('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      // 获取当前用户和项目信息
      const user = AuthService.getCurrentUserSync();
      const token = AuthService.getToken();

      if (!user || !token) {
        console.error('用户未认证，无法发送消息');
        return false;
      }

      // 获取项目ID
      let projectId: string | undefined;

      // 优先使用传入的currentProject
      if (currentProject?.id) {
        projectId = currentProject.id;
      }
      // 如果没有传入项目，尝试从用户项目中获取第一个
      else if (user.projects && user.projects.length > 0) {
        projectId = user.projects[0];
      }

      if (!projectId) {
        console.error('无法获取项目ID，无法发送消息');
        return false;
      }

      // 按照用户指定的格式构建消息
      const messageData = {
        type: 'user',
        project_id: projectId,
        token: token,
        text: userMessage,
      };

      socketService.sendRaw(messageData);
      console.log('Chat组件 - 发送WebSocket消息:', messageData);
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    // 检查是否使用模拟聊天
    if (FEATURE_FLAGS.USE_MOCK_CHAT) {
      // 使用模拟聊天API
      const userMessage: ChatMessage = {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date(),
      };

      const currentInput = inputValue;
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      try {
        // 调用模拟聊天API
        const response = await chatAPI.sendMessage({
          message: currentInput,
          history: messages,
        });

        // 根据响应类型处理模拟API响应，与WebSocket模式保持一致
        if (response.type === 'done' && response.text) {
          // 任务完成消息
          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            text: response.text,
            sender: 'ai',
            timestamp: response.timestamp || new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else if (response.type === 'approval') {
          // 需要用户确认的消息 - 新格式支持
          const messageText = response.ai_message?.text || response.text || '需要确认的操作';
          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            text: messageText,
            sender: 'ai',
            timestamp: response.timestamp || new Date(),
            needsApproval: true, // 添加标记，表示需要确认按钮
            approvalData: response, // 保存原始数据，用于确认操作
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
        setIsTyping(false);
      } catch (error) {
        console.error('模拟聊天API调用失败:', error);
        const errorResponse: ChatMessage = {
          id: Date.now() + 1,
          text: '抱歉，AI服务暂时不可用，请稍后再试。',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
        setIsTyping(false);
      }
      return;
    }

    // 使用WebSocket模式 - 移除连接状态限制
    // if (!isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const currentInput = inputValue; // 保存当前输入值
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 通过WebSocket发送消息
    const success = sendSocketMessage(currentInput);

    if (!success) {
      // WebSocket发送失败，显示错误消息
      const errorResponse: ChatMessage = {
        id: Date.now() + 1,
        text: '抱歉，消息发送失败，请检查网络连接后重试。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
      setIsTyping(false);
    }

    // 设置超时，如果10秒内没有收到回复，显示超时消息
    setTimeout(() => {
      setIsTyping(false);
    }, 30000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // // 获取状态显示文本和颜色
  // const getStatusDisplay = () => {
  //   // 模拟模式下显示模拟状态
  //   if (FEATURE_FLAGS.USE_MOCK_CHAT) {
  //     return { text: '模拟模式', color: '#2196f3' };
  //   }

  //   // WebSocket模式下显示连接状态
  //   switch (socketStatus) {
  //     case 'connecting':
  //       return { text: '连接中...', color: '#ffa500' };
  //     case 'connected':
  //       return { text: '已连接', color: '#4caf50' };
  //     case 'disconnected':
  //       return { text: '未连接', color: '#f44336' };
  //     case 'reconnecting':
  //       return { text: '重连中...', color: '#ff9800' };
  //     case 'error':
  //       return { text: '连接错误', color: '#f44336' };
  //     default:
  //       return { text: '未知状态', color: '#9e9e9e' };
  //   }
  // };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 处理确认按钮点击事件
  const handleApproval = (message: ChatMessage) => {
    console.log('🔘 [确认流程] 用户点击确认按钮', {
      messageId: message.id,
      hasApprovalData: !!message.approvalData,
      timestamp: new Date().toISOString()
    });
    
    if (!message.approvalData) {
      console.error('❌ [确认流程] 缺少确认数据', { messageId: message.id });
      return;
    }

    // 发送确认消息
    const socketService = getDefaultWebSocketService();
    if (!socketService || !socketService.isConnected()) {
      console.error('❌ [确认流程] WebSocket未连接，无法发送确认消息', {
        hasService: !!socketService,
        isConnected: socketService?.isConnected(),
        status: socketService?.getStatus()
      });
      return;
    }

    try {
      // 获取当前用户和项目信息
      const user = AuthService.getCurrentUserSync();
      const token = AuthService.getToken();

      if (!user || !token) {
        console.error('❌ [确认流程] 用户未认证，无法发送确认消息', {
          hasUser: !!user,
          hasToken: !!token,
          messageId: message.id
        });
        return;
      }

      // 获取项目ID
      let projectId: string | undefined;
      if (currentProject?.id) {
        projectId = currentProject.id;
      } else if (user.projects && user.projects.length > 0) {
        projectId = user.projects[0];
      }

      if (!projectId) {
        console.error('❌ [确认流程] 无法获取项目ID，无法发送确认消息', {
          currentProject: currentProject?.id,
          userProjects: user.projects?.length || 0,
          messageId: message.id
        });
        return;
      }

      // 构建确认消息
      const approvalMessage = {
      type: 'hitl_decision',
      approved: true
    };

      console.log('📤 [确认流程] 发送确认消息到WebSocket', {
        approvalMessage,
        socketStatus: socketService.getStatus(),
        messageId: message.id,
        projectId
      });
      
      socketService.sendRaw(approvalMessage);

      // 更新消息，标记为已确认但保留按钮
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === message.id) {
            return {
              ...msg,
              approvalData: msg.approvalData ? {
                ...msg.approvalData,
                approved: true,
              } : undefined,
            };
          }
          return msg;
        })
      );
      
      // 标记正在等待确认响应
      console.log('🔄 [确认流程] 设置isAwaitingApprovalResponse为true', {
        messageId: message.id,
        beforeSet: isAwaitingApprovalResponse,
        timestamp: new Date().toISOString()
      });
      
      setIsAwaitingApprovalResponse(true);
      isAwaitingApprovalResponseRef.current = true;
      
      console.log('✅ [确认流程] 确认消息发送成功，等待响应', {
        messageId: message.id,
        afterSet: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [确认流程] 发送确认消息失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messageId: message.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="chat-panel">
      {/* 连接状态指示器 */}
      <div className="chat-header">
        <h3>AI助手</h3>
      </div>

      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className={`message-content ${message.className || ''}`}>
              <div className="message-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // 自定义代码块样式
                    code: ({ className, children, ...props }: React.ComponentProps<'code'>) => {
                      const isInline =
                        !className || !className.includes('language-');
                      return !isInline ? (
                        <pre className="markdown-code-block">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="markdown-inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // 自定义链接样式
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="markdown-link"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // 自定义表格样式
                    table: ({ children, ...props }) => (
                      <div className="markdown-table-wrapper">
                        <table className="markdown-table" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
              {message.needsApproval && (
                <button
                  className={`approval-button ${message.approvalData?.approved ? 'approved' : ''}`}
                  onClick={() => handleApproval(message)}
                  disabled={!!message.approvalData?.approved}
                >
                  {message.approvalData?.approved ? '已确认修改' : '确认修改'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message ai typing">
            <div className="message-content">
              <span className="message-text">AI正在思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <div className="input-container">
          <textarea
            placeholder='输入你的消息...'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            rows={4}
          />
          <button
            onClick={handleSendMessage}
            disabled={isTyping || inputValue.trim() === ''}
            className="send-button"
            title='发送消息'
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

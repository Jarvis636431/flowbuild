import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage, type ApprovalData, chatAPI } from '../services/api';
import { getDefaultWebSocketService } from '../services/nativeWebSocketService';
import type {
  NativeWebSocketService,
  WebSocketStatus,
} from '../services/nativeWebSocketService';
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
  const [, setSocketStatus] = useState<WebSocketStatus>('disconnected');
  const [, setIsConnected] = useState(false);
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
    // 监听确认响应状态变化
  }, [isAwaitingApprovalResponse]);

  // WebSocket连接管理
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: '你好！我是AI助手，有什么可以帮你的吗？',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);

    const logPrefix = `[Chat] [project:${currentProject?.id ?? 'none'}]`;
    console.log(`${logPrefix} effect triggered.`);

    let isUnmounted = false;
    let boundService: NativeWebSocketService | null = null;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;

    const handleStatusChange = (...args: unknown[]) => {
      const status = args[0] as WebSocketStatus;
      console.log(`${logPrefix} statusChange:`, status);
      setSocketStatus(status);
      setIsConnected(status === 'connected');
    };

    const handleMessage = (...args: unknown[]) => {
      console.log(`${logPrefix} handleMessage raw args:`, args);
      const data = args[0] as ApprovalData | undefined;
      console.log(`${logPrefix} parsed data:`, data);

      if (!data || typeof data !== 'object') {
        console.log(`${logPrefix} handleMessage received invalid data, exit.`);
        setIsTyping(false);
        return;
      }

      if (data.type === 'done' && data.text) {
        console.log(`${logPrefix} received done message with text.`);
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: data.text,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);

        if (isAwaitingApprovalResponseRef.current) {
          console.log(`${logPrefix} clearing approval awaiting flag.`);
          setIsAwaitingApprovalResponse(false);
          isAwaitingApprovalResponseRef.current = false;

          if (currentProject?.id) {
            const refreshData = async () => {
              try {
                const file = await projectAPI.downloadProjectExcel(currentProject.id);
                const excelData = await file.arrayBuffer();
                const refreshEvent = new CustomEvent('projectDataRefresh', {
                  detail: { projectId: currentProject.id, excelData },
                });
                window.dispatchEvent(refreshEvent);
              } catch {
                  // 数据刷新失败时静默处理
                }
            };

            refreshData();
          }
        }
      } else if (data.type === 'done' && !data.text) {
        console.log(`${logPrefix} received done message without text.`);
        setIsTyping(false);
      } else if (data.type === 'approval') {
        console.log(`${logPrefix} received approval message.`);
        const messageText = data.ai_message?.text || data.text || '需要确认的操作';
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: messageText,
          sender: 'ai',
          timestamp: new Date(),
          needsApproval: true,
          approvalData: data,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      } else {
        console.log(`${logPrefix} received unhandled message type:`, data?.type, data);
      }
    };

    const attachListeners = (service: NativeWebSocketService) => {
      console.log(`${logPrefix} attaching listeners to socket instance.`);
      boundService = service;
      service.on('statusChange', handleStatusChange);
      service.on('message', handleMessage);

      const currentStatus = service.getStatus();
      setSocketStatus(currentStatus);
      setIsConnected(currentStatus === 'connected');

      setTimeout(() => {
        if (!boundService || boundService !== service) return;
        const latestStatus = service.getStatus();
        if (latestStatus !== currentStatus) {
          setSocketStatus(latestStatus);
          setIsConnected(latestStatus === 'connected');
        }
      }, 200);
    };

    const detachListeners = () => {
      if (!boundService) return;
      console.log(`${logPrefix} detaching listeners from socket instance.`);
      boundService.off('statusChange', handleStatusChange);
      boundService.off('message', handleMessage);
      boundService.off('chat_response', handleMessage);
      boundService = null;
    };

    const tryAttach = () => {
      if (isUnmounted) return false;
      const service = getDefaultWebSocketService();
      if (!service) {
        console.log(`${logPrefix} socket service not ready.`);
        return false;
      }

      if (service === boundService) {
        return true;
      }

      detachListeners();
      attachListeners(service);
      return true;
    };

    pollingTimer = setInterval(() => {
      const service = getDefaultWebSocketService();
      if (!service) {
        console.log(`${logPrefix} polling: socket service still null.`);
        return;
      }

      if (service !== boundService) {
        console.log(`${logPrefix} polling detected socket instance change.`);
        detachListeners();
        attachListeners(service);
        return;
      }

      const currentStatus = service.getStatus();
      setSocketStatus((prev) => {
        if (prev !== currentStatus) {
          console.log(`${logPrefix} polling status update:`, currentStatus);
        }
        return prev !== currentStatus ? currentStatus : prev;
      });
      setIsConnected(service.isConnected());
    }, 200);

    // 初次尝试绑定
    tryAttach();

    return () => {
      isUnmounted = true;
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      detachListeners();
    };
  }, [currentProject?.id]);



  // 通过WebSocket发送消息
  const sendSocketMessage = (userMessage: string): boolean => {
    const socketService = getDefaultWebSocketService();
    if (!socketService || !socketService.isConnected()) {
      
      return false;
    }

    try {
      // 获取当前用户和项目信息
      const user = AuthService.getCurrentUserSync();
      const token = AuthService.getToken();

      if (!user || !token) {
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
      return true;
    } catch {
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
      } catch {
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

    // 使用WebSocket模式

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



  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 处理确认按钮点击事件
  const handleApproval = (message: ChatMessage) => {
    if (!message.approvalData) {
      return;
    }

    // 发送确认消息
    const socketService = getDefaultWebSocketService();
    if (!socketService || !socketService.isConnected()) {
      return;
    }

    try {
      // 获取当前用户和项目信息
      const user = AuthService.getCurrentUserSync();
      const token = AuthService.getToken();

      if (!user || !token) {
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
        return;
      }

      // 构建确认消息
      const approvalMessage = {
        type: 'hitl_decision',
        approved: true
      };

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
      setIsAwaitingApprovalResponse(true);
      isAwaitingApprovalResponseRef.current = true;
    } catch {
        // 发送确认消息失败时静默处理
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

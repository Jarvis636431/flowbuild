import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import { type ChatMessage, type ApprovalData } from '../services/api';
import { getDefaultWebSocketService } from '../services/nativeWebSocketService';
import type { WebSocketStatus } from '../services/nativeWebSocketService';
import { AuthService } from '../services/authService';
import { type Project } from '../services/projectService';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket连接管理
  useEffect(() => {
    console.log('🔍 Chat组件 - useEffect触发，项目ID:', currentProject?.id);

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
      console.log('Chat组件 - 收到WebSocket消息:', data);

      // 处理不同类型的消息
      if (data.type === 'done' && data.text) {
        // 任务完成消息
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: data.text,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      } else if (data.type === 'approval' && data.text) {
        // 需要用户确认的消息
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: `🔔 需要确认: ${data.text}`,
          sender: 'ai',
          timestamp: new Date(),
          needsApproval: true, // 添加标记，表示需要确认按钮
          approvalData: data, // 保存原始数据，用于确认操作
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      } else if (data.type === 'update_done' && data.text) {
        // 更新完成通知
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: `✅ 更新完成: ${data.text}`,
          sender: 'ai',
          timestamp: new Date(),
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

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || !isConnected) return;

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
    }, 10000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 获取连接状态显示文本
  const getStatusText = () => {
    switch (socketStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中';
      case 'reconnecting':
        return '重连中';
      case 'disconnected':
        return '未连接';
      case 'error':
        return '连接错误';
      default:
        return '未知状态';
    }
  };

  // 获取连接状态颜色
  const getStatusColor = () => {
    switch (socketStatus) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
      case 'reconnecting':
        return '#FF9800';
      case 'disconnected':
        return '#9E9E9E';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
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
    if (!message.approvalData) return;
    
    // 发送确认消息
    const socketService = getDefaultWebSocketService();
    if (!socketService || !socketService.isConnected()) {
      console.error('WebSocket未连接，无法发送确认消息');
      return;
    }

    try {
      // 获取当前用户和项目信息
      const user = AuthService.getCurrentUserSync();
      const token = AuthService.getToken();

      if (!user || !token) {
        console.error('用户未认证，无法发送确认消息');
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
        console.error('无法获取项目ID，无法发送确认消息');
        return;
      }

      // 构建确认消息
      const approvalResponse = {
        type: 'approval_response',
        project_id: projectId,
        token: token,
        approval_id: message.approvalData.approval_id || message.id,
        approved: true
      };

      socketService.sendRaw(approvalResponse);
      console.log('Chat组件 - 发送确认消息:', approvalResponse);
      
      // 更新消息，移除确认按钮
      setMessages(prev => prev.map(msg => {
        if (msg.id === message.id) {
          return { ...msg, needsApproval: false, text: msg.text + ' (已确认)' };
        }
        return msg;
      }));
    } catch (error) {
      console.error('发送确认消息失败:', error);
    }
  };

  return (
    <div className="chat-panel">
      {/* 连接状态指示器 */}
      <div className="chat-header">
        <h3>AI助手</h3>
        <div className="connection-status">
          <div
            className="status-indicator"
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <span className="message-text">{message.text}</span>
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
              {message.needsApproval && (
                <button 
                  className="approval-button"
                  onClick={() => handleApproval(message)}
                >
                  确认
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
            placeholder={isConnected ? '输入你的消息...' : '等待连接...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping || !isConnected}
            rows={4}
          />
          <button
            onClick={handleSendMessage}
            disabled={isTyping || inputValue.trim() === '' || !isConnected}
            className="send-button"
            title={isConnected ? '发送消息' : '等待连接'}
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

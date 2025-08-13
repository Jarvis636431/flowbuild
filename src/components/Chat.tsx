import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import { type ChatMessage } from '../services/api';
import { getDefaultSocketService } from '../services/socketService';
import type { SocketStatus } from '../services/socketService';

const Chat: React.FC = () => {
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
    useState<SocketStatus>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket连接管理
  useEffect(() => {
    const socketService = getDefaultSocketService();
    if (!socketService) {
      console.warn('Socket服务未初始化');
      return;
    }

    // 监听连接状态变化
    const handleStatusChange = (...args: unknown[]) => {
      const status = args[0] as SocketStatus;
      setSocketStatus(status);
      setIsConnected(status === 'connected');
      console.log('Chat组件 - Socket状态变化:', status);
    };

    // 监听接收到的消息
    const handleMessage = (...args: unknown[]) => {
      const data = args[0] as {
        type?: string;
        message?: string;
        [key: string]: unknown;
      };
      console.log('Chat组件 - 收到消息:', data);
      if (data.type === 'chat_response' && data.message) {
        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: data.message,
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
    socketService.on('chat_response', handleMessage);

    // 获取当前连接状态
    const currentStatus = socketService.getStatus();
    setSocketStatus(currentStatus);
    setIsConnected(currentStatus === 'connected');

    // 清理函数
    return () => {
      socketService.off('statusChange', handleStatusChange);
      socketService.off('message', handleMessage);
      socketService.off('chat_response', handleMessage);
    };
  }, []);

  // 通过Socket发送消息
  const sendSocketMessage = (userMessage: string): boolean => {
    const socketService = getDefaultSocketService();
    if (!socketService || !socketService.isConnected()) {
      console.error('Socket未连接，无法发送消息');
      return false;
    }

    try {
      const messageData = {
        type: 'chat_message',
        message: userMessage,
        history: messages.slice(-10), // 发送最近10条消息作为上下文
        timestamp: Date.now(),
      };

      socketService.emit('chat_message', messageData);
      console.log('Chat组件 - 发送消息:', messageData);
      return true;
    } catch (error) {
      console.error('发送Socket消息失败:', error);
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

    // 通过Socket发送消息
    const success = sendSocketMessage(currentInput);

    if (!success) {
      // Socket发送失败，显示错误消息
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

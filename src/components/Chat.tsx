import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import {
  chatAPI,
  projectAPI,
  type ChatMessage,
  type ChatRequest,
  type Project,
  type TaskItem,
} from '../services/api';
import { useAsyncState } from '../hooks/useAsyncState';

interface ChatProps {
  currentProject: Project | null;
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
  const { data: projectTasks, execute: fetchProjectTasks } = useAsyncState<
    TaskItem[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取项目任务数据
  useEffect(() => {
    if (currentProject) {
      fetchProjectTasks(async () => {
        const tasks = await projectAPI.getTasksByProjectId(currentProject.id);
        return tasks;
      });
    }
  }, [currentProject, fetchProjectTasks]);

  // 计算项目总成本
  const calculateTotalCost = () => {
    return (projectTasks || []).reduce((total, task) => total + task.cost, 0);
  };

  // 计算项目总工期
  const calculateTotalDays = () => {
    if (!projectTasks || projectTasks.length === 0) return 0;
    const maxEndDay = Math.max(...projectTasks.map((task) => task.endDay));
    const minStartDay = Math.min(...projectTasks.map((task) => task.startDay));
    return maxEndDay - minStartDay + 1;
  };

  // 获取AI回复的异步函数
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const request: ChatRequest = {
        message: userMessage,
        history: messages.slice(-10), // 发送最近10条消息作为上下文
      };

      const response = await chatAPI.sendMessage(request);
      return response.text;
    } catch (error) {
      console.error('获取AI回复失败:', error);
      // 降级到简单的错误回复
      return '抱歉，我现在无法回复您的消息，请稍后再试。';
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

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

    try {
      // 调用API获取AI回复
      const aiResponseText = await getAIResponse(currentInput);

      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('发送消息失败:', error);

      // 显示错误消息
      const errorResponse: ChatMessage = {
        id: Date.now() + 1,
        text: '抱歉，发送消息时出现错误，请稍后再试。',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
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
      {currentProject && (
        <div className="project-header">
          <div className="project-info">
            <div className="project-name">{currentProject.name}</div>
          </div>
          <div className="project-stats">
            <span className="stat-item">
              成本: {(calculateTotalCost() / 10000).toFixed(1)}万
            </span>
            <span className="stat-item">工期: {calculateTotalDays()}天</span>
          </div>
        </div>
      )}
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
            placeholder="输入你的消息..."
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

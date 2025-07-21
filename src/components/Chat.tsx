import React from 'react';
import './Chat.css';

const Chat: React.FC = () => {
  return (
    <div className="chat-panel">
      <h2>对话框</h2>
      <div className="messages">
        {/* 在这里放置对话消息 */}
        <p>用户: 你好</p>
        <p>AI: 你好！有什么可以帮你的吗？</p>
      </div>
      <input type="text" placeholder="输入你的消息..." />
    </div>
  );
};

export default Chat;
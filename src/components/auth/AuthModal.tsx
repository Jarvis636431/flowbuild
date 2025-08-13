import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from '../shared/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './Auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type TabType = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('login');

  if (!isOpen) return null;

  const handleAuthSuccess = () => {
    onAuthSuccess();
    onClose();
  };

  /*
   * 当前认证逻辑说明：
   *
   * 1. App.tsx 认证流程：
   *    - 应用启动时检查本地存储的token
   *    - 如果有token，验证其有效性（调用AuthService.getCurrentUser()）
   *    - 如果无token或验证失败，显示AuthModal
   *    - 认证成功后隐藏AuthModal，允许访问主应用
   *
   * 2. AuthModal 组件功能：
   *    - 提供登录/注册两个tab切换
   *    - 登录成功后调用onAuthSuccess回调
   *    - 未认证时不允许关闭弹窗（通过onClose逻辑控制）
   *
   * 3. AuthService 认证服务：
   *    - 支持模拟API和真实API两种模式（通过FEATURE_FLAGS.USE_REAL_API控制）
   *    - 登录成功后将token和用户信息存储到localStorage
   *    - 提供token验证、用户信息获取等方法
   *
   * 4. 数据流：
   *    AuthModal -> LoginForm/RegisterForm -> AuthService -> localStorage -> App.tsx
   */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="auth-modal"
      showOverlay={true}
    >
      <div className="auth-modal">
        {/* Close Button */}
        <button onClick={onClose} className="auth-close-btn">
          <X size={24} />
        </button>

        {/* Header */}
        <div className="auth-header">
          <h2 className="auth-title">欢迎使用 FlowBuild</h2>

          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button
              onClick={() => setActiveTab('login')}
              className={`auth-tab ${activeTab === 'login' ? 'active' : 'inactive'}`}
            >
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`auth-tab ${activeTab === 'register' ? 'active' : 'inactive'}`}
            >
              注册
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="auth-content">
          {activeTab === 'login' ? (
            <LoginForm onSuccess={handleAuthSuccess} />
          ) : (
            <RegisterForm onSuccess={handleAuthSuccess} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;

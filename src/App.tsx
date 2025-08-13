import { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import Output from './components/Output';
import Sidebar from './components/Sidebar';
import AuthModal from './components/auth/AuthModal';
import { type Project, projectAPI } from './services/projectService';
import { AuthService } from './services/authService';

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 检查用户认证状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = AuthService.getToken();
        if (token) {
          // 验证token是否有效
          await AuthService.getCurrentUser();
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 初始化时加载第一个项目（仅在已认证时）
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const initializeApp = async () => {
      try {
        const projects = await projectAPI.getProjects();
        if (projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      } catch (error) {
        console.error('初始化应用失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [isAuthenticated, authLoading]);

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleAuthModalClose = () => {
    // 如果用户未认证，不允许关闭弹窗
    if (isAuthenticated) {
      setShowAuthModal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">正在验证身份...</div>
      </div>
    );
  }

  if (loading && isAuthenticated) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          currentProject={currentProject}
          onProjectSelect={handleProjectSelect}
        />
        <div className="main-content">
          <Chat currentProject={currentProject} />
          <Output currentProject={currentProject} />
        </div>
      </div>

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default App;

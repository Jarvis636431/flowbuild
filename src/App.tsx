import { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import Output from './components/Output';
import Sidebar from './components/Sidebar';
import AuthModal from './components/auth/AuthModal';
import { type Project, projectAPI } from './services/projectService';
import { AuthService } from './services/authService';
import {
  initDefaultSocketService,
  getDefaultSocketService,
} from './services/socketService';
import { FEATURE_FLAGS, ENV_CONFIG } from './config/features';

// 调试环境变量
console.log('🔍 环境变量调试信息:');
console.log('VITE_ENABLE_SOCKET:', import.meta.env.VITE_ENABLE_SOCKET);
console.log(
  'VITE_ENABLE_SOCKET类型:',
  typeof import.meta.env.VITE_ENABLE_SOCKET
);
console.log('FEATURE_FLAGS.ENABLE_SOCKET:', FEATURE_FLAGS.ENABLE_SOCKET);
console.log('完整环境变量:', import.meta.env);
console.log('完整FEATURE_FLAGS:', FEATURE_FLAGS);
console.log('完整ENV_CONFIG:', ENV_CONFIG);

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [viewMode, setViewMode] = useState<'upload' | 'output'>('upload');

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

  // 初始化Socket服务
  useEffect(() => {
    console.log('🔧 Socket useEffect被触发:', {
      enableSocket: FEATURE_FLAGS.ENABLE_SOCKET,
      currentProjectId: currentProject?.id,
      isAuthenticated: isAuthenticated,
    });

    if (!FEATURE_FLAGS.ENABLE_SOCKET) {
      console.log('❌ Socket功能未启用，跳过初始化');
      return;
    }

    const initSocket = async () => {
      try {
        // 获取用户认证信息
        const user = AuthService.getCurrentUserSync();
        const token = AuthService.getToken();

        // 只有在用户已认证且有选中项目时才建立Socket连接
        console.log('🔍 Socket连接条件检查:', {
          hasUser: !!user,
          hasToken: !!token,
          hasProject: !!currentProject?.id,
          currentProject: currentProject,
          projectId: currentProject?.id,
          projectIdType: typeof currentProject?.id,
          isAuthenticated: isAuthenticated,
        });

        if (!user || !token || !currentProject?.id) {
          console.log('❌ Socket连接条件不满足，跳过连接');
          return;
        }

        console.log('✅ Socket连接条件满足，开始建立连接...');

        // 构建Socket URL，包含项目ID和JWT令牌
        const baseUrl =
          ENV_CONFIG.SOCKET_URL || 'ws://101.43.150.234:8003/ws/agent';
        const projectId = currentProject.id;
        const socketUrl = `${baseUrl}?project_id=${projectId}&token=${token}`;

        // 初始化Socket服务
        const socketService = initDefaultSocketService({
          url: socketUrl,
          options: {
            autoConnect: false,
            auth: {
              token,
              userId: user.user_id,
              username: user.username,
            },
            query: {
              project_id: projectId,
              version: '1.0.0',
            },
          },
        });

        // 监听连接状态变化
        socketService.on('statusChange', (status) => {
          console.log(`Socket状态变化 [项目${projectId}]:`, status);
        });

        // 监听连接错误
        socketService.on('error', (error) => {
          console.error(`Socket连接错误 [项目${projectId}]:`, error);
        });

        // 建立Socket连接
        console.log('🚀 开始建立Socket连接:', {
          socketUrl: socketUrl,
          projectId: projectId,
          projectName: currentProject.name,
        });

        await socketService.connect();
        console.log(
          `🎉 Socket已连接到项目: ${currentProject.name} (ID: ${projectId})`
        );
      } catch (error) {
        console.error('Socket初始化失败:', error);
      }
    };

    initSocket();

    // 清理函数
    return () => {
      const socketService = getDefaultSocketService();
      if (socketService) {
        socketService.destroy();
      }
    };
  }, [currentProject?.id, currentProject?.name, isAuthenticated]);

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

  // 监听认证状态变化，管理Socket连接
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_SOCKET) return;

    const socketService = getDefaultSocketService();
    if (!socketService) return;

    const handleAuthChange = async () => {
      if (!isAuthenticated) {
        // 用户登出时断开Socket连接
        socketService.disconnect();
        console.log('用户登出，Socket连接已断开');
      }
      // 用户登录时的Socket连接由Socket初始化useEffect处理
    };

    handleAuthChange();
  }, [isAuthenticated]);

  const handleProjectSelect = async (project: Project) => {
    console.log('🔄 项目选择开始:', {
      projectName: project.name,
      projectId: project.id,
      projectIdType: typeof project.id,
      fullProject: project,
    });
    setCurrentProject(project);
    console.log(`✅ 项目已切换到: ${project.name} (ID: ${project.id})`);

    // 强制触发Socket连接检查
    console.log('🔄 强制触发Socket连接检查...');
    setTimeout(() => {
      console.log('⏰ 延迟检查Socket连接状态:', {
        currentProjectAfterTimeout: project.id,
        isAuthenticated: isAuthenticated,
      });
    }, 100);
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

  const handleNewProject = () => {
    setViewMode('upload');
  };

  const handleProjectCreated = async () => {
    // 项目创建成功后的回调
    try {
      // 刷新项目列表
      const projects = await projectAPI.getProjects();
      if (projects.length > 0) {
        // 选择最新创建的项目（通常是列表中的最后一个）
        const latestProject = projects[projects.length - 1];
        setCurrentProject(latestProject);
      }
      // 切换到输出模式
      setViewMode('output');
    } catch (error) {
      console.error('刷新项目列表失败:', error);
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
          onNewProject={handleNewProject}
        />
        <div className="main-content">
          <Chat />
          <Output
            currentProject={currentProject}
            viewMode={viewMode}
            onProjectCreated={handleProjectCreated}
          />
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

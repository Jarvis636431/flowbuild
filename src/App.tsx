import { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import Output from './components/Output';
import Sidebar from './components/Sidebar';
import AuthModal from './components/auth/AuthModal';
import { type Project, projectAPI } from './services/projectService';
import { AuthService } from './services/authService';
import { ManagementServiceUrls } from './services/apiConfig';
import {
  initDefaultWebSocketService,
  getDefaultWebSocketService,
} from './services/nativeWebSocketService';
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

  // 监听项目变化和认证状态，管理Socket连接
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_SOCKET) return;

    console.log('🔍 useEffect触发 - Socket连接管理:', {
      currentProjectId: currentProject?.id,
      currentProjectName: currentProject?.name,
      isAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });

    const initSocket = async () => {
      try {
        const token = AuthService.getToken();
        if (!isAuthenticated || !currentProject || !token) {
          console.log('❌ Socket连接条件不满足:', {
            isAuthenticated,
            hasCurrentProject: !!currentProject,
            hasToken: !!token,
          });
          // 如果条件不满足，确保断开现有连接
          const existingService = getDefaultWebSocketService();
          if (existingService) {
            console.log('🔌 断开现有WebSocket连接');
            existingService.destroy();
          }
          return;
        }

        console.log('✅ Socket连接条件满足，开始建立连接...', {
          projectId: currentProject.id,
          projectName: currentProject.name,
          token: token ? '已获取' : '未获取',
        });

        // 先断开现有连接
        const existingService = getDefaultWebSocketService();
        if (existingService) {
          console.log('🔌 断开现有WebSocket连接以建立新连接');
          existingService.destroy();
          // 等待一小段时间确保连接完全断开
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 构建WebSocket URL，包含认证参数
        const projectId = currentProject.id;
        const wsUrl = `ws://101.43.150.234:8003/ws/agent?project_id=${projectId}&token=${token}`;

        // 初始化原生WebSocket服务
        const socketService = initDefaultWebSocketService({
          url: wsUrl,
          reconnectAttempts: 5,
          reconnectDelay: 1000,
          heartbeatInterval: 30000,
          connectionTimeout: 10000,
        });

        // 监听连接状态变化
        socketService.on('statusChange', (status) => {
          console.log(`Socket状态变化 [项目${projectId}]:`, status);
        });

        // 监听连接错误
        socketService.on('error', (error) => {
          console.error(`Socket连接错误 [项目${projectId}]:`, error);
        });

        // 建立WebSocket连接
        console.log('🚀 开始建立WebSocket连接:', {
          wsUrl: wsUrl,
          projectId: projectId,
          projectName: currentProject.name,
        });

        await socketService.connect();
        console.log(
          `🎉 WebSocket已连接到项目: ${currentProject.name} (ID: ${projectId})`
        );
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    };

    initSocket();

    // 清理函数 - 只在组件卸载时执行
    return () => {
      console.log('🧹 useEffect清理函数执行 - 项目切换或组件卸载');
      const socketService = getDefaultWebSocketService();
      if (socketService) {
        console.log('🔌 清理函数中断开WebSocket连接');
        socketService.destroy();
      }
    };
  }, [currentProject?.id, isAuthenticated]);

  // 初始化时加载第一个项目（仅在已认证时）
  useEffect(() => {
    if (!isAuthenticated || authLoading || currentProject) return;

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
  }, [isAuthenticated, authLoading, currentProject]);

  // 监听认证状态变化，管理Socket连接
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_SOCKET) return;

    const socketService = getDefaultWebSocketService();
    if (!socketService) return;

    const handleAuthChange = async () => {
      if (!isAuthenticated) {
        // 用户登出时断开Socket连接
        socketService.disconnect();
        console.log('用户登出，WebSocket连接已断开');
      }
      // 用户登录时的Socket连接由Socket初始化useEffect处理
    };

    handleAuthChange();
  }, [isAuthenticated]);

  const handleProjectSelect = async (project: Project) => {
    const previousProject = currentProject;
    console.log('🔄 项目选择开始:', {
      previousProject: {
        id: previousProject?.id,
        name: previousProject?.name,
      },
      newProject: {
        id: project.id,
        name: project.name,
        idType: typeof project.id,
      },
      isAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });

    try {
      // 调用/view接口
      console.log('📡 调用/view接口，项目ID:', project.id);
      const response = await fetch(
        `${ManagementServiceUrls.view()}?project_id=${project.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AuthService.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `API调用失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('✅ /view接口调用成功:', data);

      // 更新项目状态
      setCurrentProject(project);

      // 切换到输出模式
      setViewMode('output');
      console.log('🎯 已切换到输出模式');

      console.log('✅ 项目状态已更新:', {
        from: previousProject?.id,
        to: project.id,
        projectName: project.name,
        shouldTriggerReconnect: previousProject?.id !== project.id,
        viewMode: 'output',
      });
    } catch (error) {
      console.error('❌ 项目切换失败:', error);
      // 即使API调用失败，仍然更新项目状态
      setCurrentProject(project);
    }

    // 强制触发Socket连接检查
    console.log('🔄 等待useEffect响应项目变化...');
    setTimeout(() => {
      console.log('⏰ 延迟检查 - 项目切换后状态:', {
        currentProjectId: project.id,
        isAuthenticated: isAuthenticated,
        expectedReconnection: true,
      });
    }, 200);
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
    return <div className="app-container loading"></div>;
  }

  if (loading && isAuthenticated) {
    return <div className="app-container loading"></div>;
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
          <Chat currentProject={currentProject} />
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

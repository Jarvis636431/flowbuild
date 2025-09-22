import { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import Output from './components/Output';
import Sidebar from './components/Sidebar';
import AuthModal from './components/auth/AuthModal';
import { type Project, projectAPI } from './services/projectService';
import { AuthService } from './services/authService';
import {
  initDefaultWebSocketService,
  getDefaultWebSocketService,
} from './services/nativeWebSocketService';
import { FEATURE_FLAGS } from './config/features';



function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [viewMode, setViewMode] = useState<'upload' | 'output'>('upload');
  const [viewData, setViewData] = useState<ArrayBuffer | null>(null);

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
      } catch {
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 断开WebSocket连接
      const socketService = getDefaultWebSocketService();
      if (socketService) {
        socketService.disconnect();
      }

      // 清除认证状态
      setIsAuthenticated(false);
      setCurrentProject(null);
      setShowAuthModal(true);


    } catch {
      // 忽略退出登录错误
    }
  };

  // 监听项目变化和认证状态，管理Socket连接
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_SOCKET) return;



    const initSocket = async () => {
      try {
        const token = AuthService.getToken();
        if (!isAuthenticated || !currentProject || !token) {
          // 如果条件不满足，确保断开现有连接
          const existingService = getDefaultWebSocketService();
          if (existingService) {
            existingService.destroy();
          }
          return;
        }



        // 先断开现有连接
        const existingService = getDefaultWebSocketService();
        if (existingService) {
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
          heartbeatInterval: 10000,
          connectionTimeout: 100000,
        });

        // 监听连接状态变化
        socketService.on('statusChange', () => {
          // Socket状态变化处理
        });

        // 监听连接错误
        socketService.on('error', () => {
          // Socket连接错误处理
        });

        // 建立WebSocket连接
        await socketService.connect();
      } catch {
        // WebSocket初始化失败
      }
    };

    initSocket();

    // 清理函数 - 只在组件卸载时执行
    return () => {
      const socketService = getDefaultWebSocketService();
      if (socketService) {
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
      } catch {
        // 初始化应用失败
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
      }
      // 用户登录时的Socket连接由Socket初始化useEffect处理
    };

    handleAuthChange();
  }, [isAuthenticated]);

  // 监听项目数据刷新事件
  useEffect(() => {
    const handleProjectDataRefresh = (event: CustomEvent) => {
      const { projectId, excelData } = event.detail;
      
      // 如果刷新的是当前项目，更新viewData
      if (currentProject?.id === projectId) {
        setViewData(excelData);
      }
    };
    
    window.addEventListener('projectDataRefresh', handleProjectDataRefresh as EventListener);
    
    return () => {
      window.removeEventListener('projectDataRefresh', handleProjectDataRefresh as EventListener);
    };
  }, [currentProject?.id, viewData]);

  const handleProjectSelect = async (project: Project) => {

    try {
      // 使用封装好的方法调用/view接口
      const file = await projectAPI.downloadProjectExcel(project.id);

      // 获取返回的Excel数据
      const excelData = await file.arrayBuffer();

      // 检查Excel数据
      const dataSize = excelData.byteLength;
      const isValidSize = dataSize > 0;

      if (!isValidSize) {
        throw new Error('接收到的Excel数据为空');
      }

      setViewData(excelData);

      // 更新项目状态
      setCurrentProject(project);

      // 切换到输出模式
      setViewMode('output');
    } catch {
      // 即使API调用失败，仍然更新项目状态并切换到输出模式
      setCurrentProject(project);
      setViewMode('output');
      setViewData(null); // 清除之前的Excel数据
    }
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
    setCurrentProject(null);
    setViewData(null);
  };

  const handleProjectCreated = async () => {
    // 项目创建成功后的回调
    try {
      // 添加短暂延迟，确保ProjectService数据完全更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 刷新项目列表
      const projects = await projectAPI.getProjects();
      if (projects.length > 0) {
        // 选择最新创建的项目（通常是列表中的最后一个）
        const latestProject = projects[projects.length - 1];
        setCurrentProject(latestProject);

        // 检查是否有最新的Excel数据
        const latestProjectData = window.latestProjectData;
        if (latestProjectData && latestProjectData.tasks) {
          // 再次确保数据同步，添加额外的延迟
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // 将Excel数据转换为ArrayBuffer格式，以便传递给Output组件
          // 这里我们创建一个标记，让useTaskManagement知道要从ProjectService获取数据
          setViewData(new ArrayBuffer(0)); // 设置一个空的ArrayBuffer作为标记
          
          // 数据成功获取后执行页面刷新
          setTimeout(() => {
            window.location.reload();
          }, 1000); // 延迟1秒刷新，确保数据完全加载
        } else {
          setViewData(null);
        }
      }
      // 切换到输出模式
      setViewMode('output');
    } catch {
      // 刷新项目列表失败
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
          viewMode={viewMode}
          onLogout={handleLogout}
        />
        <div className="main-content">
          <Chat currentProject={currentProject} />
          <Output
            currentProject={currentProject}
            viewMode={viewMode}
            viewData={viewData}
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

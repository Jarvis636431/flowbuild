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

      console.log('用户已成功退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

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
          heartbeatInterval: 10000,
          connectionTimeout: 100000,
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

  // 监听项目数据刷新事件
  useEffect(() => {
    const handleProjectDataRefresh = (event: CustomEvent) => {
      console.log('📡 [App.tsx] 收到项目数据刷新事件', {
        eventDetail: event.detail,
        currentProjectId: currentProject?.id,
        timestamp: new Date().toISOString()
      });
      
      const { projectId, excelData } = event.detail;
      console.log('📡 收到项目数据刷新事件:', { projectId, dataSize: excelData?.byteLength });
      
      // 如果刷新的是当前项目，更新viewData
      if (currentProject?.id === projectId) {
        console.log('✅ [App.tsx] 项目ID匹配，更新viewData', {
          projectId,
          currentProjectId: currentProject?.id,
          previousViewDataExists: !!viewData,
          newDataSize: excelData?.byteLength
        });
        setViewData(excelData);
        console.log('✅ 当前项目数据已刷新');
      } else {
        console.log('⚠️ [App.tsx] 项目ID不匹配，忽略刷新事件', {
          eventProjectId: projectId,
          currentProjectId: currentProject?.id
        });
      }
    };

    console.log('🔧 [App.tsx] 注册项目数据刷新事件监听器', {
      currentProjectId: currentProject?.id
    });
    
    window.addEventListener('projectDataRefresh', handleProjectDataRefresh as EventListener);
    
    return () => {
      console.log('🗑️ [App.tsx] 移除项目数据刷新事件监听器', {
        currentProjectId: currentProject?.id
      });
      window.removeEventListener('projectDataRefresh', handleProjectDataRefresh as EventListener);
    };
  }, [currentProject?.id, viewData]);

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
      console.log('📡 /view接口调用开始:', {
        projectId: project.id,
        method: '使用projectAPI.downloadProjectExcel',
      });

      // 使用封装好的方法调用/view接口
      const startTime = Date.now();
      const file = await projectAPI.downloadProjectExcel(project.id);
      const responseTime = Date.now() - startTime;

      console.log('📥 /view接口响应详情:', {
        responseTime: `${responseTime}ms`,
        fileName: file.name,
        fileSize: `${file.size} bytes (${(file.size / 1024).toFixed(2)} KB)`,
        fileType: file.type,
      });

      // 获取返回的Excel数据
      const excelData = await file.arrayBuffer();

      // 详细检查Excel数据
      const dataSize = excelData.byteLength;
      const isValidSize = dataSize > 0;
      const first4Bytes = new Uint8Array(excelData.slice(0, 4));
      const first4BytesHex = Array.from(first4Bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');

      // 检查是否为Excel文件格式
      const isExcelFormat =
        // XLSX格式 (ZIP文件头)
        (first4Bytes[0] === 0x50 && first4Bytes[1] === 0x4b) ||
        // XLS格式 (OLE文件头)
        (first4Bytes[0] === 0xd0 &&
          first4Bytes[1] === 0xcf &&
          first4Bytes[2] === 0x11 &&
          first4Bytes[3] === 0xe0);

      console.log('📊 Excel数据详细分析:', {
        dataSize: `${dataSize} bytes (${(dataSize / 1024).toFixed(2)} KB)`,
        isValidSize,
        first4BytesHex,
        isExcelFormat,
        possibleFormat: isExcelFormat
          ? first4Bytes[0] === 0x50
            ? 'XLSX (ZIP-based)'
            : 'XLS (OLE-based)'
          : '未知格式',
        dataType: Object.prototype.toString.call(excelData),
      });

      if (!isValidSize) {
        throw new Error('接收到的Excel数据为空');
      }

      if (!isExcelFormat) {
        console.warn('⚠️ 警告: 接收到的数据可能不是有效的Excel格式');
        // 尝试将前100字节转换为文本查看内容
        const preview = new TextDecoder('utf-8', { fatal: false }).decode(
          excelData.slice(0, 100)
        );
        console.log('📄 数据预览 (前100字节):', preview);
      }

      setViewData(excelData);
      console.log('✅ /view接口调用成功，Excel数据已保存到状态');

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
        excelDataReady: !!excelData && dataSize > 0,
      });
    } catch (error) {
      console.error('❌ 项目切换失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: project.id,
        projectName: project.name,
        apiUrl: ManagementServiceUrls.view(),
      });
      // 即使API调用失败，仍然更新项目状态并切换到输出模式
      setCurrentProject(project);
      setViewMode('output');
      setViewData(null); // 清除之前的Excel数据
      console.log('⚠️ API调用失败，但已切换到输出模式，将使用默认数据');
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
    console.log('🆕 新建项目开始 - 清除当前项目状态');
    setViewMode('upload');
    setCurrentProject(null);
    setViewData(null);
    console.log('✅ 新建项目状态已清除，可以切换到其他项目');
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
          console.log(
            '🎯 检测到最新的Excel数据，项目任务数量:',
            latestProjectData.tasks.length
          );

          // 再次确保数据同步，添加额外的延迟
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // 将Excel数据转换为ArrayBuffer格式，以便传递给Output组件
          // 这里我们创建一个标记，让useTaskManagement知道要从ProjectService获取数据
          setViewData(new ArrayBuffer(0)); // 设置一个空的ArrayBuffer作为标记

          console.log('✅ Excel数据已准备就绪，将传递给图表组件');
          
          // 数据成功获取后执行页面刷新
          console.log('🔄 数据获取成功，即将刷新页面...');
          setTimeout(() => {
            window.location.reload();
          }, 1000); // 延迟1秒刷新，确保数据完全加载
        } else {
          console.log('⚠️ 未检测到Excel数据，使用默认数据源');
          setViewData(null);
        }
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

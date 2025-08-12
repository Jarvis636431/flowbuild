import { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import Output from './components/Output';
import Sidebar from './components/Sidebar';
import { type Project, projectAPI } from './services/api';

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化时加载第一个项目
  useEffect(() => {
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
  }, []);

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
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
  );
}

export default App;

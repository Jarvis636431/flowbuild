import React, { useEffect, useCallback } from 'react';
import { type Project, projectAPI } from '../services/projectService';
import { useAsyncState } from '../hooks/useAsyncState';
import { AuthService } from '../services/authService';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentProject,
  onProjectSelect,
}) => {
  const {
    data: projects,
    loading,
    error,
    execute,
    setError,
  } = useAsyncState<Project[]>([]);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    await execute(async () => {
      const projectList = await projectAPI.getProjects();

      // 如果没有当前项目且有项目列表，选择第一个项目
      if (!currentProject && projectList.length > 0) {
        onProjectSelect(projectList[0]);
      }

      return projectList;
    });
  }, [currentProject, onProjectSelect, execute]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (
    projectId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (!confirm('确定要删除这个项目吗？这将同时删除项目下的所有任务。')) {
      return;
    }

    await execute(async () => {
      await projectAPI.deleteProject(projectId);
      const updatedProjects = (projects || []).filter(
        (p) => p.id !== projectId
      );

      // 如果删除的是当前项目，选择第一个可用项目
      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          onProjectSelect(updatedProjects[0]);
        }
      }

      return updatedProjects;
    });
  };

  // 获取项目图标（首字母）
  const getProjectIcon = (projectName: string) => {
    return projectName.charAt(0).toUpperCase();
  };

  // 获取用户图标（首字母）
  const getUserIcon = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // 获取当前用户信息
  const currentUser = AuthService.getCurrentUserSync();

  if (loading) {
    return (
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {isCollapsed ? (
            <button className="toggle-btn" onClick={onToggle}>
              ▶
            </button>
          ) : (
            <>
              <span className="header-title">项目列表</span>
              <button className="toggle-btn" onClick={onToggle}>
                ◀
              </button>
            </>
          )}
        </div>
        {!isCollapsed && (
          <div className="sidebar-content">
            <div className="loading">加载中...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {isCollapsed ? (
          <button className="toggle-btn" onClick={onToggle}>
            ▶
          </button>
        ) : (
          <>
            <span className="header-title">项目列表</span>
            <button className="toggle-btn" onClick={onToggle}>
              ◀
            </button>
          </>
        )}
      </div>

      <div className="sidebar-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="projects-list">
          {(projects || []).map((project) => (
            <div
              key={project.id}
              className={`project-item ${
                currentProject?.id === project.id ? 'active' : ''
              }`}
              onClick={() => onProjectSelect(project)}
              title={project.name}
            >
              {isCollapsed ? (
                <div className="project-icon">
                  {getProjectIcon(project.name)}
                </div>
              ) : (
                <div className="project-content">
                  <span className="project-name">{project.name}</span>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    title="删除项目"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}

          {(projects || []).length === 0 && (
            <div className="empty-state">
              <p>暂无项目</p>
            </div>
          )}
        </div>
      </div>

      {/* 用户信息区域 - 固定在底部 */}
      {currentUser && (
        <div className="user-info">
          {isCollapsed ? (
            <div
              className="user-icon"
              title={`${currentUser.username} (${currentUser.role})`}
            >
              {getUserIcon(currentUser.username)}
            </div>
          ) : (
            <div className="user-content">
              <div className="user-details">
                <span className="user-name">{currentUser.username}</span>
                <span className="user-role">{currentUser.role}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

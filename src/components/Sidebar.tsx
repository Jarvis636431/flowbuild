import React, { useState, useEffect, useCallback } from "react";
import { type Project, projectAPI } from "../services/api";
import "./Sidebar.css";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const projectList = await projectAPI.getProjects();
      setProjects(projectList);

      // 如果没有当前项目且有项目列表，选择第一个项目
      if (!currentProject && projectList.length > 0) {
        onProjectSelect(projectList[0]);
      }
    } catch (err) {
      setError("加载项目列表失败");
      console.error("加载项目失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (
    projectId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (!confirm("确定要删除这个项目吗？这将同时删除项目下的所有任务。")) {
      return;
    }

    try {
      await projectAPI.deleteProject(projectId);
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      // 如果删除的是当前项目，选择第一个可用项目
      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          onProjectSelect(updatedProjects[0]);
        } else {
          // 没有项目时不选择任何项目
        }
      }
    } catch (err) {
      setError("删除项目失败");
      console.error("删除项目失败:", err);
    }
  };

  // 获取项目图标（首字母）
  const getProjectIcon = (projectName: string) => {
    return projectName.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
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
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
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
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${
                currentProject?.id === project.id ? "active" : ""
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

          {projects.length === 0 && (
            <div className="empty-state">
              <p>暂无项目</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

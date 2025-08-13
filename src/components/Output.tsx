import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type Project } from '../services/projectService';
import TaskDetailModal from './modals/TaskDetailModal';
import GanttChart from './charts/GanttChart';
import ProgressTable from './charts/ProgressTable';
import MaterialCharts from './charts/MaterialCharts';

import IfcModel from './charts/IfcModel';
import FileUploadSection from './shared/FileUploadSection';

import { useTaskManagement } from '../hooks/useTaskManagement';
import { useFileUpload } from '../hooks/useFileUpload';
import { useChartData } from '../hooks/useChartData';
import './Output.css';

interface OutputProps {
  currentProject: Project | null;
  viewMode: 'upload' | 'output';
  onProjectCreated: () => void;
}

const Output: React.FC<OutputProps> = React.memo(
  ({ currentProject, viewMode, onProjectCreated }) => {
    const [activeTab, setActiveTab] = useState('甘特图模式');

    // 使用自定义Hooks
    const taskManagement = useTaskManagement(currentProject);
    const fileUpload = useFileUpload(onProjectCreated);
    const chartData = useChartData(taskManagement.tasks);

    // 缓存计算结果
    const memoizedTabButtons = useMemo(() => {
      return [
        '项目信息',
        '甘特图模式',
        '进度表模式',
        '数据统计',
        'Ifc模型',
      ].map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ));
    }, [activeTab]);

    // 缓存事件处理函数

    const handleProjectNameChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        fileUpload.setProjectName(event.target.value);
      },
      [fileUpload]
    );

    // 初始化数据
    useEffect(() => {
      if (viewMode === 'output') {
        taskManagement.fetchTasks();
      }
    }, [viewMode, taskManagement.fetchTasks]); // eslint-disable-line react-hooks/exhaustive-deps

    // 渲染内容
    const renderContent = useMemo(() => {
      if (taskManagement.loading) {
        return (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>正在加载数据...</p>
          </div>
        );
      }

      if (taskManagement.error) {
        return (
          <div className="error-container">
            <p className="error-message">❌ {taskManagement.error}</p>
            <button
              className="retry-button"
              onClick={taskManagement.fetchTasks}
            >
              重新加载
            </button>
          </div>
        );
      }

      switch (activeTab) {
        case '项目信息':
          return (
            <div>
              <div className="project-info">
                <div className="project-title">
                  {currentProject?.name || '未选择项目'}
                </div>
                <div className="project-date">总计{chartData.totalDays}天</div>
              </div>
            </div>
          );
        case '甘特图模式':
          return (
            <GanttChart
              tasks={taskManagement.tasks}
              onTaskClick={taskManagement.handleTaskClick}
            />
          );
        case '进度表模式':
          return (
            <ProgressTable
              tasks={taskManagement.tasks}
              onTaskClick={taskManagement.handleTaskClick}
            />
          );
        case '资金物料模式':
          return <MaterialCharts tasks={taskManagement.tasks} />;

        case 'Ifc模型':
          return <IfcModel />;
        default:
          return null;
      }
    }, [
      activeTab,
      taskManagement.tasks,
      taskManagement.loading,
      taskManagement.error,
      taskManagement.handleTaskClick,
      taskManagement.fetchTasks,
      chartData.totalDays,
      currentProject?.name,
    ]);

    // 上传模式的渲染
    if (viewMode === 'upload') {
      return (
        <div className="output-panel">
          <FileUploadSection
            documentFile={fileUpload.documentFile}
            cadFile={fileUpload.cadFile}
            projectName={fileUpload.projectName}
            isCreatingProject={fileUpload.isCreatingProject}
            isPrecreating={fileUpload.isPrecreating}
            isUploading={fileUpload.isUploading}
            uploadProgress={fileUpload.uploadProgress}
            validationErrors={fileUpload.validationErrors}
            projectId={fileUpload.projectId}
            onDocumentUpload={fileUpload.handleDocumentUpload}
            onCadUpload={fileUpload.handleCadUpload}
            onDocumentDrop={fileUpload.handleDocumentDrop}
            onCadDrop={fileUpload.handleCadDrop}
            onDragOver={fileUpload.handleDragOver}
            onProjectNameChange={handleProjectNameChange}
            onPrecreateProject={fileUpload.handlePrecreateProject}
            onUploadFiles={fileUpload.handleUploadFiles}
            onCreateProject={fileUpload.handleCreateProject}
          />
        </div>
      );
    }

    return (
      <div className="output-panel output-mode">
        <div className="output-header">
          <div className="project-info">
            <div className="project-title">
              {currentProject?.name || '未选择项目'}
            </div>
            <div className="project-date">总计{chartData.totalDays}天</div>
          </div>
          <div className="header-controls">
            <button className="export-btn">导出报告</button>
          </div>
        </div>

        <div className="date-controls">
          <div className="view-tabs">{memoizedTabButtons}</div>
        </div>

        {renderContent}

        {/* 任务详情弹窗 */}
        <TaskDetailModal
          isOpen={!!taskManagement.selectedTask}
          onClose={taskManagement.closePopup}
          task={taskManagement.selectedTask}
        />
      </div>
    );
  }
);

Output.displayName = 'Output';

export default Output;

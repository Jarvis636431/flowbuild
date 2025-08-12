import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type Project } from '../services/api';
import TaskDetailModal from './shared/TaskDetailModal';
import GanttChart from './shared/GanttChart';
import ProgressTable from './shared/ProgressTable';
import MaterialCharts from './shared/MaterialCharts';
import OperationLog from './shared/OperationLog';
import FileUploadSection from './shared/FileUploadSection';
import IfcModel from './shared/IfcModel';

import { useTaskManagement } from '../hooks/useTaskManagement';
import { useFileUpload } from '../hooks/useFileUpload';
import { useChartData } from '../hooks/useChartData';
import './Output.css';

interface OutputProps {
  currentProject: Project | null;
}

const Output: React.FC<OutputProps> = React.memo(({ currentProject }) => {
  const [viewMode, setViewMode] = useState<'upload' | 'output'>('upload');
  const [activeTab, setActiveTab] = useState('甘特图模式');

  // 使用自定义Hooks
  const taskManagement = useTaskManagement(currentProject);
  const fileUpload = useFileUpload(() => {
    setViewMode('output');
  });
  const chartData = useChartData(taskManagement.tasks);

  // 缓存计算结果
  const memoizedTabButtons = useMemo(() => {
    return [
      '甘特图模式',
      '进度表模式',
      '资金物料模式',
      '操作记录',
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
  const handleToggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'upload' ? 'output' : 'upload');
  }, [viewMode]);

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
          <button className="retry-button" onClick={taskManagement.fetchTasks}>
            重新加载
          </button>
        </div>
      );
    }

    switch (activeTab) {
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
      case '操作记录':
        return <OperationLog />;
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
  ]);

  // 上传模式的渲染
  if (viewMode === 'upload') {
    return (
      <div className="output-panel">
        <div className="top-header">
          <button
            className="toggle-view-btn top-right"
            onClick={handleToggleViewMode}
          >
            切换到输出模式
          </button>
        </div>

        <FileUploadSection
          documentFile={fileUpload.documentFile}
          cadFile={fileUpload.cadFile}
          projectName={fileUpload.projectName}
          isCreatingProject={fileUpload.isCreatingProject}
          onDocumentUpload={fileUpload.handleDocumentUpload}
          onCadUpload={fileUpload.handleCadUpload}
          onDocumentDrop={fileUpload.handleDocumentDrop}
          onCadDrop={fileUpload.handleCadDrop}
          onDragOver={fileUpload.handleDragOver}
          onProjectNameChange={handleProjectNameChange}
          onCreateProject={fileUpload.handleCreateProject}
        />
      </div>
    );
  }

  return (
    <div className="output-panel output-mode">
      <div className="top-header">
        <button
          className="toggle-view-btn top-right"
          onClick={handleToggleViewMode}
        >
          返回上传模式
        </button>
      </div>
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
        position={taskManagement.popupPosition}
      />
    </div>
  );
});

Output.displayName = 'Output';

export default Output;

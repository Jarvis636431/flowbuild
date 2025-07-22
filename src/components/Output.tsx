import React, { useState } from 'react';
import './Output.css';

interface TaskItem {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
}

const Output: React.FC = () => {
  const [viewMode, setViewMode] = useState<'upload' | 'output'>('upload');
  const [startDate, setStartDate] = useState('2025-07-01');
  const [endDate, setEndDate] = useState('2025-07-18');
  const [activeTab, setActiveTab] = useState('甘特图模式');
  
  const tasks: TaskItem[] = [
    { id: '1', name: '地面支模', status: 'completed', progress: 100 },
    { id: '2', name: '地面混凝土浇筑', status: 'completed', progress: 100 },
    { id: '3', name: '地面拆模', status: 'completed', progress: 85 },
    { id: '4', name: '钢筋混凝土柱支模', status: 'completed', progress: 90 },
    { id: '5', name: '钢筋混凝土柱浇筑', status: 'in-progress', progress: 75 },
    { id: '6', name: '柱拆模', status: 'pending', progress: 0 },
    { id: '7', name: '钢筋混凝土承重墙支模', status: 'completed', progress: 85 }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('上传的文件:', files[0]);
      // 移除自动切换，由用户手动切换
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('拖拽的文件:', files[0]);
      // 移除自动切换，由用户手动切换
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'upload' ? 'output' : 'upload');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#ff9500';
      case 'in-progress': return '#007aff';
      case 'pending': return '#ff3b30';
      default: return '#8e8e93';
    }
  };


  if (viewMode === 'upload') {
    return (
      <div className="output-panel">
        <div className="top-header">
          <button className="toggle-view-btn top-right" onClick={toggleViewMode}>
            切换到输出模式
          </button>
        </div>
        <div 
          className="file-upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 16C4.79086 16 3 14.2091 3 12C3 9.79086 4.79086 8 7 8C7.27614 8 7.54291 8.02763 7.8 8.08C8.77805 5.74 11.2105 4 14 4C17.3137 4 20 6.68629 20 10C20 10.3431 19.9659 10.6772 19.9007 11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 15L12 12L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="upload-text">
            <div className="upload-title">上传CAD文件或者广联达模型文件</div>
            <div className="upload-subtitle">支持DWG、DWF等格式</div>
          </div>
          <input 
            id="file-input"
            type="file" 
            accept=".dwg,.dwf,.dxf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="output-panel output-mode">
      <div className="top-header">
        <button className="toggle-view-btn top-right" onClick={toggleViewMode}>
          返回上传模式
        </button>
      </div>
      <div className="output-header">
        <div className="project-info">
          <h2 className="project-title">标准层测试项目1</h2>
          <span className="project-date">2025-07-01</span>
        </div>
        <div className="header-controls">
          <button className="nav-btn prev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="nav-btn next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="export-btn">导出报告</button>
        </div>
      </div>
      
      <div className="date-controls">
        <div className="date-input-group">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span>至</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        
        <div className="view-tabs">
          {['甘特图模式', '进度表模式', '资金物料模式'].map(tab => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="status-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff9500' }}></div>
          <span>已完成</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#007aff' }}></div>
          <span>进行中</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff3b30' }}></div>
          <span>未完成</span>
        </div>
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="搜索任务..."
          />
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      </div>
      
      <div className="timeline-header">
        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <div key={day} className="timeline-day">{day}</div>
        ))}
      </div>
      
      <div className="tasks-container">
        {tasks.map(task => (
          <div key={task.id} className="task-row">
            <div className="task-info">
              <div 
                className="task-status-dot" 
                style={{ backgroundColor: getStatusColor(task.status) }}
              ></div>
              <span className="task-name">{task.name}</span>
            </div>
            <div className="task-timeline">
              <div 
                className="task-progress-bar"
                style={{ 
                  backgroundColor: getStatusColor(task.status),
                  width: `${task.progress}%`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Output;
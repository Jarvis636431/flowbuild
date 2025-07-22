import React, { useState, useEffect } from 'react';
import { taskAPI, type TaskItem } from '../services/api';
import './Output.css';

const Output: React.FC = () => {
  const [viewMode, setViewMode] = useState<'upload' | 'output'>('upload');
  const [startDate, setStartDate] = useState('2025-07-01');
  const [endDate, setEndDate] = useState('2025-09-10');
  const [activeTab, setActiveTab] = useState('甘特图模式');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 自动计算任务数据的日期范围
  const getTasksDateRange = (tasks: TaskItem[]) => {
    if (tasks.length === 0) {
      return {
        minDate: '2025-07-01',
        maxDate: '2025-07-18'
      };
    }
    
    const allDates = tasks.flatMap(task => [task.startDate, task.endDate]);
    const minDate = allDates.reduce((min, date) => date < min ? date : min);
    const maxDate = allDates.reduce((max, date) => date > max ? date : max);
    
    return { minDate, maxDate };
  };

  // 获取任务数据
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await taskAPI.getTasks();
      setTasks(tasksData);
      
      // 自动设置日期范围
      const { minDate, maxDate } = getTasksDateRange(tasksData);
      setStartDate(minDate);
      setEndDate(maxDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    if (viewMode === 'output') {
      fetchTasks();
    }
  }, [viewMode]);

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

  // 计算任务在甘特图中的位置和宽度
  const getTaskPosition = (taskStartDate: string, taskEndDate: string) => {
    const timelineStart = new Date(startDate);
    const timelineEnd = new Date(endDate);
    const taskStart = new Date(taskStartDate);
    const taskEnd = new Date(taskEndDate);
    
    // 计算总天数
    const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 计算任务开始相对于时间轴开始的天数（从0开始）
    const taskStartDay = Math.max(0, Math.floor((taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
    
    // 计算任务结束相对于时间轴开始的天数
    const taskEndDay = Math.min(totalDays - 1, Math.floor((taskEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
    
    // 确保任务至少占据一天
    const actualEndDay = Math.max(taskStartDay, taskEndDay);
    
    // 动态选择定位方式：天数少时用百分比，天数多时用像素
    if (totalDays <= 14) {
      // 使用百分比定位，让时间轴填满容器
      const columnWidth = 100 / totalDays;
      const leftPercent = taskStartDay * columnWidth;
      const widthPercent = (actualEndDay - taskStartDay + 1) * columnWidth;
      
      return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`
      };
    } else {
      // 使用固定像素宽度，支持滚动
      const dayWidth = 60;
      const leftPixels = taskStartDay * dayWidth;
      const widthPixels = (actualEndDay - taskStartDay + 1) * dayWidth;
      
      return {
        left: `${leftPixels}px`,
        width: `${widthPixels}px`
      };
    }
  };

  // 生成时间轴日期
  const getTimelineDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
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
      
      {/* 加载状态 */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载数据...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button className="retry-button" onClick={fetchTasks}>
            重新加载
          </button>
        </div>
      )}
      
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
      
      {/* 数据内容 */}
      {!loading && !error && (
        <>
          {activeTab === '甘特图模式' && (
            <div className="gantt-container">
              <div className="gantt-header" style={{
                minWidth: getTimelineDates().length > 14 ? `${200 + 32 + getTimelineDates().length * 60}px` : '400px'
              }}>
                <div className="task-label-header">任务名称</div>
                <div className="timeline-header" style={{
                  width: getTimelineDates().length > 14 ? `${getTimelineDates().length * 60}px` : 'auto'
                }}>
                  {getTimelineDates().map((date, index) => (
                    <div key={index} className="timeline-date" style={{
                      width: getTimelineDates().length > 14 ? '60px' : 'auto',
                      flexShrink: getTimelineDates().length > 14 ? 0 : 1
                    }}>
                      {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="tasks-container">
                {tasks.map((task) => {
                  const position = getTaskPosition(task.startDate, task.endDate);
                  return (
                    <div key={task.id} className="task-row" style={{
                      minWidth: getTimelineDates().length > 14 ? `${200 + 32 + getTimelineDates().length * 60}px` : '400px'
                    }}>
                      <div className="task-info">
                        <span className={`status-dot ${task.status}`}></span>
                        <span className="task-name">{task.name}</span>
                      </div>
                      <div className="task-timeline" style={{
                        width: getTimelineDates().length > 14 ? `${getTimelineDates().length * 60}px` : 'auto',
                        flex: getTimelineDates().length > 14 ? 'none' : '1'
                      }}>
                        <div 
                          className="task-bar"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: getStatusColor(task.status)
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === '进度表模式' && (
            <div className="progress-table">
              <div className="table-header">
                <div className="table-cell header-cell">项目名称</div>
                <div className="table-cell header-cell">开始日期</div>
                <div className="table-cell header-cell">结束日期</div>
                <div className="table-cell header-cell">资金物料</div>
                <div className="table-cell header-cell">施工人员</div>
                <div className="table-cell header-cell">备注</div>
              </div>
              <div className="table-body">
                {tasks.map(task => (
                  <div key={task.id} className="table-row">
                    <div className="table-cell task-name-cell">
                      <div 
                        className="task-status-dot" 
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      ></div>
                      <span>{task.name}</span>
                    </div>
                    <div className="table-cell">{task.startDate}</div>
                    <div className="table-cell">{task.endDate}</div>
                    <div className="table-cell">{task.cost}</div>
                    <div className="table-cell">{task.personnel}</div>
                    <div className="table-cell notes-cell">
                      {task.notes ? (
                        <span className="notes-text">{task.notes}</span>
                      ) : (
                        <div className="notes-image">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" fill="#e0e0e0"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="#999"/>
                            <path d="M21 15L16 10L5 21" stroke="#999" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === '资金物料模式' && (
            <div className="material-mode">
              <div className="placeholder-content">
                <p>资金物料模式内容待开发</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Output;
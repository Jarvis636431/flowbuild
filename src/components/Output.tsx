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
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // 自动计算任务数据的天数范围
  const getTasksDayRange = (tasks: TaskItem[]) => {
    if (tasks.length === 0) {
      return {
        minDay: 1,
        maxDay: 18
      };
    }
    
    const allDays = tasks.flatMap(task => [task.startDay, task.endDay]);
    const minDay = Math.min(...allDays);
    const maxDay = Math.max(...allDays);
    
    return { minDay, maxDay };
  };

  // 获取任务数据
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await taskAPI.getTasks();
      setTasks(tasksData);
      
      // 自动设置天数范围
      const { minDay, maxDay } = getTasksDayRange(tasksData);
      setStartDate(`第${minDay}天`);
      setEndDate(`第${maxDay}天`);
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

  // 处理任务行点击事件
  const handleTaskClick = (task: TaskItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Task clicked:', task.name); // 调试信息
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 计算弹窗位置，确保在可视区域内
    let x = rect.left + rect.width / 2;
    let y = rect.top - 10;
    
    // 防止弹窗超出屏幕边界
    if (x < 200) x = 200;
    if (x > viewportWidth - 200) x = viewportWidth - 200;
    if (y < 100) y = rect.bottom + 10;
    
    setSelectedTask(task);
    setPopupPosition({ x, y });
    
    console.log('Popup position set:', { x, y }, 'Viewport:', { viewportWidth, viewportHeight }); // 调试信息
  };

  // 关闭悬浮窗
  const closePopup = () => {
    setSelectedTask(null);
    setPopupPosition(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const getStatusColor = () => {
  return '#4CAF50'; // 所有任务都使用绿色表示活跃状态
};

  // 计算任务在甘特图中的位置和宽度
  const getTaskPosition = (taskStartDay: number, taskEndDay: number) => {
    const { minDay, maxDay } = getTasksDayRange(tasks);
    const totalDays = maxDay - minDay + 1;
    
    // 计算任务开始相对于时间轴开始的天数（从0开始）
    const relativeStartDay = Math.max(0, taskStartDay - minDay);
    
    // 计算任务结束相对于时间轴开始的天数
    const relativeEndDay = Math.min(totalDays - 1, taskEndDay - minDay);
    
    // 确保任务至少占据一天
    const actualEndDay = Math.max(relativeStartDay, relativeEndDay);
    
    // 动态选择定位方式：天数少时用百分比，天数多时用像素
    if (totalDays <= 14) {
      // 使用百分比定位，让时间轴填满容器
      const columnWidth = 100 / totalDays;
      const leftPercent = relativeStartDay * columnWidth;
      const widthPercent = (actualEndDay - relativeStartDay + 1) * columnWidth;
      
      return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`
      };
    } else {
      // 使用固定像素宽度，支持滚动
      const dayWidth = 60;
      const leftPixels = relativeStartDay * dayWidth;
      const widthPixels = (actualEndDay - relativeStartDay + 1) * dayWidth;
      
      return {
        left: `${leftPixels}px`,
        width: `${widthPixels}px`
      };
    }
  };

  // 生成时间轴天数
  const getTimelineDays = () => {
    const { minDay, maxDay } = getTasksDayRange(tasks);
    const days = [];
    
    for (let day = minDay; day <= maxDay; day++) {
      days.push(day);
    }
    
    return days;
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
          <span className="day-range-display">{startDate} 至 {endDate}</span>
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
      
      <div className="search-section">
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
                minWidth: getTimelineDays().length > 14 ? `${200 + 32 + getTimelineDays().length * 60}px` : '400px'
              }}>
                <div className="task-label-header">任务名称</div>
                <div className="timeline-header" style={{
                  width: getTimelineDays().length > 14 ? `${getTimelineDays().length * 60}px` : 'auto'
                }}>
                  {getTimelineDays().map((day, index) => (
                    <div key={index} className="timeline-date" style={{
                      width: getTimelineDays().length > 14 ? '60px' : 'auto',
                      flexShrink: getTimelineDays().length > 14 ? 0 : 1
                    }}>
                      第{day}天
                    </div>
                  ))}
                </div>
              </div>
              <div className="tasks-container">
                {tasks.map((task) => {
                  const position = getTaskPosition(task.startDay, task.endDay);
                  return (
                    <div 
                      key={task.id} 
                      className="task-row clickable-row" 
                      style={{
                        minWidth: getTimelineDays().length > 14 ? `${200 + 32 + getTimelineDays().length * 60}px` : '400px'
                      }}
                      onClick={(e) => handleTaskClick(task, e)}
                    >
                      <div className="task-info">
                        <span className={`status-dot ${task.status}`}></span>
                        <span className="task-name">{task.name}</span>
                      </div>
                      <div className="task-timeline" style={{
                        width: getTimelineDays().length > 14 ? `${getTimelineDays().length * 60}px` : 'auto',
                        flex: getTimelineDays().length > 14 ? 'none' : '1'
                      }}>
                        <div 
                          className="task-bar"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: getStatusColor()
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
                  <div 
                    key={task.id} 
                    className="table-row clickable-row"
                    onClick={(e) => handleTaskClick(task, e)}
                  >
                    <div className="table-cell task-name-cell">
                      <div 
                        className="task-status-dot" 
                        style={{ backgroundColor: getStatusColor() }}
                      ></div>
                      <span>{task.name}</span>
                    </div>
                    <div className="table-cell">第{task.startDay}天</div>
                    <div className="table-cell">第{task.endDay}天</div>
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
        </>      )}
      
      {/* 悬浮窗 */}
      {selectedTask && popupPosition && (
        <>
          {console.log('Rendering popup for task:', selectedTask.name, 'at position:', popupPosition)}
          {/* 遮罩层 */}
          <div className="popup-overlay" onClick={closePopup}></div>
          {/* 悬浮窗内容 */}
          <div 
            className="task-detail-popup"
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#2a2a2a',
              border: '2px solid #ff0000' // 临时红色边框用于调试
            }}
          >
            <div className="popup-header">
              <h3>{selectedTask.name}</h3>
              <button className="close-btn" onClick={closePopup}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              <div className="detail-item">
                <span className="detail-label">状态:</span>
                <span className={`status-badge ${selectedTask.status}`}>
                  活跃
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">开始时间:</span>
                <span>第{selectedTask.startDay}天</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">结束时间:</span>
                <span>第{selectedTask.endDay}天</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">成本:</span>
                <span>{selectedTask.cost}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">负责人:</span>
                <span>{selectedTask.personnel}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">备注:</span>
                <span>{selectedTask.notes}</span>
              </div>
              <div className="detail-item detail-description">
                <span className="detail-label">详细信息:</span>
                <p>{selectedTask.details}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Output;
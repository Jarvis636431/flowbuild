import React, { useState, useEffect, useCallback } from "react";
import { taskAPI, type TaskItem, type Project } from "../services/api";
import ReactECharts from "echarts-for-react";
import "./Output.css";
import TaskDetailModal from "./shared/TaskDetailModal";

interface OutputProps {
  currentProject: Project | null;
}

const Output: React.FC<OutputProps> = ({ currentProject }) => {
  const [viewMode, setViewMode] = useState<"upload" | "output">("upload");

  const [activeTab, setActiveTab] = useState("甘特图模式");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 新增状态：文件上传和项目创建
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // 自动计算任务数据的天数范围
  const getTasksDayRange = (tasks: TaskItem[]) => {
    if (tasks.length === 0) {
      return {
        minDay: 1,
        maxDay: 18,
      };
    }

    const allDays = tasks.flatMap((task) => [task.startDay, task.endDay]);
    const minDay = Math.min(...allDays);
    const maxDay = Math.max(...allDays);

    return { minDay, maxDay };
  };

  // 计算项目总天数
  const getTotalDays = () => {
    const { minDay, maxDay } = getTasksDayRange(tasks);
    return maxDay - minDay + 1;
  };

  // 计算资金投入趋势数据
   const calculateFundingTrend = (tasks: TaskItem[]) => {
     const totalDays = getTotalDays();
     const dailyFunding: number[] = new Array(totalDays).fill(0);
     
     tasks.forEach(task => {
       const startDay = task.startDay - 1; // 转为0索引
       const duration = task.endDay - task.startDay + 1;
       const cost = task.cost || 0;
       const dailyCost = cost / duration;
       
       for (let i = 0; i < duration && (startDay + i) < totalDays; i++) {
         dailyFunding[startDay + i] += dailyCost;
       }
     });
     
     // 计算累积资金投入
     const cumulativeFunding: number[] = [];
     let total = 0;
     for (let i = 0; i < totalDays; i++) {
       total += dailyFunding[i];
       cumulativeFunding.push(total);
     }
     
     return cumulativeFunding;
   };

  // 计算物料消耗趋势数据
   const calculateMaterialTrend = (tasks: TaskItem[]) => {
     const totalDays = getTotalDays();
     const dailyMaterial: number[] = new Array(totalDays).fill(0);
     
     tasks.forEach(task => {
       const startDay = task.startDay - 1; // 转为0索引
       const duration = task.endDay - task.startDay + 1;
       const workload = task.工程量 || 0;
       const dailyMaterialAmount = workload / duration;
       
       for (let i = 0; i < duration && (startDay + i) < totalDays; i++) {
         dailyMaterial[startDay + i] += dailyMaterialAmount;
       }
     });
     
     // 计算累积物料消耗
     const cumulativeMaterial: number[] = [];
     let total = 0;
     for (let i = 0; i < totalDays; i++) {
       total += dailyMaterial[i];
       cumulativeMaterial.push(total);
     }
     
     return cumulativeMaterial;
   };

  // 生成资金投入趋势图表配置
  const getFundingChartOption = () => {
    const fundingData = calculateFundingTrend(tasks);
    const totalDays = getTotalDays();
    const xAxisData = Array.from({ length: totalDays }, (_, i) => `第${i + 1}天`);
    
    return {
      title: {
        text: '资金投入趋势',
        left: 'center',
        textStyle: {
          color: '#fff',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{name: string, value: number}>) => {
          const data = params[0];
          return `${data.name}<br/>累积投入: ${data.value.toFixed(2)}万元`;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          color: '#888',
          interval: Math.floor(totalDays / 5) || 1
        },
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '资金(万元)',
        nameTextStyle: {
          color: '#888'
        },
        axisLabel: {
          color: '#888',
          formatter: '{value}万'
        },
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#333',
            opacity: 0.3
          }
        }
      },
      series: [{
        name: '累积资金投入',
        type: 'line',
        data: fundingData,
        smooth: true,
        lineStyle: {
          color: '#4CAF50',
          width: 2
        },
        itemStyle: {
          color: '#4CAF50'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(76, 175, 80, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(76, 175, 80, 0.1)'
            }]
          }
        }
      }]
    };
  };

  // 生成物料消耗趋势图表配置
  const getMaterialChartOption = () => {
    const materialData = calculateMaterialTrend(tasks);
    const totalDays = getTotalDays();
    const xAxisData = Array.from({ length: totalDays }, (_, i) => `第${i + 1}天`);
    
    return {
      title: {
        text: '物料消耗趋势',
        left: 'center',
        textStyle: {
          color: '#fff',
          fontSize: 16
        }
      },
      tooltip: {
         trigger: 'axis',
         formatter: (params: Array<{name: string, value: number}>) => {
           const data = params[0];
           return `${data.name}<br/>累积消耗: ${data.value.toFixed(2)}万立方米`;
         }
       },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          color: '#888',
          interval: Math.floor(totalDays / 5) || 1
        },
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '物料(吨)',
        nameTextStyle: {
          color: '#888'
        },
        axisLabel: {
          color: '#888',
          formatter: '{value}吨'
        },
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#333',
            opacity: 0.3
          }
        }
      },
      series: [{
        name: '累积物料消耗',
        type: 'line',
        data: materialData,
        smooth: true,
        lineStyle: {
          color: '#FF9800',
          width: 2
        },
        itemStyle: {
          color: '#FF9800'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(255, 152, 0, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(255, 152, 0, 0.1)'
            }]
          }
        }
      }]
    };
  };

    // 获取任务数据
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let tasksData: TaskItem[];
      if (currentProject) {
        // 根据项目ID获取任务
        tasksData = await taskAPI.getTasks();
        tasksData = tasksData.filter(
          (task) => task.projectId === currentProject.id
        );
      } else {
        // 获取所有任务
        tasksData = await taskAPI.getTasks();
      }

      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // 组件挂载时获取数据
  useEffect(() => {
    if (viewMode === "output") {
      fetchTasks();
    }
  }, [viewMode, fetchTasks]);

  // 监听项目变化，重新获取任务数据
  useEffect(() => {
    if (viewMode === "output" && currentProject) {
      fetchTasks();
    }
  }, [currentProject, viewMode, fetchTasks]);

  // 处理文档文件上传
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setDocumentFile(files[0]);
      console.log("上传的文档文件:", files[0]);
    }
  };

  // 处理CAD文件上传
  const handleCadUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCadFile(files[0]);
      console.log("上传的CAD文件:", files[0]);
    }
  };

  // 处理文档文件拖拽
  const handleDocumentDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setDocumentFile(files[0]);
      console.log("拖拽的文档文件:", files[0]);
    }
  };

  // 处理CAD文件拖拽
  const handleCadDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setCadFile(files[0]);
      console.log("拖拽的CAD文件:", files[0]);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("请输入项目名称");
      return;
    }

    if (!documentFile && !cadFile) {
      alert("请至少上传一个文件");
      return;
    }

    setIsCreatingProject(true);
    try {
      // 这里可以调用API创建项目
      console.log("创建项目:", {
        name: projectName,
        documentFile,
        cadFile,
      });

      // 模拟创建项目的延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 创建成功后切换到输出模式
      setViewMode("output");
    } catch (error) {
      console.error("创建项目失败:", error);
      alert("创建项目失败，请重试");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "upload" ? "output" : "upload");
  };

  // 处理任务行点击事件
  const handleTaskClick = (task: TaskItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("Task clicked:", task.name); // 调试信息

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

    console.log("Popup position set:", { x, y }, "Viewport:", {
      viewportWidth,
      viewportHeight,
    }); // 调试信息
  };

  // 关闭悬浮窗
  const closePopup = () => {
    setSelectedTask(null);
    setPopupPosition(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
        width: `${widthPercent}%`,
      };
    } else {
      // 使用固定像素宽度，支持滚动
      const dayWidth = 60;
      const leftPixels = relativeStartDay * dayWidth;
      const widthPixels = (actualEndDay - relativeStartDay + 1) * dayWidth;

      return {
        left: `${leftPixels}px`,
        width: `${widthPixels}px`,
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

  if (viewMode === "upload") {
    return (
      <div className="output-panel">
        <div className="top-header">
          <button
            className="toggle-view-btn top-right"
            onClick={toggleViewMode}
          >
            切换到输出模式
          </button>
        </div>

        <div className="upload-container">
          <h2 className="upload-main-title">创建新项目</h2>

          {/* 上传区域容器 - 左右排列 */}
          <div className="upload-sections-container">
            {/* 文档文件上传区域 */}
            <div className="upload-section">
              <h3 className="upload-section-title">上传项目文档</h3>
              <div
                className={`file-upload-area ${documentFile ? "has-file" : ""}`}
                onDrop={handleDocumentDrop}
                onDragOver={handleDragOver}
                onClick={() =>
                  document.getElementById("document-input")?.click()
                }
              >
                <div className="upload-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="upload-text">
                  {documentFile ? (
                    <>
                      <div className="upload-title">已选择文件</div>
                      <div className="upload-subtitle">{documentFile.name}</div>
                    </>
                  ) : (
                    <>
                      <div className="upload-title">上传项目文档</div>
                      <div className="upload-subtitle">
                        支持PDF、DOC、DOCX等格式
                      </div>
                    </>
                  )}
                </div>
                <input
                  id="document-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDocumentUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* CAD文件上传区域 */}
            <div className="upload-section">
              <h3 className="upload-section-title">上传CAD文件</h3>
              <div
                className={`file-upload-area ${cadFile ? "has-file" : ""}`}
                onDrop={handleCadDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("cad-input")?.click()}
              >
                <div className="upload-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 16C4.79086 16 3 14.2091 3 12C3 9.79086 4.79086 8 7 8C7.27614 8 7.54291 8.02763 7.8 8.08C8.77805 5.74 11.2105 4 14 4C17.3137 4 20 6.68629 20 10C20 10.3431 19.9659 10.6772 19.9007 11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 12L12 20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 15L12 12L9 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="upload-text">
                  {cadFile ? (
                    <>
                      <div className="upload-title">已选择文件</div>
                      <div className="upload-subtitle">{cadFile.name}</div>
                    </>
                  ) : (
                    <>
                      <div className="upload-title">
                        上传CAD文件或广联达模型文件
                      </div>
                      <div className="upload-subtitle">
                        支持DWG、DWF、DXF等格式
                      </div>
                    </>
                  )}
                </div>
                <input
                  id="cad-input"
                  type="file"
                  accept=".dwg,.dwf,.dxf,.gbq,.gbd"
                  onChange={handleCadUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

          {/* 项目名称输入 */}
          <div className="project-name-section">
            <h3 className="upload-section-title">项目名称</h3>
            <input
              type="text"
              className="project-name-input"
              placeholder="请输入项目名称"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* 确认按钮 */}
          <div className="create-project-section">
            <button
              className="create-project-btn"
              onClick={handleCreateProject}
              disabled={isCreatingProject || !projectName.trim()}
            >
              {isCreatingProject ? "创建中..." : "确认创建项目"}
            </button>
          </div>
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
          <div className="project-title">
            {currentProject?.name || "未选择项目"}
          </div>
          <div className="project-date">总计{getTotalDays()}天</div>
        </div>
        <div className="header-controls">
          <button className="export-btn">导出报告</button>
        </div>
      </div>

      <div className="date-controls">
        <div className="view-tabs">
          {["甘特图模式", "进度表模式", "资金物料模式", "操作记录"].map(
            (tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            )
          )}
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

      {/* 数据内容 */}
      {!loading && !error && (
        <>
          {activeTab === "甘特图模式" && (
            <div className="gantt-container">
              <div
                className="gantt-header"
                style={{
                  minWidth:
                    getTimelineDays().length > 14
                      ? `${200 + 32 + getTimelineDays().length * 60}px`
                      : "400px",
                }}
              >
                <div className="task-label-header">任务名称</div>
                <div
                  className="timeline-header"
                  style={{
                    width:
                      getTimelineDays().length > 14
                        ? `${getTimelineDays().length * 60}px`
                        : "auto",
                  }}
                >
                  {getTimelineDays().map((day, index) => (
                    <div
                      key={index}
                      className="timeline-date"
                      style={{
                        width: getTimelineDays().length > 14 ? "60px" : "auto",
                        flexShrink: getTimelineDays().length > 14 ? 0 : 1,
                      }}
                    >
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
                        minWidth:
                          getTimelineDays().length > 14
                            ? `${200 + 32 + getTimelineDays().length * 60}px`
                            : "400px",
                      }}
                      onClick={(e) => handleTaskClick(task, e)}
                    >
                      <div className="task-info">
                        <span className="status-dot"></span>
                        <span className="task-name">{task.name}</span>
                      </div>
                      <div
                        className="task-timeline"
                        style={{
                          width:
                            getTimelineDays().length > 14
                              ? `${getTimelineDays().length * 60}px`
                              : "auto",
                          flex: getTimelineDays().length > 14 ? "none" : "1",
                        }}
                      >
                        <div
                          className="task-bar"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: task.是否加班
                              ? "#ff6b6b"
                              : "#4CAF50",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "进度表模式" && (
            <div className="progress-table-wrapper">
              <div className="progress-table">
                <div className="table-header">
                  <div className="table-cell header-cell">序号</div>
                  <div className="table-cell header-cell">施工工序</div>
                  <div className="table-cell header-cell">施工方式</div>
                  <div className="table-cell header-cell">施工人数</div>
                  <div className="table-cell header-cell">工种</div>
                  <div className="table-cell header-cell">价格</div>
                  <div className="table-cell header-cell">工程量</div>
                  <div className="table-cell header-cell">开始时间</div>
                  <div className="table-cell header-cell">结束时间</div>
                  <div className="table-cell header-cell">直接依赖工种</div>
                </div>
                <div className="table-body">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`table-row clickable-row ${
                        task.是否加班 ? "overtime-row" : ""
                      }`}
                      onClick={(e) => handleTaskClick(task, e)}
                    >
                      <div className="table-cell">{task.序号}</div>
                      <div className="table-cell task-name-cell">
                        <div
                          className="task-status-dot"
                          style={{
                            backgroundColor: task.是否加班
                              ? "#ff6b6b"
                              : "#4CAF50",
                          }}
                        ></div>
                        <span>{task.name}</span>
                      </div>
                      <div className="table-cell">{task.施工方式}</div>
                      <div className="table-cell">{task.施工人数}人</div>
                      <div className="table-cell">{task.工种}</div>
                      <div className="table-cell">
                        {task.cost.toLocaleString()}
                      </div>
                      <div className="table-cell">
                        {task.工程量}
                        {task.单位}
                      </div>
                      <div className="table-cell">第{task.startDay}天</div>
                      <div className="table-cell">第{task.endDay}天</div>
                      <div className="table-cell">
                        {task.直接依赖工种.length > 0
                          ? task.直接依赖工种.join(", ")
                          : "无"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "资金物料模式" && (
            <div className="material-mode">
              <div className="charts-container">
                <div className="chart-section">
                  <div className="echarts-container">
                    <ReactECharts
                      option={getFundingChartOption()}
                      style={{ height: '300px', width: '100%' }}
                      theme="dark"
                    />
                  </div>
                </div>

                <div className="chart-section">
                  <div className="echarts-container">
                    <ReactECharts
                      option={getMaterialChartOption()}
                      style={{ height: '300px', width: '100%' }}
                      theme="dark"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "操作记录" && (
            <div className="operation-log-mode">
              <div className="log-container">
                <div className="log-header">
                  <h3 className="log-title">项目操作记录</h3>
                  <div className="log-filters">
                    <select className="filter-select">
                      <option value="all">全部操作</option>
                      <option value="create">创建</option>
                      <option value="update">更新</option>
                      <option value="delete">删除</option>
                    </select>
                  </div>
                </div>
                <div className="log-list">
                  <div className="log-item">
                    <div className="log-time">2025-01-01 10:30:15</div>
                    <div className="log-action">创建项目</div>
                    <div className="log-description">
                      创建了新项目"标准层测试项目1"
                    </div>
                    <div className="log-user">系统管理员</div>
                  </div>
                  <div className="log-item">
                    <div className="log-time">2025-01-01 11:15:22</div>
                    <div className="log-action">添加任务</div>
                    <div className="log-description">添加了任务"基础施工"</div>
                    <div className="log-user">项目经理</div>
                  </div>
                  <div className="log-item">
                    <div className="log-time">2025-01-01 14:20:08</div>
                    <div className="log-action">更新进度</div>
                    <div className="log-description">
                      更新了任务"基础施工"的进度状态
                    </div>
                    <div className="log-user">施工负责人</div>
                  </div>
                  <div className="log-item">
                    <div className="log-time">2025-01-01 16:45:33</div>
                    <div className="log-action">修改计划</div>
                    <div className="log-description">
                      调整了任务"主体结构"的时间安排
                    </div>
                    <div className="log-user">项目经理</div>
                  </div>
                  <div className="log-item">
                    <div className="log-time">2025-01-02 09:10:45</div>
                    <div className="log-action">导出报告</div>
                    <div className="log-description">导出了项目进度报告</div>
                    <div className="log-user">项目经理</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 任务详情弹窗 */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={closePopup}
        task={selectedTask}
        position={popupPosition}
      />
    </div>
  );
};

export default Output;

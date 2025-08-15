import React, { useMemo } from 'react';
import type { TaskItem } from '../../services/api';

interface ShutdownEvent {
  name: string;
  start_time: { day: number; hour: number };
  end_time: { day: number; hour: number };
  a_level_tasks: string[];
  b_level_tasks: string[];
}

interface GanttChartProps {
  tasks: TaskItem[];
  onTaskClick: (
    task: TaskItem,
    e: React.MouseEvent<HTMLElement>
  ) => Promise<void>;
  shutdownEvents?: ShutdownEvent[];
}

const GanttChart: React.FC<GanttChartProps> = React.memo(
  ({ tasks, onTaskClick, shutdownEvents = [] }) => {
    console.log('📊 GanttChart组件接收到的数据:', {
      tasksCount: tasks.length,
      tasks: tasks.slice(0, 3), // 只显示前3个任务避免日志过长
      firstTask: tasks[0],
      hasOnTaskClick: typeof onTaskClick === 'function'
    });
    
    // 自动计算任务数据的天数范围
    const getTasksDayRange = useMemo(() => {
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
    }, [tasks]);

    // 生成时间轴天数
    const timelineDays = useMemo(() => {
      const { minDay, maxDay } = getTasksDayRange;
      const days = [];

      for (let day = minDay; day <= maxDay; day++) {
        days.push(day);
      }

      return days;
    }, [getTasksDayRange]);

    // 计算任务在甘特图中的位置和宽度
    const getTaskPosition = useMemo(() => {
      return (taskStartDay: number, taskEndDay: number) => {
        const { minDay, maxDay } = getTasksDayRange;
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
          const widthPercent =
            (actualEndDay - relativeStartDay + 1) * columnWidth;

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
    }, [getTasksDayRange]);

    return (
      <div
        className="gantt-container"
        style={{ height: '900px', overflowY: 'auto'}}
      >
        <div
          className="gantt-header"
          style={{
            minWidth:
              timelineDays.length > 14
                ? `${200 + 32 + timelineDays.length * 60}px`
                : '400px',
          }}
        >
          <div className="task-label-header">任务名称</div>
          <div
            className="timeline-header"
            style={{
              width:
                timelineDays.length > 14
                  ? `${timelineDays.length * 60}px`
                  : 'auto',
            }}
          >
            {timelineDays.map((day, index) => (
              <div
                key={index}
                className="timeline-date"
                style={{
                  width: timelineDays.length > 14 ? '60px' : 'auto',
                  flexShrink: timelineDays.length > 14 ? 0 : 1,
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
                className="task-row"
                style={{
                  minWidth:
                    timelineDays.length > 14
                      ? `${200 + 32 + timelineDays.length * 60}px`
                      : '400px',
                }}
              >
                <div className="task-info">
                  <span className="status-dot"></span>
                  <span className="task-name">{task.name}</span>
                </div>
                <div
                  className="task-timeline"
                  style={{
                    width:
                      timelineDays.length > 14
                        ? `${timelineDays.length * 60}px`
                        : 'auto',
                    flex: timelineDays.length > 14 ? 'none' : '1',
                    position: 'relative',
                  }}
                >
                  {/* 渲染停工事件的灰色标记 */}
                  {shutdownEvents.map((event, eventIndex) => {
                    const startDay = event.start_time.day;
                    const endDay = event.end_time.day;
                    const shutdownPosition = getTaskPosition(startDay, endDay);
                    return (
                      <div
                        key={`shutdown-${eventIndex}`}
                        className="shutdown-event"
                        style={{
                          position: 'absolute',
                          left: shutdownPosition.left,
                          width: shutdownPosition.width,
                          height: '100%',
                          backgroundColor: 'rgba(128, 128, 128, 0.3)',
                          zIndex: 1,
                          pointerEvents: 'none',
                        }}
                        title={`${event.name} (第${startDay}天-第${endDay}天)`}
                      />
                    );
                  })}
                  <div
                    className="task-bar"
                    style={{
                      left: position.left,
                      width: position.width,
                      backgroundColor: task.isOvertime ? '#ff6b6b' : '#4CAF50',
                      position: 'relative',
                      zIndex: 2,
                    }}
                    onClick={(e) => onTaskClick(task, e)}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

GanttChart.displayName = 'GanttChart';

export default GanttChart;

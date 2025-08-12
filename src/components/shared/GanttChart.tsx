import React, { useMemo } from 'react';
import type { TaskItem } from '../../services/api';
import TaskBar from './TaskBar';

interface GanttChartProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem, e: React.MouseEvent<HTMLElement>) => void;
}

const GanttChart: React.FC<GanttChartProps> = React.memo(
  ({ tasks, onTaskClick }) => {
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
        style={{ height: '700px', overflowY: 'auto' }}
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
              <TaskBar
                key={task.id}
                task={task}
                position={position}
                timelineDaysLength={timelineDays.length}
                onClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

GanttChart.displayName = 'GanttChart';

export default GanttChart;

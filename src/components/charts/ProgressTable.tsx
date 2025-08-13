import React from 'react';
import type { TaskItem } from '../../services/api';

interface ProgressTableProps {
  tasks: TaskItem[];
  onTaskClick: (
    task: TaskItem,
    e: React.MouseEvent<HTMLElement>
  ) => Promise<void>;
}

const ProgressTable: React.FC<ProgressTableProps> = React.memo(
  ({ tasks, onTaskClick }) => {
    return (
      <div className="progress-table-wrapper">
        <div className="progress-table">
          <div className="table-header">
            <div className="table-cell header-cell">序号</div>
            <div className="table-cell header-cell">施工工序</div>
            <div className="table-cell header-cell">工程量</div>
            <div className="table-cell header-cell">施工方式</div>
            <div className="table-cell header-cell">开始时间</div>
            <div className="table-cell header-cell">结束时间</div>
            <div className="table-cell header-cell">持续时长</div>
            <div className="table-cell header-cell">施工人数</div>
            <div className="table-cell header-cell">工种</div>
            <div className="table-cell header-cell">价格</div>
            <div className="table-cell header-cell">直接依赖任务</div>
          </div>
          <div className="table-body">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`table-row clickable-row ${
                  task.isOvertime ? 'overtime-row' : ''
                }`}
                onClick={(e) => onTaskClick(task, e)}
              >
                <div className="table-cell">{task.serialNumber}</div>
                <div className="table-cell task-name-cell">
                  <div
                    className="task-status-dot"
                    style={{
                      backgroundColor: task.isOvertime ? '#ff6b6b' : '#4CAF50',
                    }}
                  ></div>
                  <span>{task.name}</span>
                </div>
                <div className="table-cell">
                  {task.workload}
                  {task.unit}
                </div>
                <div className="table-cell">{task.constructionMethod}</div>
                <div className="table-cell">
                  {task.startTime
                    ? `第${task.startTime.day}天 ${task.startTime.hour.toString().padStart(2, '0')}:00`
                    : `第${task.startDay}天`}
                </div>
                <div className="table-cell">
                  {task.endTime
                    ? `第${task.endTime.day}天 ${task.endTime.hour.toString().padStart(2, '0')}:00`
                    : `第${task.endDay}天`}
                </div>
                <div className="table-cell">
                  {task.startTime && task.endTime
                    ? `${Math.max(1, Math.ceil((task.endTime.totalHours - task.startTime.totalHours) / 24))}天`
                    : `${task.endDay - task.startDay + 1}天`}
                </div>
                <div className="table-cell">{task.workerCount}人</div>
                <div className="table-cell">{task.workType}</div>
                <div className="table-cell">{task.cost.toLocaleString()}</div>
                <div className="table-cell">
                  {task.dependencies.length > 0
                    ? task.dependencies.join(', ')
                    : '无'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

ProgressTable.displayName = 'ProgressTable';

export default ProgressTable;

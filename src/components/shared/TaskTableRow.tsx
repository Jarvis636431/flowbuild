import React from 'react';
import type { TaskItem } from '../../services/api';

interface TaskTableRowProps {
  task: TaskItem;
  onClick: (task: TaskItem, e: React.MouseEvent<HTMLElement>) => void;
}

const TaskTableRow: React.FC<TaskTableRowProps> = React.memo(
  ({ task, onClick }) => {
    return (
      <div
        className={`table-row clickable-row ${
          task.isOvertime ? 'overtime-row' : ''
        }`}
        onClick={(e) => onClick(task, e)}
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
          {task.dependencies.length > 0 ? task.dependencies.join(', ') : '无'}
        </div>
      </div>
    );
  }
);

TaskTableRow.displayName = 'TaskTableRow';

export default TaskTableRow;

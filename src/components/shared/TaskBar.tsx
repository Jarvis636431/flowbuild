import React from 'react';
import type { TaskItem } from '../../services/api';

interface TaskBarProps {
  task: TaskItem;
  position: {
    left: string;
    width: string;
  };
  timelineDaysLength: number;
  onClick: (task: TaskItem, e: React.MouseEvent<HTMLElement>) => void;
}

const TaskBar: React.FC<TaskBarProps> = React.memo(
  ({ task, position, timelineDaysLength, onClick }) => {
    return (
      <div
        className="task-row"
        style={{
          minWidth:
            timelineDaysLength > 14
              ? `${200 + 32 + timelineDaysLength * 60}px`
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
              timelineDaysLength > 14 ? `${timelineDaysLength * 60}px` : 'auto',
            flex: timelineDaysLength > 14 ? 'none' : '1',
          }}
        >
          <div
            className="task-bar"
            style={{
              left: position.left,
              width: position.width,
              backgroundColor: task.isOvertime ? '#ff6b6b' : '#4CAF50',
            }}
            onClick={(e) => onClick(task, e)}
          ></div>
        </div>
      </div>
    );
  }
);

TaskBar.displayName = 'TaskBar';

export default TaskBar;

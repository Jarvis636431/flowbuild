import React from 'react';
import type { TaskItem } from '../../services/api';
import TaskTableRow from './TaskTableRow';

interface ProgressTableProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem, e: React.MouseEvent<HTMLElement>) => void;
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
              <TaskTableRow key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

ProgressTable.displayName = 'ProgressTable';

export default ProgressTable;

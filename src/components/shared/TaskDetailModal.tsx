import React from 'react';
import Modal from './Modal';
import { type TaskItem } from '../../services/api';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="task-detail-popup">
      <div className="popup-header">
        <h3>{task.name}</h3>
        <button className="close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="popup-content">
        <div className="detail-item">
          <span className="detail-label">序号:</span>
          <span>{task.serialNumber}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">施工方式:</span>
          <span>{task.constructionMethod}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">施工人数:</span>
          <span>{task.workerCount}人</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">工种:</span>
          <span>{task.workType}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">价格:</span>
          <span>¥{task.cost.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">工程量:</span>
          <span>
            {task.workload}
            {task.unit}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">开始时间:</span>
          <span>
            {task.startTime
              ? `第${task.startTime.day}天 ${task.startTime.hour.toString().padStart(2, '0')}:00`
              : `第${task.startDay}天`}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">结束时间:</span>
          <span>
            {task.endTime
              ? `第${task.endTime.day}天 ${task.endTime.hour.toString().padStart(2, '0')}:00`
              : `第${task.endDay}天`}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">是否加班:</span>
          <span style={{ color: task.isOvertime ? '#ff6b6b' : '#4CAF50' }}>
            {task.isOvertime ? '是' : '否'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">直接依赖工种:</span>
          <span>
            {task.dependencies?.length > 0
              ? task.dependencies.join(', ')
              : '无'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;

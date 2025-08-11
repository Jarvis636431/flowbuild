import React from 'react';
import Modal from './Modal';
import { type TaskItem } from '../../services/api';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  position: { x: number; y: number } | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  position
}) => {
  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      className="task-detail-popup"
    >
      <div className="popup-header">
        <h3>{task.name}</h3>
        <button className="close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="popup-content">
        <div className="detail-item">
          <span className="detail-label">状态:</span>
          <span className={`status-badge ${task.status}`}>
            活跃
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">开始时间:</span>
          <span>第{task.startDay}天</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">结束时间:</span>
          <span>第{task.endDay}天</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">成本:</span>
          <span>{task.cost}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">负责人:</span>
          <span>{task.personnel}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">备注:</span>
          <span>{task.notes}</span>
        </div>
        <div className="detail-item detail-description">
          <span className="detail-label">详细信息:</span>
          <p>{task.details}</p>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
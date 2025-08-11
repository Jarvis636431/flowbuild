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
          <span className="detail-label">序号:</span>
          <span>{task.序号}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">施工方式:</span>
          <span>{task.施工方式}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">施工人数:</span>
          <span>{task.施工人数}人</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">工种:</span>
          <span>{task.工种}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">价格:</span>
          <span>¥{task.cost.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">工程量:</span>
          <span>{task.工程量}{task.单位}</span>
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
          <span className="detail-label">是否加班:</span>
          <span style={{ color: task.是否加班 ? '#ff6b6b' : '#4CAF50' }}>
            {task.是否加班 ? '是' : '否'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">直接依赖工种:</span>
          <span>{task.直接依赖工种?.length > 0 ? task.直接依赖工种.join(', ') : '无'}</span>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
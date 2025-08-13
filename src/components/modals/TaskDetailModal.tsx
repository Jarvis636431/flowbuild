import React from 'react';
import Modal from '../shared/Modal';
import { type TaskItem } from '../../services/api';
import { type ProcessInfoResponse } from '../../services/projectService';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  processInfo: ProcessInfoResponse | null;
  processInfoLoading: boolean;
  processInfoError: string | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  processInfo,
  processInfoLoading,
  processInfoError,
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
          <span className="detail-label">持续时间:</span>
          <span>
            {task.startTime && task.endTime
              ? `${Math.max(1, Math.ceil((task.endTime.totalHours - task.startTime.totalHours) / 24))}天`
              : `${task.endDay - task.startDay + 1}天`}
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
          <span className="detail-label">施工人数:</span>
          <span>{task.workerCount}人</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">施工工种:</span>
          <span>{task.workType}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">价格:</span>
          <span>{task.cost.toLocaleString()}</span>
        </div>

        {/* 工序信息部分 */}
        <div className="detail-section">
          <span className="detail-label">工序信息:</span>
          {processInfoLoading ? (
            <div className="loading-indicator">加载中...</div>
          ) : processInfoError ? (
            <div className="error-message">加载失败: {processInfoError}</div>
          ) : processInfo ? (
            <div style={{ marginLeft: '20px' }}>
              <div className="detail-item">
                <span className="detail-label">施工工序:</span>
                <span>{processInfo.process_info.施工工序}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">持续时间:</span>
                <span>{processInfo.process_info.持续时间}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">开始时间:</span>
                <span>{processInfo.process_info.开始时间 || '未设置'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">结束时间:</span>
                <span>{processInfo.process_info.结束时间 || '未设置'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">施工人数:</span>
                <span>{processInfo.process_info.施工人数}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">施工工种:</span>
                <span>{processInfo.process_info.施工工种}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">人工成本:</span>
                <span>{processInfo.process_info.人工成本}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">拆单名称:</span>
                <span>{processInfo.process_info.拆单名称}</span>
              </div>
            </div>
          ) : (
            <div className="no-data">暂无工序信息</div>
          )}
        </div>

        {/* 派单信息部分 */}
        {processInfo?.order_info && (
          <div className="detail-section">
            <span className="detail-label">派单信息:</span>
            <div style={{ marginLeft: '20px' }}>
              <div className="detail-item">
                <span className="detail-label">工单内容:</span>
                <span>{processInfo.order_info.工单内容}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">详细信息:</span>
                <span>{processInfo.order_info.详细信息}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">设计交底:</span>
                <span>{processInfo.order_info.设计交底}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">安全交底:</span>
                <span>{processInfo.order_info.安全交底}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">技术验收标准:</span>
                <span>{processInfo.order_info.技术验收标准}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;

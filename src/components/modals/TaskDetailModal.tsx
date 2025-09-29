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

  // 检查派单信息是否有任何字段有值
  const hasOrderInfo = processInfo?.order_info && (
    Boolean(processInfo.order_info?.工单内容?.trim()) ||
    (Array.isArray(processInfo.order_info?.详细信息) && processInfo.order_info.详细信息.length > 0) ||
    (Array.isArray(processInfo.order_info?.节点大样图) && processInfo.order_info.节点大样图.length > 0) ||
    Boolean(processInfo.order_info?.设计交底?.trim()) ||
    Boolean(processInfo.order_info?.安全交底?.trim()) ||
    Boolean(processInfo.order_info?.技术验收标准?.trim()) ||
    Boolean(processInfo.order_info?.视频?.trim())
  );

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
      
        {/* 工序信息部分 */}
        <div className="detail-section">
          <span className="detail-label" style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFD700' }}>工序信息:</span>
          {processInfoLoading ? (
            <div className="loading-indicator">加载中...</div>
          ) : processInfoError ? (
            <div className="error-message">加载失败: {processInfoError}</div>
          ) : processInfo ? (
            <div>
              {(processInfo.process_info.施工工序 !== null && processInfo.process_info.施工工序 !== undefined && processInfo.process_info.施工工序 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">施工工序:</span>
                  <span>{processInfo.process_info.施工工序}</span>
                </div>
              )}
              {(processInfo.process_info.持续时间 !== null && processInfo.process_info.持续时间 !== undefined && processInfo.process_info.持续时间 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">持续时间:</span>
                  <span>{processInfo.process_info.持续时间}</span>
                </div>
              )}
              {(processInfo.process_info.开始时间 !== null && processInfo.process_info.开始时间 !== undefined && processInfo.process_info.开始时间 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">开始时间:</span>
                  <span>{processInfo.process_info.开始时间}</span>
                </div>
              )}
              {(processInfo.process_info.结束时间 !== null && processInfo.process_info.结束时间 !== undefined && processInfo.process_info.结束时间 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">结束时间:</span>
                  <span>{processInfo.process_info.结束时间}</span>
                </div>
              )}
              {(processInfo.process_info.施工人数 !== null && processInfo.process_info.施工人数 !== undefined && processInfo.process_info.施工人数 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">施工人数:</span>
                  <span>{processInfo.process_info.施工人数}</span>
                </div>
              )}
              {(processInfo.process_info.施工工种 !== null && processInfo.process_info.施工工种 !== undefined && processInfo.process_info.施工工种 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">施工工种:</span>
                  <span>{processInfo.process_info.施工工种}</span>
                </div>
              )}
              {(processInfo.process_info.人工成本 !== null && processInfo.process_info.人工成本 !== undefined && processInfo.process_info.人工成本 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">成本:</span>
                  <span>{processInfo.process_info.人工成本}</span>
                </div>
              )}
              {(processInfo.process_info.拆单名称 !== null && processInfo.process_info.拆单名称 !== undefined && processInfo.process_info.拆单名称 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">拆单名称:</span>
                  <span>{processInfo.process_info.拆单名称}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="no-data">暂无工序信息</div>
          )}
        </div>

        {/* 派单信息部分 */}
        {hasOrderInfo && (
          <div className="detail-section">
            <span className="detail-label" style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFA500' }}>派单信息:</span>
            <div>
              {(processInfo.order_info?.工单内容 !== null && processInfo.order_info?.工单内容 !== undefined && processInfo.order_info?.工单内容 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">工单内容:</span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processInfo.order_info.工单内容}</span>
                </div>
              )}
              {(processInfo.order_info?.详细信息 && Array.isArray(processInfo.order_info.详细信息) && processInfo.order_info.详细信息.length > 0) && (
                <div className="detail-item">
                  <span className="detail-label">详细信息:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {processInfo.order_info.详细信息.map((imageUrl, index) => (
                      <img 
                        key={index}
                        style={{ width: '80%', maxWidth: '400px', borderRadius: '4px' }} 
                        src={imageUrl} 
                        alt={`详细信息图片 ${index + 1}`} 
                      />
                    ))}
                  </div>
                </div>
              )}
              {(processInfo.order_info?.节点大样图 && Array.isArray(processInfo.order_info.节点大样图) && processInfo.order_info.节点大样图.length > 0) && (
                <div className="detail-item">
                  <span className="detail-label">节点大样图:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {processInfo.order_info.节点大样图.map((imageUrl, index) => (
                      <img 
                        key={index}
                        style={{ width: '80%', maxWidth: '400px', borderRadius: '4px' }} 
                        src={imageUrl} 
                        alt={`节点大样图 ${index + 1}`} 
                      />
                    ))}
                  </div>
                </div>
              )}
              {(processInfo.order_info?.设计交底 !== null && processInfo.order_info?.设计交底 !== undefined && processInfo.order_info?.设计交底 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">设计交底:</span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processInfo.order_info.设计交底}</span>
                </div>
              )}
              {(processInfo.order_info?.安全交底 !== null && processInfo.order_info?.安全交底 !== undefined && processInfo.order_info?.安全交底 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">安全交底:</span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processInfo.order_info.安全交底}</span>
                </div>
              )}
              {(processInfo.order_info?.技术验收标准 !== null && processInfo.order_info?.技术验收标准 !== undefined && processInfo.order_info?.技术验收标准 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">技术验收标准:</span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processInfo.order_info.技术验收标准}</span>
                </div>
              )}

              {(processInfo.order_info?.视频 !== null && processInfo.order_info?.视频 !== undefined && processInfo.order_info?.视频 !== '') && (
                <div className="detail-item">
                  <span className="detail-label">视频:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a 
                      href={processInfo.order_info.视频} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#4CAF50', 
                        textDecoration: 'underline',
                        fontSize: '14px'
                      }}
                    >
                      🎥 查看视频
                    </a>
                    {processInfo.order_info.视频.includes('.mp4') || processInfo.order_info.视频.includes('.webm') || processInfo.order_info.视频.includes('.ogg') ? (
                      <video 
                        controls 
                        style={{ 
                          width: '100%', 
                          maxWidth: '400px', 
                          borderRadius: '4px' 
                        }}
                      >
                        <source src={processInfo.order_info.视频} type="video/mp4" />
                        您的浏览器不支持视频播放。
                      </video>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;

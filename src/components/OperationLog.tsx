import React, { useState } from 'react';

interface LogItem {
  id: string;
  time: string;
  action: string;
  description: string;
  user: string;
  type: 'create' | 'update' | 'delete' | 'export';
}

const OperationLog: React.FC = React.memo(() => {
  const [filterType, setFilterType] = useState<string>('all');

  // 模拟操作记录数据
  const logItems: LogItem[] = [
    {
      id: '1',
      time: '2025-01-01 10:30:15',
      action: '创建项目',
      description: '创建了新项目"标准层测试项目1"',
      user: '系统管理员',
      type: 'create',
    },
    {
      id: '2',
      time: '2025-01-01 11:15:22',
      action: '添加任务',
      description: '添加了任务"基础施工"',
      user: '项目经理',
      type: 'create',
    },
    {
      id: '3',
      time: '2025-01-01 14:20:08',
      action: '更新进度',
      description: '更新了任务"基础施工"的进度状态',
      user: '施工负责人',
      type: 'update',
    },
    {
      id: '4',
      time: '2025-01-01 16:45:33',
      action: '修改计划',
      description: '调整了任务"主体结构"的时间安排',
      user: '项目经理',
      type: 'update',
    },
    {
      id: '5',
      time: '2025-01-02 09:10:45',
      action: '导出报告',
      description: '导出了项目进度报告',
      user: '项目经理',
      type: 'export',
    },
  ];

  // 过滤日志项
  const filteredLogs = logItems.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(event.target.value);
  };

  return (
    <div className="operation-log-mode">
      <div className="log-container">
        <div className="log-header">
          <h3 className="log-title">项目操作记录</h3>
          <div className="log-filters">
            <select
              className="filter-select"
              value={filterType}
              onChange={handleFilterChange}
            >
              <option value="all">全部操作</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="export">导出</option>
            </select>
          </div>
        </div>
        <div className="log-list">
          {filteredLogs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-time">{log.time}</div>
              <div className="log-action">{log.action}</div>
              <div className="log-description">{log.description}</div>
              <div className="log-user">{log.user}</div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="log-empty">
              <p>暂无符合条件的操作记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OperationLog.displayName = 'OperationLog';

export default OperationLog;

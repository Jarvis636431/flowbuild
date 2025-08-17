import React from 'react';

// 文件名截断工具函数
const truncateFileName = (fileName: string, maxLength: number = 30): string => {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  // 获取文件扩展名
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  const nameWithoutExt =
    lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

  // 计算可用于文件名的长度（减去扩展名和省略号的长度）
  const availableLength = maxLength - extension.length - 3; // 3 for "..."

  if (availableLength <= 0) {
    return '...' + extension;
  }

  return nameWithoutExt.substring(0, availableLength) + '...' + extension;
};

interface FileUploadSectionProps {
  documentFile: File | null;
  cadFile: File | null;
  projectName: string;
  isCreatingProject: boolean;
  isPrecreating?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  validationErrors?: string[];
  projectId?: string | null;
  // 轮询相关状态
  isPolling?: boolean;
  pollingStatus?: string;
  pollingProgress?: number;
  pollingMessage?: string;
  onDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCadUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onCadDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onProjectNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPrecreateProject?: () => void;
  onCreateProject: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = React.memo(
  ({
    documentFile,
    cadFile,
    projectName,
    isCreatingProject,
    isPrecreating = false,
    isUploading = false,
    uploadProgress = 0,
    validationErrors = [],
    projectId,
    // 轮询相关状态
    isPolling = false,
    pollingStatus = '',
    pollingProgress = 0,
    pollingMessage = '',
    onDocumentUpload,
    onCadUpload,
    onDocumentDrop,
    onCadDrop,
    onDragOver,
    onProjectNameChange,
    onPrecreateProject,
    onCreateProject,
  }) => {
    return (
      <div className="upload-container">
        <h2 className="upload-main-title">创建新项目</h2>

        {/* 验证错误提示 */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>文件验证错误：</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index} className="error-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 项目状态显示 */}
        {projectId && (
          <div className="project-status">
            <div className="status-item">✅ 项目已预创建，ID: {projectId}</div>
          </div>
        )}

        {/* 上传进度条 */}
        {(isCreatingProject || isPrecreating || isUploading || isPolling) && (
          <div className="upload-progress">
            <div className="progress-label">
              {isPrecreating
                ? '预创建项目中...'
                : isUploading
                  ? `文件上传中... ${uploadProgress}%`
                  : isCreatingProject
                    ? `创建项目中... ${uploadProgress}%`
                    : isPolling
                      ? pollingMessage || `项目处理中... ${pollingProgress}%`
                      : '处理中...'}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${isPolling ? pollingProgress : uploadProgress}%`,
                }}
              ></div>
            </div>
            {/* 轮询状态详细信息 */}
            {isPolling && pollingStatus && (
              <div className="polling-status">
                <span className={`status-indicator ${pollingStatus === 'waiting' ? 'waiting' : ''}`}>
                  {pollingStatus === 'waiting' ? '⏳' : 
                   pollingStatus === 'success' ? '✅' : 
                   pollingStatus === 'processing' ? '🔄' : '🔄'}
                </span>
                <span className="status-text">
                  状态: {pollingStatus === 'waiting' ? '等待数据准备' : 
                         pollingStatus === 'success' ? '处理成功' : 
                         pollingStatus === 'processing' ? '处理中' : pollingStatus}
                </span>
                {pollingStatus === 'waiting' && (
                  <span className="waiting-hint">（数据处理中，请耐心等待）</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 上传区域容器 - 左右排列 */}
        <div className="upload-sections-container">
          {/* 文档文件上传区域 */}
          <div className="upload-section">
            <h3 className="upload-section-title">上传项目文档</h3>
            <div
              className={`file-upload-area ${documentFile ? 'has-file' : ''}`}
              onDrop={onDocumentDrop}
              onDragOver={onDragOver}
              onClick={() => document.getElementById('document-input')?.click()}
            >
              <div className="upload-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="upload-text">
                {documentFile ? (
                  <>
                    <div className="upload-title">已选择文件</div>
                    <div className="upload-subtitle">{documentFile.name}</div>
                  </>
                ) : (
                  <>
                    <div className="upload-title">上传项目文档</div>
                    <div className="upload-subtitle">
                      支持PDF、DOC、DOCX等格式
                    </div>
                  </>
                )}
              </div>
              <input
                id="document-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={onDocumentUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* CAD文件上传区域 */}
          <div className="upload-section">
            <h3 className="upload-section-title">上传CAD文件</h3>
            <div
              className={`file-upload-area ${cadFile ? 'has-file' : ''}`}
              onDrop={onCadDrop}
              onDragOver={onDragOver}
              onClick={() => document.getElementById('cad-input')?.click()}
            >
              <div className="upload-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 16C4.79086 16 3 14.2091 3 12C3 9.79086 4.79086 8 7 8C7.27614 8 7.54291 8.02763 7.8 8.08C8.77805 5.74 11.2105 4 14 4C17.3137 4 20 6.68629 20 10C20 10.3431 19.9659 10.6772 19.9007 11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12L12 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 15L12 12L9 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="upload-text">
                {cadFile ? (
                  <>
                    <div className="upload-title">已选择文件</div>
                    <div className="upload-subtitle" title={cadFile.name}>
                      {truncateFileName(cadFile.name)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="upload-title">
                      上传CAD文件或广联达模型文件
                    </div>
                    <div className="upload-subtitle">
                      支持DWG、DWF、DXF等格式
                    </div>
                  </>
                )}
              </div>
              <input
                id="cad-input"
                type="file"
                accept=".dwg,.dwf,.dxf,.gbq,.gbd"
                onChange={onCadUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* 项目名称输入 */}
        <div className="project-name-section">
          <h3 className="upload-section-title">项目名称</h3>
          <input
            type="text"
            className="project-name-input"
            placeholder="请输入项目名称"
            value={projectName}
            onChange={onProjectNameChange}
          />
        </div>

        {/* 文件上传提示 */}
        <div className="file-upload-note">
          <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '10px' }}>
            <strong>注意：</strong> 必须同时上传文档文件和CAD文件才能创建项目
          </p>
        </div>

        {/* 两步骤按钮 */}
        <div className="create-project-section">
          {/* 步骤1: 预创建项目 */}
          {onPrecreateProject && (
            <button
              className="precreate-project-btn"
              onClick={onPrecreateProject}
              disabled={
                isCreatingProject || isPrecreating || isPolling || !!projectId
              }
            >
              {isPrecreating
                ? '预创建中...'
                : projectId
                  ? '已预创建'
                  : '1. 预创建项目'}
            </button>
          )}

          {/* 步骤2: 确认创建 */}
          <button
            className="create-project-btn"
            onClick={onCreateProject}
            disabled={
              isCreatingProject || isPrecreating || isPolling || !projectId || !documentFile || !cadFile
            }
          >
            {isCreatingProject
              ? '创建中...'
              : isPolling
                ? '项目处理中...'
                : '2. 确认创建项目'}
          </button>
        </div>
      </div>
    );
  }
);

FileUploadSection.displayName = 'FileUploadSection';

export default FileUploadSection;

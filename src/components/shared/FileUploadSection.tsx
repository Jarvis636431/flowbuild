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
  onDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCadUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onCadDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onProjectNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateProject: () => void;
  onPrecreateProject?: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = React.memo(
  ({
    documentFile,
    cadFile,
    projectName,
    isCreatingProject,
    onDocumentUpload,
    onCadUpload,
    onDocumentDrop,
    onCadDrop,
    onDragOver,
    onProjectNameChange,
    onCreateProject,
    onPrecreateProject,
  }) => {
    return (
      <div className="upload-container">
        <h2 className="upload-main-title">创建新项目</h2>

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

        {/* 确认按钮 */}
        <div className="create-project-section">
          {onPrecreateProject && (
            <button
              className="precreate-project-btn"
              onClick={onPrecreateProject}
              disabled={isCreatingProject || !projectName.trim()}
            >
              预创建项目
            </button>
          )}
          <button
            className="create-project-btn"
            onClick={onCreateProject}
            disabled={isCreatingProject || !projectName.trim()}
          >
            {isCreatingProject ? '创建中...' : '确认创建项目'}
          </button>
        </div>
      </div>
    );
  }
);

FileUploadSection.displayName = 'FileUploadSection';

export default FileUploadSection;

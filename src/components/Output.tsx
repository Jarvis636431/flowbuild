import React from 'react';
import './Output.css';

const Output: React.FC = () => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('上传的文件:', files[0]);
      // 这里可以处理文件上传逻辑
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('拖拽的文件:', files[0]);
      // 这里可以处理文件拖拽逻辑
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="output-panel">
      <div 
        className="file-upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="upload-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 16C4.79086 16 3 14.2091 3 12C3 9.79086 4.79086 8 7 8C7.27614 8 7.54291 8.02763 7.8 8.08C8.77805 5.74 11.2105 4 14 4C17.3137 4 20 6.68629 20 10C20 10.3431 19.9659 10.6772 19.9007 11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 12L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 15L12 12L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="upload-text">
          <div className="upload-title">上传CAD文件或者广联达模型文件</div>
          <div className="upload-subtitle">支持DWG、DWF等格式</div>
        </div>
        <input 
          id="file-input"
          type="file" 
          accept=".dwg,.dwf,.dxf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default Output;
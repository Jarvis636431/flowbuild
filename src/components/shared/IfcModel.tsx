import React from 'react';
import type { TaskItem } from '../../services/api';

interface IfcModelProps {
  tasks?: TaskItem[];
}

const IfcModel: React.FC<IfcModelProps> = React.memo(({ tasks }) => {
  return (
    <div className="ifc-model-container">
      <div className="ifc-model-header">
        <h3>IFC模型查看器</h3>
        <div className="model-controls">
          <button className="control-btn">重置视角</button>
          <button className="control-btn">全屏显示</button>
          <button className="control-btn">导出模型</button>
        </div>
      </div>
      
      <div className="ifc-viewer-wrapper">
        <div className="ifc-viewer">
          {/* IFC模型查看器区域 */}
          <div className="model-placeholder">
            <div className="placeholder-icon">
              📐
            </div>
            <h4>IFC模型查看器</h4>
            <p>在这里将显示建筑信息模型(BIM)</p>
            <div className="model-info">
              <div className="info-item">
                <span className="info-label">模型文件:</span>
                <span className="info-value">building_model.ifc</span>
              </div>
              <div className="info-item">
                <span className="info-label">文件大小:</span>
                <span className="info-value">25.6 MB</span>
              </div>
              <div className="info-item">
                <span className="info-label">元素数量:</span>
                <span className="info-value">1,247</span>
              </div>
              <div className="info-item">
                <span className="info-label">最后更新:</span>
                <span className="info-value">2024-01-15</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="model-sidebar">
          <div className="sidebar-section">
            <h4>模型树</h4>
            <div className="model-tree">
              <div className="tree-item">
                <span className="tree-icon">🏢</span>
                <span>建筑项目</span>
              </div>
              <div className="tree-item indent-1">
                <span className="tree-icon">🏗️</span>
                <span>结构系统</span>
              </div>
              <div className="tree-item indent-2">
                <span className="tree-icon">🧱</span>
                <span>墙体</span>
              </div>
              <div className="tree-item indent-2">
                <span className="tree-icon">🏗️</span>
                <span>梁柱</span>
              </div>
              <div className="tree-item indent-1">
                <span className="tree-icon">🔧</span>
                <span>机电系统</span>
              </div>
              <div className="tree-item indent-2">
                <span className="tree-icon">💡</span>
                <span>照明系统</span>
              </div>
              <div className="tree-item indent-2">
                <span className="tree-icon">🌡️</span>
                <span>暖通系统</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>属性面板</h4>
            <div className="properties-panel">
              <div className="property-item">
                <span className="property-label">名称:</span>
                <span className="property-value">外墙-001</span>
              </div>
              <div className="property-item">
                <span className="property-label">类型:</span>
                <span className="property-value">承重墙</span>
              </div>
              <div className="property-item">
                <span className="property-label">材料:</span>
                <span className="property-value">钢筋混凝土</span>
              </div>
              <div className="property-item">
                <span className="property-label">厚度:</span>
                <span className="property-value">200mm</span>
              </div>
              <div className="property-item">
                <span className="property-label">面积:</span>
                <span className="property-value">45.6 m²</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

IfcModel.displayName = 'IfcModel';

export default IfcModel;
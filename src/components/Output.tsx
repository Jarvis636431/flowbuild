import React from 'react';

const Output: React.FC = () => {
  return (
    <div className="output-panel">
      <h2>成果</h2>
      {/* 在这里放置对话产出的成果 */}
      <div className="output-content">
        <p>这是根据对话生成的成果。</p>
      </div>
    </div>
  );
};

export default Output;
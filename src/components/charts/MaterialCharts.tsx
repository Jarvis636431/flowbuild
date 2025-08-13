import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { TaskItem } from '../../services/api';
import { useChartData } from '../../hooks/useChartData';

interface MaterialChartsProps {
  tasks: TaskItem[];
}

const MaterialCharts: React.FC<MaterialChartsProps> = React.memo(
  ({ tasks }) => {
    // 使用 useChartData Hook 获取图表配置
    const { fundingChartOption, materialChartOption } = useChartData(tasks);

    return (
      <div className="material-mode">
        <div className="charts-container">
          <div className="chart-section">
            <div className="echarts-container">
              <ReactECharts
                option={fundingChartOption}
                style={{ height: '300px', width: '100%' }}
                theme="dark"
              />
            </div>
          </div>

          <div className="chart-section">
            <div className="echarts-container">
              <ReactECharts
                option={materialChartOption}
                style={{ height: '300px', width: '100%' }}
                theme="dark"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MaterialCharts.displayName = 'MaterialCharts';

export default MaterialCharts;

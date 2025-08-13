import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { TaskItem, CrewData, BudgetData } from '../../services/api';
import { chartAPI } from '../../services/api';
import { useChartData } from '../../hooks/useChartData';

interface MaterialChartsProps {
  tasks: TaskItem[];
  projectId?: string; // 添加项目ID参数
}

const MaterialCharts: React.FC<MaterialChartsProps> = React.memo(
  ({ tasks, projectId }) => {
    const [crewData, setCrewData] = useState<CrewData[]>([]);
    const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 获取图表数据
    useEffect(() => {
      if (!projectId) return;

      const fetchChartData = async () => {
        setLoading(true);
        setError(null);

        try {
          const [crewResult, budgetResult] = await Promise.all([
            chartAPI.getCrewData(projectId),
            chartAPI.getBudgetData(projectId),
          ]);

          setCrewData(crewResult);
          setBudgetData(budgetResult);
        } catch (err) {
          console.error('获取图表数据失败:', err);
          setError(err instanceof Error ? err.message : '获取图表数据失败');
        } finally {
          setLoading(false);
        }
      };

      fetchChartData();
    }, [projectId]);

    // 使用 useChartData Hook 获取图表配置
    const { fundingChartOption, materialChartOption } = useChartData(
      tasks,
      crewData,
      budgetData
    );

    if (loading) {
      return (
        <div className="material-mode">
          <div className="charts-container">
            <div
              style={{ textAlign: 'center', padding: '20px', color: '#888' }}
            >
              加载图表数据中...
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="material-mode">
          <div className="charts-container">
            <div
              style={{ textAlign: 'center', padding: '20px', color: '#ff6b6b' }}
            >
              图表数据加载失败: {error}
            </div>
          </div>
        </div>
      );
    }

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

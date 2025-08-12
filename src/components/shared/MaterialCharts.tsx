import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { TaskItem } from '../../services/api';

interface MaterialChartsProps {
  tasks: TaskItem[];
}

const MaterialCharts: React.FC<MaterialChartsProps> = React.memo(
  ({ tasks }) => {
    // 计算项目总天数
    const getTotalDays = useMemo(() => {
      if (tasks.length === 0) {
        return 18;
      }

      const allDays = tasks.flatMap((task) => [task.startDay, task.endDay]);
      const minDay = Math.min(...allDays);
      const maxDay = Math.max(...allDays);

      return maxDay - minDay + 1;
    }, [tasks]);

    // 计算资金投入趋势数据
    const calculateFundingTrend = useMemo(() => {
      const totalDays = getTotalDays;
      const dailyFunding: number[] = new Array(totalDays).fill(0);

      if (tasks.length === 0) {
        return new Array(totalDays).fill(0);
      }

      const allDays = tasks.flatMap((task) => [task.startDay, task.endDay]);
      const minDay = Math.min(...allDays);

      tasks.forEach((task) => {
        const startDay = task.startDay - minDay; // 转为0索引
        const duration = task.endDay - task.startDay + 1;
        const cost = task.cost || 0;
        const dailyCost = cost / duration;

        for (let i = 0; i < duration && startDay + i < totalDays; i++) {
          dailyFunding[startDay + i] += dailyCost;
        }
      });

      // 计算累积资金投入
      const cumulativeFunding: number[] = [];
      let total = 0;
      for (let i = 0; i < totalDays; i++) {
        total += dailyFunding[i];
        cumulativeFunding.push(total);
      }

      return cumulativeFunding;
    }, [tasks, getTotalDays]);

    // 计算物料消耗趋势数据
    const calculateMaterialTrend = useMemo(() => {
      const totalDays = getTotalDays;
      const dailyMaterial: number[] = new Array(totalDays).fill(0);

      if (tasks.length === 0) {
        return new Array(totalDays).fill(0);
      }

      const allDays = tasks.flatMap((task) => [task.startDay, task.endDay]);
      const minDay = Math.min(...allDays);

      tasks.forEach((task) => {
        const startDay = task.startDay - minDay; // 转为0索引
        const duration = task.endDay - task.startDay + 1;
        const workload = task.workload || 0;
        const dailyMaterialAmount = workload / duration;

        for (let i = 0; i < duration && startDay + i < totalDays; i++) {
          dailyMaterial[startDay + i] += dailyMaterialAmount;
        }
      });

      // 计算累积物料消耗
      const cumulativeMaterial: number[] = [];
      let total = 0;
      for (let i = 0; i < totalDays; i++) {
        total += dailyMaterial[i];
        cumulativeMaterial.push(total);
      }

      return cumulativeMaterial;
    }, [tasks, getTotalDays]);

    // 生成资金投入趋势图表配置
    const getFundingChartOption = useMemo(() => {
      const fundingData = calculateFundingTrend;
      const totalDays = getTotalDays;
      const xAxisData = Array.from(
        { length: totalDays },
        (_, i) => `第${i + 1}天`
      );

      return {
        title: {
          text: '资金投入趋势',
          left: 'center',
          textStyle: {
            color: '#fff',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: Array<{ name: string; value: number }>) => {
            const data = params[0];
            return `${data.name}<br/>累积投入: ${data.value.toFixed(2)}万元`;
          },
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '20%',
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: {
            color: '#888',
            interval: Math.floor(totalDays / 5) || 1,
          },
          axisLine: {
            lineStyle: {
              color: '#333',
            },
          },
        },
        yAxis: {
          type: 'value',
          name: '资金(万元)',
          nameTextStyle: {
            color: '#888',
          },
          axisLabel: {
            color: '#888',
            formatter: '{value}万',
          },
          axisLine: {
            lineStyle: {
              color: '#333',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#333',
              opacity: 0.3,
            },
          },
        },
        series: [
          {
            name: '累积资金投入',
            type: 'line',
            data: fundingData,
            smooth: true,
            lineStyle: {
              color: '#4CAF50',
              width: 2,
            },
            itemStyle: {
              color: '#4CAF50',
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(76, 175, 80, 0.3)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(76, 175, 80, 0.1)',
                  },
                ],
              },
            },
          },
        ],
      };
    }, [calculateFundingTrend, getTotalDays]);

    // 生成物料消耗趋势图表配置
    const getMaterialChartOption = useMemo(() => {
      const materialData = calculateMaterialTrend;
      const totalDays = getTotalDays;
      const xAxisData = Array.from(
        { length: totalDays },
        (_, i) => `第${i + 1}天`
      );

      return {
        title: {
          text: '物料消耗趋势',
          left: 'center',
          textStyle: {
            color: '#fff',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: Array<{ name: string; value: number }>) => {
            const data = params[0];
            return `${data.name}<br/>累积消耗: ${data.value.toFixed(2)}万立方米`;
          },
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '20%',
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: {
            color: '#888',
            interval: Math.floor(totalDays / 5) || 1,
          },
          axisLine: {
            lineStyle: {
              color: '#333',
            },
          },
        },
        yAxis: {
          type: 'value',
          name: '物料(吨)',
          nameTextStyle: {
            color: '#888',
          },
          axisLabel: {
            color: '#888',
            formatter: '{value}吨',
          },
          axisLine: {
            lineStyle: {
              color: '#333',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#333',
              opacity: 0.3,
            },
          },
        },
        series: [
          {
            name: '累积物料消耗',
            type: 'line',
            data: materialData,
            smooth: true,
            lineStyle: {
              color: '#FF9800',
              width: 2,
            },
            itemStyle: {
              color: '#FF9800',
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(255, 152, 0, 0.3)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(255, 152, 0, 0.1)',
                  },
                ],
              },
            },
          },
        ],
      };
    }, [calculateMaterialTrend, getTotalDays]);

    return (
      <div className="material-mode">
        <div className="charts-container">
          <div className="chart-section">
            <div className="echarts-container">
              <ReactECharts
                option={getFundingChartOption}
                style={{ height: '300px', width: '100%' }}
                theme="dark"
              />
            </div>
          </div>

          <div className="chart-section">
            <div className="echarts-container">
              <ReactECharts
                option={getMaterialChartOption}
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

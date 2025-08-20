import { useMemo } from 'react';
import type { TaskItem, CrewData, BudgetData } from '../services/api';

export interface UseChartDataReturn {
  totalDays: number;
  fundingChartOption: object;
  materialChartOption: object;
  tasksDayRange: { minDay: number; maxDay: number };
}

// 新的图表数据 Hook，用于处理 crew 和 budget 数据
interface SeriesItem {
  name: string;
  type: string;
  data: number[];
  smooth: boolean;
  lineStyle: {
    color: string;
    width: number;
  };
  itemStyle: {
    color: string;
  };
  areaStyle?: {
    color?: {
      type: string;
      x: number;
      y: number;
      x2: number;
      y2: number;
      colorStops: Array<{
        offset: number;
        color: string;
      }>;
    };
  };
}

export const useChartData = (
  tasks: TaskItem[],
  crewData?: CrewData[],
  budgetData?: BudgetData[]
): UseChartDataReturn => {
  // 自动计算任务数据的天数范围
  const tasksDayRange = useMemo(() => {
    if (tasks.length === 0) {
      return {
        minDay: 1,
        maxDay: 18,
      };
    }

    const allDays = tasks.flatMap((task) => [task.startTime.day, task.endTime.day]);
    const minDay = Math.min(...allDays);
    const maxDay = Math.max(...allDays);

    return { minDay, maxDay };
  }, [tasks]);

  // 计算项目总天数
  const totalDays = useMemo(() => {
    const { minDay, maxDay } = tasksDayRange;
    return maxDay - minDay + 1;
  }, [tasksDayRange]);

  // 生成资金投入趋势图表配置（使用 budget 数据）
  const fundingChartOption = useMemo(() => {
    const xAxisData = Array.from(
      { length: totalDays },
      (_, i) => `第${i + 1}天`
    );

    // 定义不同成本类型的颜色
    const costColors = {
      '人工成本': '#2196F3',
      '材料价格': '#FF9800', 
      '总成本': '#4CAF50'
    };

    let series: SeriesItem[] = [];
    
    // 如果有 budget 数据，为每个成本类型创建独立的折线
    if (budgetData && budgetData.length > 0) {
      series = budgetData.map((budget) => {
        const color = costColors[budget.name as keyof typeof costColors] || '#9E9E9E';
        const isTotalCost = budget.name === '总成本';
        return {
          name: budget.name,
          type: 'line',
          data: budget.data.slice(0, totalDays),
          smooth: true,
          lineStyle: {
            color: color,
            width: isTotalCost ? 3 : 2,
          },
          itemStyle: {
            color: color,
          },
          ...(isTotalCost && {
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
                    color: `${color}30`, // 30% opacity
                  },
                  {
                    offset: 1,
                    color: `${color}05`, // 5% opacity
                  },
                ],
              },
            },
          }),
        };
      });
    } else {
      // 使用默认的累积资金数据
      const dailyFunding: number[] = new Array(totalDays).fill(0);
      tasks.forEach((task) => {
        const startDay = task.startTime.day - 1;
    const duration = task.endTime.day - task.startTime.day + 1;
        const cost = task.cost || 0;
        const dailyCost = cost / duration;

        for (let i = 0; i < duration && startDay + i < totalDays; i++) {
          dailyFunding[startDay + i] += dailyCost;
        }
      });

      let total = 0;
      const chartData = dailyFunding.map((daily) => {
        total += daily;
        return total;
      });

      series = [{
        name: '累积资金投入',
        type: 'line',
        data: chartData,
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
                color: 'rgba(76, 175, 80, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(76, 175, 80, 0.05)',
              },
            ],
          },
        },
      }];
    }

    return {
      title: {
        text: '资金投入趋势',
        left: 'center',
        textStyle: {
          color: '#fff',
          fontSize: 16,
        },
      },
      legend: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; seriesName: string; value: number }>) => {
          if (!params || params.length === 0) return '';
          
          let result = `${params[0].name}<br/>`;
          params.forEach((param) => {
            result += `${param.seriesName}: ${param.value.toFixed(2)}<br/>`;
          });
          return result;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: budgetData && budgetData.length > 1 ? '25%' : '20%',
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
        name: '资金',
        nameTextStyle: {
          color: '#888',
        },
        axisLabel: {
          color: '#888',
          formatter: '{value}',
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
      series: series,
    };
  }, [budgetData, tasks, totalDays]);

  // 生成物料消耗趋势图表配置（使用 crew 数据）
  const materialChartOption = useMemo(() => {
    const xAxisData = Array.from(
      { length: totalDays },
      (_, i) => `第${i + 1}天`
    );

    // 如果有 crew 数据，为每个工种创建独立的折线
    let series: SeriesItem[] = [];
    if (crewData && crewData.length > 0) {
      // 为每个工种创建独立的折线
      series = crewData.map((crew, index) => {
        const colors = ['#8BC34A', '#9E9E9E', '#607D8B', '#795548', '#9C27B0', '#FF9800'];
        const color = colors[index % colors.length];
        
        return {
          name: crew.name,
          type: 'line',
          data: crew.data.slice(0, totalDays),
          smooth: true,
          lineStyle: {
            color: color,
            width: 1.5,
          },
          itemStyle: {
            color: color,
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
                  color: `${color}20`, // 20% opacity
                },
                {
                  offset: 1,
                  color: `${color}05`, // 5% opacity
                },
              ],
            },
          },
        };
      });

      // 添加总人数折线
      const totalData = new Array(totalDays).fill(0);
      crewData.forEach((crew) => {
        crew.data.slice(0, totalDays).forEach((count, dayIndex) => {
          totalData[dayIndex] += count;
        });
      });

      series.push({
        name: '总人数',
        type: 'line',
        data: totalData,
        smooth: true,
        lineStyle: {
          color: '#00BCD4',
          width: 3,
        },
        itemStyle: {
          color: '#00BCD4',
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
                color: 'rgba(0, 188, 212, 0.4)',
              },
              {
                offset: 1,
                color: 'rgba(0, 188, 212, 0.1)',
              },
            ],
          },
        },
      });
    } else {
      // 使用默认的累积物料数据
      const dailyMaterial: number[] = new Array(totalDays).fill(0);
      tasks.forEach((task) => {
        const startDay = task.startTime.day - 1;
    const duration = task.endTime.day - task.startTime.day + 1;
        const workload = task.workload || 0;
        const dailyMaterialAmount = workload / duration;

        for (let i = 0; i < duration && startDay + i < totalDays; i++) {
          dailyMaterial[startDay + i] += dailyMaterialAmount;
        }
      });

      let total = 0;
      const chartData = dailyMaterial.map((daily) => {
        total += daily;
        return total;
      });

      series = [
        {
          name: '总工作量',
          type: 'line',
          data: chartData,
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
      ];
    }

    return {
      title: {
        text: '人员配置趋势',
        left: 'center',
        textStyle: {
          color: '#fff',
          fontSize: 16,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
          let result = `${params[0].name}<br/>`;
          params.forEach((param) => {
            result += `${param.seriesName}: ${param.value}人<br/>`;
          });
          return result;
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
        name: '人数',
        nameTextStyle: {
          color: '#888',
        },
        axisLabel: {
          color: '#888',
          formatter: '{value}人',
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
      series: series,
    };
  }, [crewData, tasks, totalDays]);

  return {
    totalDays,
    fundingChartOption,
    materialChartOption,
    tasksDayRange,
  };
};

import * as XLSX from 'xlsx';
import type { Project, TaskItem } from './api';

// Excel列名映射到TaskItem字段
const COLUMN_MAPPING: Record<string, string> = {
  序号: 'serialNumber',
  施工工序: 'name',
  选定施工方式: 'constructionMethod',
  施工人数: 'workerCount',
  工种: 'workType',
  价格: 'cost',
  工程量: 'workload',
  工程量单位: 'unit',
  开始时间: 'startDay',
  结束时间: 'endDay',
  是否加班: 'isOvertime',
  直接依赖任务: 'dependencies',
};

/**
 * 解析时间字符串，提取天数
 * 例如："第1天 08:00" -> 1
 */
function parseTimeString(timeStr: string | number): number {
  if (!timeStr || timeStr === '') return 1;

  const str = String(timeStr);
  // 匹配'第X天'格式
  const dayMatch = str.match(/第(\d+)天/);
  if (dayMatch) {
    return parseInt(dayMatch[1]);
  }

  // 如果是纯数字
  const parsed = parseInt(str);
  return isNaN(parsed) ? 1 : parsed;
}

/**
 * 解析是否加班字段
 */
function parseOvertime(value: string | boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === '是' || value.toLowerCase() === 'true';
  }
  return false;
}

/**
 * 解析依赖工种字段
 */
function parseDependencies(value: string | null | undefined): string[] {
  if (!value || value === '无') return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((dep) => dep.trim())
      .filter((dep) => dep && dep !== '无');
  }
  return [];
}

/**
 * 从Excel文件读取项目数据
 */
export async function readProjectFromExcel(
  fileName: string
): Promise<Project | null> {
  try {
    // 在浏览器环境中，我们需要通过fetch来读取文件
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      throw new Error('Excel文件中没有工作表');
    }

    // 使用第一个工作表
    const worksheet = workbook.Sheets[sheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      throw new Error('Excel文件数据不足');
    }

    // 第一行是表头
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as string[][];

    // 转换数据为TaskItem格式
    const tasks: TaskItem[] = [];
    let taskId = 1;

    // 遍历每一行数据
    dataRows.forEach((row, rowIndex) => {
      const task: Partial<TaskItem> = {
        id: taskId++,
        projectId: 1, // 默认项目ID
      };

      // 遍历表头，映射字段
      headers.forEach((header, colIndex) => {
        const mappedField = COLUMN_MAPPING[header];
        if (
          mappedField &&
          row[colIndex] !== undefined &&
          row[colIndex] !== ''
        ) {
          const value = row[colIndex];

          // 根据字段类型进行数据转换
          switch (mappedField) {
            case 'startDay':
              task.startDay = parseTimeString(value);
              break;
            case 'endDay':
              task.endDay = parseTimeString(value);
              break;
            case 'isOvertime':
              task.isOvertime = parseOvertime(value);
              break;
            case 'dependencies':
              task.dependencies = parseDependencies(value);
              break;
            case 'serialNumber':
              task.serialNumber =
                typeof value === 'number'
                  ? value
                  : parseInt(String(value)) || 0;
              break;
            case 'workerCount':
              task.workerCount =
                typeof value === 'number'
                  ? value
                  : parseInt(String(value)) || 0;
              break;
            case 'workload':
              task.workload =
                typeof value === 'number'
                  ? value
                  : parseInt(String(value)) || 0;
              break;
            case 'cost':
              // 特殊处理价格字段，可能是数字或文本
              if (typeof value === 'number') {
                task.cost = value;
              } else if (
                typeof value === 'string' &&
                !isNaN(parseFloat(value))
              ) {
                task.cost = parseFloat(value);
              } else {
                // 如果价格是文本或空，设为0
                task.cost = 0;
              }
              break;
            case 'name':
              task.name = String(value);
              break;
            case 'constructionMethod':
              task.constructionMethod = String(value);
              break;
            case 'workType':
              task.workType = String(value);
              break;
            case 'unit':
              task.unit = String(value);
              break;
            default:
              // 对于其他字段，直接赋值
              (task as Record<string, unknown>)[mappedField] = value;
          }
        }
      });

      // 设置默认值
      if (!task.cost) task.cost = 0;
      if (!task.startDay) task.startDay = 1;
      if (!task.endDay) task.endDay = 1;
      if (!task.workerCount) task.workerCount = 0;
      if (!task.serialNumber) task.serialNumber = rowIndex + 1;
      if (!task.isOvertime) task.isOvertime = false;
      if (!task.dependencies) task.dependencies = [];

      // 只添加有名称的任务
      if (task.name && String(task.name).trim() !== '') {
        tasks.push(task as TaskItem);
      }
    });

    // 创建项目对象
    const project: Project = {
      id: 1,
      name: '项目进度表',
      description: '从Excel文件导入的项目数据',
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: tasks,
    };

    return project;
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return null;
  }
}

/**
 * 读取所有Excel文件并返回项目列表
 */
export async function readAllProjectsFromExcel(): Promise<Project[]> {
  try {
    // 目前只读取output.xlsx文件
    const project = await readProjectFromExcel('output.xlsx');
    return project ? [project] : [];
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return [];
  }
}

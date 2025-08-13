import axios from 'axios';
import { FEATURE_FLAGS } from '../config/features';

// 操作员服务配置
const OPERATOR_CONFIG = {
  BASE_URL_USER: 'http://101.43.150.234:8001',
  BASE_URL_OP: 'http://101.43.150.234:8002/operator',
  OP_USER: `operator_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  OP_PASS: 'operator123',
  OP_ROLE: 'operator',
  TIMEOUT: 60000,
};

// 文件路径映射
const FILE_MAPPINGS = {
  海: {
    ifc: '/海河玺9#楼/海河玺9#楼.ifc',
    steel: '/海河玺9#楼/钢筋汇总表_工序_工程量_价格.xls',
    summary: '/海河玺9#楼/清单汇总表_材料名称_工程量_价格.xls',
  },
  绿: {
    ifc: '/绿城石岗/石钢住宅土建.ifc',
    steel: '/绿城石岗/钢筋汇总表_工序_工程量_价格.xls',
    summary: '/绿城石岗/清单汇总表_材料名称_工程量_价格.xls',
  },
};

// 操作员服务接口
export interface OperatorServiceOptions {
  projectId: string;
  projectName: string;
}

export interface OperatorUploadResult {
  success: boolean;
  message: string;
  uploadedFiles?: string[];
  error?: string;
}

// HTTP客户端配置
const httpClient = axios.create({
  timeout: OPERATOR_CONFIG.TIMEOUT,
  validateStatus: (status) => status >= 200 && status < 300,
});

/**
 * 操作员服务类
 * 负责模拟操作员操作，包括注册、登录、文件上传等
 */
export class OperatorService {
  /**
   * 根据项目名称获取文件路径
   */
  private static getFilePathsByProjectName(projectName: string): {
    ifc: string;
    steel: string;
    summary: string;
  } | null {
    const firstChar = projectName.charAt(0);

    if (firstChar === '海') {
      return FILE_MAPPINGS.海;
    } else if (firstChar === '绿') {
      return FILE_MAPPINGS.绿;
    }

    return null;
  }

  /**
   * 注册操作员账户
   */
  private static async registerOperator(): Promise<void> {
    try {
      console.log('🔑 正在注册操作员用户:', OPERATOR_CONFIG.OP_USER);
      await httpClient.post(
        `${OPERATOR_CONFIG.BASE_URL_USER}/register`,
        {
          username: OPERATOR_CONFIG.OP_USER,
          password: OPERATOR_CONFIG.OP_PASS,
          role: OPERATOR_CONFIG.OP_ROLE,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      console.log('✅ 操作员注册成功:', OPERATOR_CONFIG.OP_USER);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      const status = axiosError?.response?.status;
      const message = axiosError?.response?.data;

      // 如果用户已存在，不视为错误
      if (
        status === 409 ||
        (typeof message === 'string' && /already exists|已存在/i.test(message))
      ) {
        console.log('ℹ️ 操作员用户已存在，继续后续流程');
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`操作员注册失败: ${errorMessage}`);
    }
  }

  /**
   * 登录操作员账户
   */
  private static async loginOperator(): Promise<string> {
    try {
      const response = await httpClient.post(
        `${OPERATOR_CONFIG.BASE_URL_USER}/login`,
        {
          username: OPERATOR_CONFIG.OP_USER,
          password: OPERATOR_CONFIG.OP_PASS,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const accessToken = response?.data?.access_token;
      if (!accessToken) {
        throw new Error('登录失败：未获取到访问令牌');
      }

      console.log('✅ 操作员登录成功');
      return accessToken;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`操作员登录失败: ${errorMessage}`);
    }
  }

  /**
   * 上传文件
   */
  private static async uploadFile(
    filePath: string,
    atype: string,
    projectId: string,
    accessToken: string,
    label: string
  ): Promise<void> {
    try {
      // 获取文件
      const fileResponse = await fetch(filePath);
      if (!fileResponse.ok) {
        throw new Error(`文件不存在或无法访问: ${filePath}`);
      }

      const fileBlob = await fileResponse.blob();
      const fileName = filePath.split('/').pop() || 'unknown';

      // 创建FormData
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('files', fileBlob, fileName);
      formData.append('atype', atype);

      console.log(`📤 正在上传 ${label}: ${fileName}`);

      const response = await httpClient.post(
        `${OPERATOR_CONFIG.BASE_URL_OP}/uploads`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`✅ ${label} 上传成功:`, response.data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`${label} 上传失败: ${errorMessage}`);
    }
  }

  /**
   * 执行操作员操作
   */
  static async executeOperatorActions(
    options: OperatorServiceOptions
  ): Promise<OperatorUploadResult> {
    const { projectId, projectName } = options;

    try {
      console.log('🚀 开始执行操作员操作...', { projectId, projectName });

      // 如果是模拟模式，直接返回成功
      if (!FEATURE_FLAGS.USE_REAL_API) {
        console.log('📝 模拟模式：跳过操作员操作');
        return {
          success: true,
          message: '模拟模式：操作员操作已完成',
          uploadedFiles: ['模拟IFC文件', '模拟钢筋文件', '模拟汇总文件'],
        };
      }

      // 根据项目名称获取文件路径
      const filePaths = OperatorService.getFilePathsByProjectName(projectName);
      if (!filePaths) {
        throw new Error(
          `不支持的项目名称: ${projectName}。项目名称必须以"海"或"绿"开头。`
        );
      }

      console.log('📁 选择的文件路径:', filePaths);

      // 步骤1: 注册操作员
      await OperatorService.registerOperator();

      // 步骤2: 登录操作员
      const accessToken = await OperatorService.loginOperator();

      // 步骤3: 上传文件
      const uploadedFiles: string[] = [];

      // 上传IFC文件
      await OperatorService.uploadFile(
        filePaths.ifc,
        'ifc',
        projectId,
        accessToken,
        'IFC文件'
      );
      uploadedFiles.push(filePaths.ifc);

      // 上传钢筋文件
      await OperatorService.uploadFile(
        filePaths.steel,
        'steel',
        projectId,
        accessToken,
        '钢筋文件'
      );
      uploadedFiles.push(filePaths.steel);

      // 上传汇总文件
      await OperatorService.uploadFile(
        filePaths.summary,
        'summary',
        projectId,
        accessToken,
        '汇总文件'
      );
      uploadedFiles.push(filePaths.summary);

      console.log('✅ 操作员操作全部完成');

      return {
        success: true,
        message: '操作员操作成功完成',
        uploadedFiles,
      };
    } catch (error: unknown) {
      console.error('❌ 操作员操作失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: '操作员操作失败',
        error: errorMessage,
      };
    }
  }

  /**
   * 异步执行操作员操作（不阻塞主流程）
   */
  static async executeOperatorActionsAsync(
    options: OperatorServiceOptions
  ): Promise<void> {
    // 在后台异步执行，不阻塞主流程
    setTimeout(async () => {
      try {
        const result = await this.executeOperatorActions(options);
        if (result.success) {
          console.log('🎉 后台操作员操作完成:', result.message);
        } else {
          console.error('💥 后台操作员操作失败:', result.error);
        }
      } catch (error) {
        console.error('💥 后台操作员操作异常:', error);
      }
    }, 1000); // 延迟1秒执行，确保轮询已经开始
  }
}

// 导出便捷的API
export const operatorAPI = {
  executeOperatorActions: OperatorService.executeOperatorActions,
  executeOperatorActionsAsync: OperatorService.executeOperatorActionsAsync,
};

import axios from 'axios';
import { FEATURE_FLAGS } from '../config/features';

// 操作员服务配置
const OPERATOR_CONFIG = {
  BASE_URL_USER: 'http://101.43.150.234:8001',
  BASE_URL_OP: 'http://101.43.150.234:8002/operator',
  OP_USER: `operator_${Date.now()}`,
  OP_PASS: 'operator123',
  OP_ROLE: 'operator',
  TIMEOUT: 60000,
};

// 文件路径映射 - 使用GitHub raw链接
const FILE_MAPPINGS = {
  海: {
    ifc: 'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E6%B5%B7%E6%B2%B3%E7%8E%BA9%23%E6%A5%BC.ifc',
    steel:
      'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E6%B5%B7%E6%B2%B3_%E9%92%A2%E7%AD%8B%E6%B1%87%E6%80%BB%E8%A1%A8_%E5%B7%A5%E5%BA%8F_%E5%B7%A5%E7%A8%8B%E9%87%8F_%E4%BB%B7%E6%A0%BC.xls',
    summary:
      'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E6%B5%B7%E6%B2%B3_%E6%B8%85%E5%8D%95%E6%B1%87%E6%80%BB%E8%A1%A8_%E6%9D%90%E6%96%99%E5%90%8D%E7%A7%B0_%E5%B7%A5%E7%A8%8B%E9%87%8F_%E4%BB%B7%E6%A0%BC.xls',
  },
  绿: {
    ifc: 'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E7%9F%B3%E9%92%A2%E4%BD%8F%E5%AE%85%E5%9C%9F%E5%BB%BA.ifc',
    steel:
      'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E9%92%A2%E7%AD%8B%E6%B1%87%E6%80%BB%E8%A1%A8_%E5%B7%A5%E5%BA%8F_%E5%B7%A5%E7%A8%8B%E9%87%8F_%E4%BB%B7%E6%A0%BC_%E7%BB%BF%E5%9F%8E0816.xls',
    summary:
      'https://raw.githubusercontent.com/orzorz1/public/refs/heads/main/%E7%BB%BF_%E6%B8%85%E5%8D%95%E6%B1%87%E6%80%BB%E8%A1%A8_%E6%9D%90%E6%96%99%E5%90%8D%E7%A7%B0_%E5%B7%A5%E7%A8%8B%E9%87%8F_%E4%BB%B7%E6%A0%BC.xls',
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


      return accessToken;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`操作员登录失败: ${errorMessage}`);
    }
  }

  /**
   * 完成任务
   */
  private static async finishTask(
    projectId: string,
    accessToken: string
  ): Promise<void> {
    try {


      const formData = new FormData();
      formData.append('project_id', projectId);

      await httpClient.post(
          `${OPERATOR_CONFIG.BASE_URL_OP}/finish`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              // 移除 Content-Type，让浏览器自动设置为 multipart/form-data
            },
          }
        );


    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`任务完成失败: ${errorMessage}`);
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


      // 从文件路径提取文件名
      const fileName = filePath.split('/').pop() || 'unknown';


      // 根据文件扩展名确定MIME类型
      let mimeType = 'application/octet-stream';
      if (fileName.endsWith('.ifc')) {
        mimeType = 'application/octet-stream';
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        mimeType = 'application/vnd.ms-excel';
      }

      let fileBlob: Blob;

      // 检查是否是GitHub URL
      if (filePath.startsWith('http')) {

        try {
          // 获取GitHub文件的实际内容
          fileBlob = await OperatorService.fetchFileContent(filePath);

        } catch {
 
          // 如果获取失败，创建包含文件路径信息的文本文件作为备用
          const fileContent = `文件路径: ${filePath}\n文件名: ${fileName}\n文件类型: ${atype}\n上传时间: ${new Date().toISOString()}\n获取失败，使用备用内容`;
          fileBlob = new Blob([fileContent], { type: mimeType });
        }
      } else {
        // 本地文件路径，创建包含文件路径信息的文本文件
        const fileContent = `文件路径: ${filePath}\n文件名: ${fileName}\n文件类型: ${atype}\n上传时间: ${new Date().toISOString()}`;
        fileBlob = new Blob([fileContent], { type: mimeType });
      }



      // 创建FormData
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('files', fileBlob, fileName);
      formData.append('atype', atype);



      await httpClient.post(
          `${OPERATOR_CONFIG.BASE_URL_OP}/uploads`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );


    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`${label} 上传失败: ${errorMessage}`);
    }
  }

  /**
   * 异步获取文件内容
   */
  static async fetchFileContent(fileUrl: string): Promise<Blob> {
    try {


      // 处理GitHub链接，将blob链接转换为raw链接
      let finalUrl = fileUrl;
      if (fileUrl.includes('github.com') && fileUrl.includes('/blob/')) {
        finalUrl = fileUrl.replace('/blob/', '/raw/');

      }



      const response = await httpClient.get(finalUrl, {
        responseType: 'blob',
        timeout: OPERATOR_CONFIG.TIMEOUT,
        maxRedirects: 10, // 增加重定向次数
        validateStatus: (status) => status >= 200 && status < 400, // 接受重定向状态码
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: '*/*',
        },
      });



      if (!response.data) {
        throw new Error('未获取到文件内容');
      }


      return response.data;
    } catch (error: unknown) {




      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`获取文件内容失败: ${errorMessage}`);
    }
  }

  /**
   * 异步获取项目所有文件
   */
  static async fetchProjectFiles(projectName: string): Promise<{
    ifc: Blob;
    steel: Blob;
    summary: Blob;
  }> {
    const filePaths = OperatorService.getFilePathsByProjectName(projectName);
    if (!filePaths) {
      throw new Error(`不支持的项目名称: ${projectName}`);
    }



    const [ifcBlob, steelBlob, summaryBlob] = await Promise.all([
      this.fetchFileContent(filePaths.ifc),
      this.fetchFileContent(filePaths.steel),
      this.fetchFileContent(filePaths.summary),
    ]);

    return {
      ifc: ifcBlob,
      steel: steelBlob,
      summary: summaryBlob,
    };
  }

  /**
   * 执行操作员操作
   */
  static async executeOperatorActions(
    options: OperatorServiceOptions
  ): Promise<OperatorUploadResult> {
    const { projectId, projectName } = options;

    try {


      // 如果是模拟模式，直接返回成功
      if (!FEATURE_FLAGS.USE_REAL_API) {
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

      // 步骤4: 完成任务
      await OperatorService.finishTask(projectId, accessToken);

      return {
        success: true,
        message: '操作员操作成功完成',
        uploadedFiles,
      };
    } catch (error: unknown) {
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
          // 操作成功
        } else {
          // 操作失败
        }
      } catch {
        // 操作异常
      }
    }, 1000); // 延迟1秒执行，确保轮询已经开始
  }
}

// 导出便捷的API
export const operatorAPI = {
  executeOperatorActions: OperatorService.executeOperatorActions,
  executeOperatorActionsAsync: OperatorService.executeOperatorActionsAsync,
  fetchFileContent: OperatorService.fetchFileContent,
  fetchProjectFiles: OperatorService.fetchProjectFiles,
};

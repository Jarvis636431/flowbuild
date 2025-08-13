#!/usr/bin/env node
/**
 * 上传接口测试脚本
 * 用于测试操作员文件上传功能
 *
 * 使用方法：
 * node scripts/test-upload.js [options]
 *
 * 选项：
 * --server <url>     服务器地址 (默认: http://101.43.150.234)
 * --project <id>     项目ID (默认: test_project_123)
 * --username <name>  用户名 (默认: test_operator_[timestamp])
 * --password <pass>  密码 (默认: test123456)
 * --file <path>      测试文件路径 (默认: 使用项目中的示例文件)
 * --type <type>      文件类型 ifc|steel|summary (默认: ifc)
 * --help             显示帮助信息
 *
 * 示例：
 * node scripts/test-upload.js --project my_project --type steel
 * node scripts/test-upload.js --file ./test.ifc --type ifc
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import axios from 'axios';
import FormData from 'form-data';

// 默认配置
const DEFAULT_CONFIG = {
  SERVER_BASE: 'http://101.43.150.234',
  USER_PORT: '8001',
  OPERATOR_PORT: '8002',
  PROJECT_ID: '6a20dde2-24c7-485d-99e2-76a4e5ab543a',
  USERNAME: `test_operator_${Date.now()}`,
  PASSWORD: 'test123456',
  TIMEOUT: 30000,
};

// 文件类型映射
const FILE_MAPPINGS = {
  ifc: {
    path: 'public/海河玺9#楼/海河玺9#楼.ifc',
    description: 'IFC建筑模型文件',
  },
  steel: {
    path: 'public/海河玺9#楼/钢筋汇总表_工序_工程量_价格.xls',
    description: '钢筋汇总表文件',
  },
  summary: {
    path: 'public/海河玺9#楼/清单汇总表_材料名称_工程量_价格.xls',
    description: '清单汇总表文件',
  },
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  let customFile = null;
  let fileType = 'ifc';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
        showHelp();
        process.exit(0);
        break;
      case '--server':
        config.SERVER_BASE = args[++i];
        break;
      case '--project':
        config.PROJECT_ID = args[++i];
        break;
      case '--username':
        config.USERNAME = args[++i];
        break;
      case '--password':
        config.PASSWORD = args[++i];
        break;
      case '--file':
        customFile = args[++i];
        break;
      case '--type':
        fileType = args[++i];
        if (!FILE_MAPPINGS[fileType]) {
          console.error(`❌ 不支持的文件类型: ${fileType}`);
          console.error('支持的类型: ifc, steel, summary');
          process.exit(1);
        }
        break;
      default:
        if (args[i].startsWith('--')) {
          console.error(`❌ 未知参数: ${args[i]}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  return { config, customFile, fileType };
}

// 显示帮助信息
function showHelp() {
  console.log(`
📋 上传接口测试脚本

使用方法:
  node scripts/test-upload.js [options]

选项:
  --server <url>     服务器地址 (默认: ${DEFAULT_CONFIG.SERVER_BASE})
  --project <id>     项目ID (默认: ${DEFAULT_CONFIG.PROJECT_ID})
  --username <name>  用户名 (默认: test_operator_[timestamp])
  --password <pass>  密码 (默认: ${DEFAULT_CONFIG.PASSWORD})
  --file <path>      测试文件路径 (默认: 使用项目中的示例文件)
  --type <type>      文件类型 ifc|steel|summary (默认: ifc)
  --help             显示帮助信息

示例:
  node scripts/test-upload.js --project my_project --type steel
  node scripts/test-upload.js --file ./test.ifc --type ifc
  node scripts/test-upload.js --server http://localhost:8000

文件类型说明:
  ifc     - IFC建筑模型文件
  steel   - 钢筋汇总表文件
  summary - 清单汇总表文件
`);
}

// HTTP客户端
class ApiClient {
  constructor(config) {
    this.config = config;
    this.userBaseUrl = `${config.SERVER_BASE}:${config.USER_PORT}`;
    this.operatorBaseUrl = `${config.SERVER_BASE}:${config.OPERATOR_PORT}/mgmt/operator`;

    this.client = axios.create({
      timeout: config.TIMEOUT,
      validateStatus: (status) => status >= 200 && status < 500, // 允许4xx错误以便分析
    });
  }

  // 注册用户
  async register() {
    console.log(`🔑 正在注册用户: ${this.config.USERNAME}`);

    try {
      const response = await this.client.post(
        `${this.userBaseUrl}/register`,
        {
          username: this.config.USERNAME,
          password: this.config.PASSWORD,
          role: 'operator',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ 用户注册成功');
        return true;
      } else if (response.status === 409) {
        console.log('ℹ️ 用户已存在，继续登录流程');
        return true;
      } else {
        console.error('❌ 注册失败:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ 注册请求失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      return false;
    }
  }

  // 登录获取token
  async login() {
    console.log(`🔐 正在登录用户: ${this.config.USERNAME}`);

    try {
      const response = await this.client.post(
        `${this.userBaseUrl}/login`,
        {
          username: this.config.USERNAME,
          password: this.config.PASSWORD,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 200) {
        const token = response.data?.access_token;
        if (token) {
          console.log('✅ 登录成功，获取到访问令牌');
          console.log(`🎫 Token: ${token.substring(0, 20)}...`);
          return token;
        } else {
          console.error('❌ 登录成功但未获取到token');
          console.error('响应数据:', response.data);
          return null;
        }
      } else {
        console.error('❌ 登录失败:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ 登录请求失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      return null;
    }
  }

  // 上传文件
  async uploadFile(token, filePath, fileType) {
    console.log(`📤 正在上传文件: ${filePath}`);
    console.log(`📋 文件类型: ${fileType}`);
    console.log(`🎯 项目ID: ${this.config.PROJECT_ID}`);

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 获取文件信息
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      console.log(`📊 文件信息:`);
      console.log(`   文件名: ${fileName}`);
      console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   修改时间: ${stats.mtime.toLocaleString()}`);

      // 创建FormData
      const formData = new FormData();
      formData.append('project_id', this.config.PROJECT_ID);
      formData.append('files', fs.createReadStream(filePath), fileName);
      formData.append('atype', fileType);

      console.log(`🚀 开始上传到: ${this.operatorBaseUrl}/uploads`);

      const response = await this.client.post(
        `${this.operatorBaseUrl}/uploads`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ 文件上传成功!');
        console.log('📋 服务器响应:', JSON.stringify(response.data, null, 2));
        return true;
      } else {
        console.error('❌ 文件上传失败:', response.status);
        console.error('📋 响应数据:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ 上传请求失败:', error.message);
      if (error.response) {
        console.error('📋 响应状态:', error.response.status);
        console.error('📋 响应头:', error.response.headers);
        console.error('📋 响应数据:', error.response.data);
      } else if (error.request) {
        console.error('📋 请求信息:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        });
      }
      return false;
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始上传接口测试\n');

  const { config, customFile, fileType } = parseArgs();

  // 显示配置信息
  console.log('⚙️ 测试配置:');
  console.log(`   服务器: ${config.SERVER_BASE}`);
  console.log(`   用户服务: ${config.SERVER_BASE}:${config.USER_PORT}`);
  console.log(`   操作员服务: ${config.SERVER_BASE}:${config.OPERATOR_PORT}`);
  console.log(`   项目ID: ${config.PROJECT_ID}`);
  console.log(`   用户名: ${config.USERNAME}`);
  console.log(`   文件类型: ${fileType}`);

  // 确定文件路径
  let filePath;
  if (customFile) {
    filePath = path.resolve(customFile);
    console.log(`   自定义文件: ${filePath}`);
  } else {
    filePath = path.resolve(FILE_MAPPINGS[fileType].path);
    console.log(`   默认文件: ${filePath}`);
    console.log(`   文件描述: ${FILE_MAPPINGS[fileType].description}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  const client = new ApiClient(config);

  try {
    // 步骤1: 注册用户
    const registerSuccess = await client.register();
    if (!registerSuccess) {
      console.error('💥 注册失败，终止测试');
      process.exit(1);
    }

    console.log('');

    // 步骤2: 登录获取token
    const token = await client.login();
    if (!token) {
      console.error('💥 登录失败，终止测试');
      process.exit(1);
    }

    console.log('');

    // 步骤3: 上传文件
    const uploadSuccess = await client.uploadFile(token, filePath, fileType);

    console.log('\n' + '='.repeat(50));

    if (uploadSuccess) {
      console.log('🎉 测试完成！所有步骤都成功执行');
      process.exit(0);
    } else {
      console.log('💥 测试失败！文件上传环节出现问题');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 测试过程中发生未预期的错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  console.error('💥 主函数执行失败:', error.message);
  process.exit(1);
});

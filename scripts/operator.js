#!/usr/bin/env node
/**
 * Node.js 版本的"注册 → 登录 → 上传文件"脚本
 * 用于模拟操作员操作，将项目状态从pending变为completed
 *
 * 使用方法：
 *   npm run operator:project <PROJECT_ID>
 *   或者：node --env-file=.env.operator scripts/operator.js <PROJECT_ID>
 *
 * 要求环境变量：
 *   BASE_URL_USER, BASE_URL_OP, OP_USER, OP_PASS, [OP_ROLE]
 *   [OP_FILE_IFC], [OP_FILE_STEEL], [OP_FILE_SUMMARY]
 *
 * PROJECT_ID 可以通过命令行参数传入或设置环境变量
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import axios from 'axios';
import FormData from 'form-data';

// 可选：从 .env 读取变量（没有就忽略）
try {
  const { config } = await import('dotenv');
  config();
} catch (_) {
  /* ignore if dotenv not installed */
}

// ===== 工具函数 =====
function requireEnv(name, hint) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    const extra = hint ? `，例如：${hint}` : '';
    throw new Error(`缺少环境变量 ${name}${extra}`);
  }
  return v.trim();
}

function fileNonEmpty(p) {
  return !!(p && fs.existsSync(p) && fs.statSync(p).size > 0);
}

function fail(msg, err) {
  if (msg) console.error(`❌ ${msg}`);
  if (err) {
    if (err.response) {
      // axios 错误包含响应体
      console.error(`HTTP ${err.response.status}`);
      try {
        console.error(JSON.stringify(err.response.data, null, 2));
      } catch {
        console.error(String(err.response.data));
      }
    } else {
      console.error(err.stack || String(err));
    }
  }
  process.exit(1);
}

// ===== 读取配置 =====
const BASE_URL_USER = requireEnv(
  'BASE_URL_USER',
  'https://api.example.com/user'
);
const BASE_URL_OP = requireEnv('BASE_URL_OP', 'https://api.example.com/op');

// PROJECT_ID 可以从命令行参数或环境变量获取
let PROJECT_ID = process.argv[2] || process.env.PROJECT_ID;
if (!PROJECT_ID || !PROJECT_ID.trim()) {
  throw new Error('缺少 PROJECT_ID，请通过命令行参数传入或设置环境变量');
}
PROJECT_ID = PROJECT_ID.trim();

const OP_USER = requireEnv('OP_USER');
const OP_PASS = requireEnv('OP_PASS');
const OP_ROLE = (process.env.OP_ROLE || 'operator').trim();

const OP_FILE_IFC = process.env.OP_FILE_IFC;
const OP_FILE_STEEL = process.env.OP_FILE_STEEL;
const OP_FILE_SUMMARY = process.env.OP_FILE_SUMMARY;

// axios 实例（可统一设置超时、Header 等）
const http = axios.create({
  timeout: 60_000,
  validateStatus: (s) => s >= 200 && s < 300, // 非 2xx 直接 throw
});

// ===== 主逻辑 =====
async function main() {
  console.log(`🚀 开始处理项目: ${PROJECT_ID}`);
  console.log('🪪 正在注册 operator...');

  // 注册：若已存在（常见是 409/已存在），不视为致命错误
  try {
    await http.post(
      `${BASE_URL_USER}/register`,
      { username: OP_USER, password: OP_PASS, role: OP_ROLE },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const code = err?.response?.status;
    const body = err?.response?.data;
    const msg = typeof body === 'string' ? body : JSON.stringify(body || {});
    if (code === 409 || /already exists|已存在/i.test(msg)) {
      console.log('ℹ️ 用户已存在，继续后续流程。');
    } else {
      fail('注册失败', err);
    }
  }

  console.log('🔐 正在登录 operator...');
  let accessToken = '';
  try {
    const res = await http.post(
      `${BASE_URL_USER}/login`,
      { username: OP_USER, password: OP_PASS },
      { headers: { 'Content-Type': 'application/json' } }
    );
    accessToken = res?.data?.access_token || '';
    if (!accessToken) {
      console.error('登录返回：', JSON.stringify(res.data, null, 2));
      throw new Error('登录失败（没有 access_token）');
    }
  } catch (err) {
    fail('登录失败', err);
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // 上传封装
  const uploadIfPresent = async (filepath, atype, label) => {
    if (!fileNonEmpty(filepath)) {
      console.log(`⏭️ 跳过：${filepath || '(未设置)'} 不存在或为空`);
      return;
    }
    console.log(`📤 正在上传 ${label}: ${filepath}`);

    const form = new FormData();
    form.append('project_id', PROJECT_ID);
    // form-data 会自动设置 multipart 边界
    form.append('files', fs.createReadStream(path.resolve(filepath)));
    form.append('atype', atype);

    try {
      const res = await http.post(`${BASE_URL_OP}/uploads`, form, {
        headers: { ...authHeader, ...form.getHeaders() },
      });
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      fail(`上传失败（${label}）`, err);
    }
  };

  // 依次上传
  await uploadIfPresent(OP_FILE_IFC, 'ifc', 'IFC 文件');
  await uploadIfPresent(OP_FILE_STEEL, 'steel', '钢筋文件');
  await uploadIfPresent(OP_FILE_SUMMARY, 'summary', '汇总文件');

  console.log('✅ 全部完成');
}

// 入口
main().catch((err) => fail('脚本异常', err));

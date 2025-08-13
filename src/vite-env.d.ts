/// <reference types="vite/client" />

// 扩展Window接口以支持自定义属性
declare global {
  interface Window {
    latestProjectData?: {
      id: string | number;
      name: string;
      description: string;
      createdAt: Date;
      updatedAt: Date;
      tasks?: any[];
      [key: string]: any;
    };
  }
}

export {};
/**
 * API配置文件
 * 管理不同环境下的API端点
 */

// 获取API基础URL
const getApiBaseUrl = (): string => {
  // 优先使用环境变量中的API URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 如果没有设置环境变量，根据环境选择默认值
  if (import.meta.env.PROD) {
    // 生产环境默认后端URL
    return 'https://ai-knowledge-aggregator-backend.onrender.com';
  }
  
  // 开发环境使用本地后端
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// 调试信息
console.log('🔧 API Configuration:', {
  NODE_ENV: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL
});

// API端点
export const API_ENDPOINTS = {
  // 博主管理
  CREATORS: `${API_BASE_URL}/api/creators`,
  
  // 内容管理
  CONTENT: `${API_BASE_URL}/api/content`,
  
  // 抓取功能
  SCRAPE: `${API_BASE_URL}/api/scrape`,
  
  // 推荐系统
  RECOMMENDATION: `${API_BASE_URL}/api/recommendation`,
  
  // 健康检查
  HEALTH: `${API_BASE_URL}/api/health`,
} as const;

export default API_ENDPOINTS;

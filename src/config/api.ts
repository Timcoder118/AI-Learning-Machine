/**
 * API配置文件
 * 管理不同环境下的API端点
 */

// 获取API基础URL
const getApiBaseUrl = (): string => {
  // 在生产环境中，从环境变量获取API URL
  if (import.meta.env.PROD) {
    // Vercel环境变量中的后端URL
    return import.meta.env.VITE_API_URL || 'https://ai-knowledge-aggregator-backend.onrender.com';
  }
  
  // 开发环境使用本地后端
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

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

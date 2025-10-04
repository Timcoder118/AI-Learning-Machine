// 配置文件
module.exports = {
  // 环境配置
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  
  // 数据库配置
  DB_PATH: './data/aggregator.db',
  
  // 抓取配置
  SCRAPE_INTERVAL: 3600000, // 1小时
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_DELAY: 2000, // 2秒延迟
  
  // 用户代理
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // 各平台配置
  PLATFORMS: {
    BILIBILI: {
      API_BASE: 'https://api.bilibili.com',
      SEARCH_BASE: 'https://search.bilibili.com',
      SPACE_BASE: 'https://space.bilibili.com'
    },
    YOUTUBE: {
      API_BASE: 'https://www.googleapis.com/youtube/v3',
      SEARCH_BASE: 'https://www.youtube.com'
    },
    WEIBO: {
      API_BASE: 'https://m.weibo.cn/api',
      SEARCH_BASE: 'https://s.weibo.com'
    },
    WECHAT: {
      SEARCH_BASE: 'https://weixin.sogou.com'
    }
  },
  
  // 请求头配置
  DEFAULT_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  
  // 错误重试配置
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffFactor: 2
  },
  
  // 内容过滤配置
  CONTENT_FILTER: {
    minTitleLength: 5,
    maxTitleLength: 200,
    keywords: ['AI', '人工智能', '机器学习', '深度学习', '算法', '技术', '编程', '开发'],
    excludeKeywords: ['广告', '推广', '营销', '销售']
  }
};

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

class BaseScraper {
  constructor(platform) {
    this.platform = platform;
    this.headers = config.DEFAULT_HEADERS;
    this.retryConfig = config.RETRY_CONFIG;
  }

  // 延迟函数
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 带重试的HTTP请求
  async request(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await axios({
          url,
          method: 'GET',
          headers: this.headers,
          timeout: 10000,
          ...options
        });
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
          console.log(`请求失败，${delay}ms后重试 (${attempt}/${this.retryConfig.maxRetries})`);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }

  // 使用Cheerio抓取HTML内容
  async scrape(url, options = {}) {
    try {
      const response = await this.request(url, options);
      return cheerio.load(response.data);
    } catch (error) {
      console.error('抓取失败:', error.message);
      throw error;
    }
  }

  // 使用Puppeteer抓取动态内容 - 已移除Puppeteer依赖
  async scrapeWithPuppeteer(url, options = {}) {
    // 临时使用普通HTTP请求代替Puppeteer
    console.log(`⚠️  Puppeteer已移除，使用普通HTTP请求代替: ${url}`);
    return await this.scrape(url);
  }

  // 内容过滤
  filterContent(content) {
    const filter = config.CONTENT_FILTER;
    
    // 检查标题长度
    if (content.title && (content.title.length < filter.minTitleLength || content.title.length > filter.maxTitleLength)) {
      return false;
    }
    
    // 检查关键词
    if (content.title || content.description) {
      const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
      
      // 必须包含至少一个关键词
      const hasKeyword = filter.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      // 不能包含排除关键词
      const hasExcludeKeyword = filter.excludeKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      return hasKeyword && !hasExcludeKeyword;
    }
    
    return true;
  }

  // 清理文本
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // 提取数字
  extractNumber(text) {
    if (!text) return 0;
    
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return new Date();
    
    // 处理相对时间
    if (timeStr.includes('分钟前')) {
      const minutes = parseInt(timeStr.match(/(\d+)/)?.[1] || '0');
      return new Date(Date.now() - minutes * 60 * 1000);
    }
    
    if (timeStr.includes('小时前')) {
      const hours = parseInt(timeStr.match(/(\d+)/)?.[1] || '0');
      return new Date(Date.now() - hours * 60 * 60 * 1000);
    }
    
    if (timeStr.includes('天前')) {
      const days = parseInt(timeStr.match(/(\d+)/)?.[1] || '0');
      return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    
    // 处理绝对时间
    try {
      return new Date(timeStr);
    } catch {
      return new Date();
    }
  }

  // 生成唯一ID
  generateId(platform, url) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(`${platform}-${url}`).digest('hex');
  }

  // 记录抓取日志
  async logScrape(creatorId, status, message, itemsCount = 0) {
    const { run } = require('./database');
    
    try {
      await run(
        'INSERT INTO scrape_logs (platform, creator_id, status, message, items_count) VALUES (?, ?, ?, ?, ?)',
        [this.platform, creatorId, status, message, itemsCount]
      );
    } catch (error) {
      console.error('记录抓取日志失败:', error.message);
    }
  }
}

module.exports = BaseScraper;

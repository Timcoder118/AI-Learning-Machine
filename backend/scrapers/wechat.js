const BaseScraper = require('../utils/scraper');
const config = require('../config');

class WeChatScraper extends BaseScraper {
  constructor() {
    super('wechat');
  }

  // 搜索微信公众号文章
  async searchArticles(keyword, limit = 20) {
    try {
      const url = `${config.PLATFORMS.WECHAT.SEARCH_BASE}/weixin?type=2&query=${encodeURIComponent(keyword)}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const articles = [];
      $('.results .result').slice(0, limit).each((index, element) => {
        const $item = $(element);
        const title = $item.find('.title').text().trim();
        const description = $item.find('.summary').text().trim();
        const author = $item.find('.author').text().trim();
        const time = $item.find('.time').text().trim();
        const link = $item.find('.title a').attr('href');
        const thumbnail = $item.find('img').attr('src');
        
        if (title && link) {
          const article = {
            id: this.generateId('wechat', link),
            title: this.cleanText(title),
            description: this.cleanText(description),
            url: link,
            thumbnail: thumbnail,
            platform: 'wechat',
            creatorId: null,
            creatorName: this.cleanText(author),
            contentType: 'article',
            publishTime: this.formatTime(time),
            readTime: Math.ceil(description.length / 500),
            tags: this.extractTags(title, description),
            isRead: false,
            isBookmarked: false,
            isRecommended: false,
            priority: this.calculatePriority(title, description),
            summary: this.generateSummary(description)
          };
          
          if (this.filterContent(article)) {
            articles.push(article);
          }
        }
      });
      
      return articles;
    } catch (error) {
      console.error('微信公众号搜索失败:', error.message);
      throw error;
    }
  }

  // 获取公众号最新文章（暂时禁用，专注微博和YouTube）
  async getAccountArticles(accountName, limit = 10) {
    console.log(`⚠️ 微信公众号抓取暂时禁用，专注微博和YouTube抓取`);
    return [];
  }

  // 获取公众号信息
  async getAccountInfo(accountName) {
    try {
      const url = `${config.PLATFORMS.WECHAT.SEARCH_BASE}/weixin?type=1&query=${encodeURIComponent(accountName)}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const $firstResult = $('.results .result').first();
      if ($firstResult.length === 0) {
        throw new Error('未找到该公众号');
      }
      
      const name = $firstResult.find('.title').text().trim();
      const description = $firstResult.find('.summary').text().trim();
      const avatar = $firstResult.find('img').attr('src');
      
      return {
        id: this.generateId('wechat', accountName),
        name: this.cleanText(name),
        avatar: avatar,
        description: this.cleanText(description),
        followers: 0, // 微信公众号无法获取粉丝数
        isActive: true,
        url: $firstResult.find('.title a').attr('href')
      };
    } catch (error) {
      console.error('获取微信公众号信息失败:', error.message);
      throw error;
    }
  }

  // 计算优先级
  calculatePriority(title, description) {
    let priority = 5;
    
    const text = `${title} ${description}`.toLowerCase();
    
    // 根据关键词调整优先级
    if (text.includes('ai') || text.includes('人工智能')) priority += 2;
    if (text.includes('机器学习') || text.includes('深度学习')) priority += 2;
    if (text.includes('教程') || text.includes('入门')) priority += 1;
    if (text.includes('技术') || text.includes('编程')) priority += 1;
    if (text.includes('最新') || text.includes('2024')) priority += 1;
    
    // 根据标题长度调整
    if (title.length > 20) priority += 1;
    
    return Math.min(priority, 10);
  }

  // 提取标签
  extractTags(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const tags = [];
    
    const keywordMap = {
      'ai': 'AI',
      '人工智能': 'AI',
      '机器学习': '机器学习',
      '深度学习': '深度学习',
      '算法': '算法',
      'python': 'Python',
      'tensorflow': 'TensorFlow',
      'pytorch': 'PyTorch',
      '数据分析': '数据分析',
      '计算机视觉': '计算机视觉',
      '自然语言处理': 'NLP',
      'nlp': 'NLP',
      '神经网络': '神经网络',
      '大模型': '大模型',
      'gpt': 'GPT',
      'chatgpt': 'ChatGPT',
      '编程': '编程',
      '开发': '开发',
      '技术': '技术',
      '教程': '教程',
      '新闻': '新闻',
      '观点': '观点',
      '行业': '行业',
      '趋势': '趋势'
    };
    
    Object.entries(keywordMap).forEach(([key, tag]) => {
      if (text.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5);
  }

  // 生成摘要
  generateSummary(description) {
    if (description.length <= 100) return description;
    
    return description.substring(0, 100) + '...';
  }

  // 获取真实的微信公众号文章链接（生产环境使用）
  async getRealWeChatArticleUrl(accountName, index) {
    try {
      // 方法1：使用微信公众号API（需要认证）
      if (process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET) {
        return await this.getWeChatApiArticleUrl(accountName, index);
      }
      
      // 方法2：网页抓取（需要遵守robots.txt）
      if (process.env.ENABLE_WEB_SCRAPING === 'true') {
        return await this.scrapeWeChatArticleUrl(accountName, index);
      }
      
      // 方法3：使用第三方聚合服务
      if (process.env.THIRD_PARTY_API_KEY) {
        return await this.getThirdPartyArticleUrl(accountName, index);
      }
      
      // 默认返回模拟链接
      console.warn('未配置真实抓取方式，使用模拟链接');
      return `#article-${accountName}-${index}`;
      
    } catch (error) {
      console.error('获取真实文章链接失败:', error);
      return `#article-${accountName}-${index}`;
    }
  }

  // 通过微信公众号API获取文章链接
  async getWeChatApiArticleUrl(accountName, index) {
    // 这里需要实现微信公众号API调用逻辑
    // 需要获取access_token，然后调用素材管理接口
    console.log(`通过API获取 ${accountName} 的第 ${index} 篇文章链接`);
    
    // 模拟API调用
    const mockUrls = [
      'https://mp.weixin.qq.com/s/real_article_1',
      'https://mp.weixin.qq.com/s/real_article_2',
      'https://mp.weixin.qq.com/s/real_article_3'
    ];
    
    return mockUrls[index % mockUrls.length];
  }

  // 通过网页抓取获取文章链接
  async scrapeWeChatArticleUrl(accountName, index) {
    // 这里需要实现网页抓取逻辑
    // 需要遵守robots.txt，控制请求频率
    console.log(`通过抓取获取 ${accountName} 的第 ${index} 篇文章链接`);
    
    // 模拟抓取结果
    const mockUrls = [
      'https://mp.weixin.qq.com/s/scraped_article_1',
      'https://mp.weixin.qq.com/s/scraped_article_2',
      'https://mp.weixin.qq.com/s/scraped_article_3'
    ];
    
    return mockUrls[index % mockUrls.length];
  }

  // 通过第三方服务获取文章链接
  async getThirdPartyArticleUrl(accountName, index) {
    // 这里需要实现第三方API调用逻辑
    console.log(`通过第三方服务获取 ${accountName} 的第 ${index} 篇文章链接`);
    
    // 模拟第三方API调用
    const mockUrls = [
      'https://mp.weixin.qq.com/s/third_party_article_1',
      'https://mp.weixin.qq.com/s/third_party_article_2',
      'https://mp.weixin.qq.com/s/third_party_article_3'
    ];
    
    return mockUrls[index % mockUrls.length];
  }
}

module.exports = WeChatScraper;

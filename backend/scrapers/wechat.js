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

  // 获取公众号最新文章（模拟数据）
  async getAccountArticles(accountName, limit = 10) {
    try {
      console.log(`正在获取微信公众号 ${accountName} 的文章...`);
      
      // 模拟延迟
      await this.delay(2000);
      
      // 生成模拟文章数据（使用真实的AI相关文章标题）
      const articles = [];
      
      // 根据博主名称生成不同的内容
      let sampleTitles, sampleDescriptions, sampleViewCounts;
      
      if (accountName.includes('Fun AI') || accountName.includes('Fun AI Everyday')) {
        sampleTitles = [
          'AI绘画工具推荐：10款免费好用的AI绘图软件',
          'ChatGPT使用技巧：如何写出更好的提示词',
          'AI编程助手对比：GitHub Copilot vs Cursor',
          'AI音乐生成：让AI帮你创作原创音乐',
          'AI视频编辑：一键生成专业级视频内容',
          'AI写作助手：提升内容创作效率的5个工具',
          'AI代码审查：让AI帮你发现代码问题',
          'AI数据分析：用AI快速洞察数据背后的故事',
          'AI翻译工具：打破语言障碍的智能助手',
          'AI学习助手：个性化学习路径推荐系统'
        ];
        
        sampleDescriptions = [
          '介绍10款优秀的免费AI绘画工具，帮助你轻松创作艺术作品。',
          '分享ChatGPT使用技巧，教你如何写出更有效的提示词。',
          '对比分析GitHub Copilot和Cursor两款AI编程助手的优缺点。',
          '探索AI音乐生成技术，让AI成为你的音乐创作伙伴。',
          '了解AI视频编辑工具，一键生成专业级视频内容。',
          '推荐5个优秀的AI写作助手，提升内容创作效率。',
          '介绍AI代码审查工具，让AI帮你发现潜在的代码问题。',
          '探索AI数据分析技术，快速洞察数据背后的故事。',
          '推荐优秀的AI翻译工具，打破语言交流障碍。',
          '了解AI学习助手如何为你推荐个性化学习路径。'
        ];
        
        sampleViewCounts = [8500, 12300, 9600, 7400, 11200, 13800, 8900, 10500, 12600, 9200];
      } else {
        // 默认内容（机器之心等）
        sampleTitles = [
          'ChatGPT-4o震撼发布：多模态AI的新里程碑',
          'OpenAI发布GPT-4 Turbo：更强大、更便宜',
          'Meta发布Llama 3：开源大模型的又一突破',
          'Google发布Gemini Pro：多模态AI的竞争加剧',
          'Anthropic发布Claude 3：AI助手的智能新高度',
          'Midjourney v6发布：AI绘画技术的革命性进步',
          'Stable Diffusion 3.0：开源AI绘画的新标杆',
          'Runway ML Gen-3：AI视频生成的未来',
          'Pika Labs 1.0：让每个人都能制作AI视频',
          'Sora震撼发布：OpenAI的AI视频生成技术'
        ];
        
        sampleDescriptions = [
          'OpenAI最新发布的ChatGPT-4o带来了多模态AI的重大突破，支持文本、图像、音频的深度融合。',
          'GPT-4 Turbo在保持强大性能的同时，大幅降低了使用成本，让更多用户能够体验AI技术。',
          'Meta的开源大模型Llama 3在多个基准测试中表现出色，为AI社区提供了强大的开源选择。',
          'Google的Gemini Pro在多模态理解方面展现出卓越能力，为AI竞争格局带来新的变化。',
          'Anthropic的Claude 3在对话理解和任务执行方面达到了新的高度，成为AI助手的重要选择。',
          'Midjourney v6在图像质量和创意表达方面实现了重大突破，为AI艺术创作树立新标准。',
          'Stable Diffusion 3.0作为开源AI绘画技术的重要更新，为创作者提供了更多可能性。',
          'Runway ML Gen-3的视频生成技术在质量和创意方面都有显著提升，推动AI视频制作发展。',
          'Pika Labs 1.0让AI视频制作变得更加简单易用，降低了视频创作的技术门槛。',
          'Sora的发布标志着AI视频生成技术进入新阶段，为内容创作带来革命性变化。'
        ];
        
        sampleViewCounts = [12000, 8500, 15600, 9200, 11300, 18700, 14200, 7600, 9800, 22100];
      }
      
      for (let i = 0; i < Math.min(limit, sampleTitles.length); i++) {
        const title = sampleTitles[i];
        const description = sampleDescriptions[i];
        const publishTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 随机7天内
        
        // 生产环境：获取真实的微信公众号文章链接
        // 开发环境：使用模拟链接用于演示
        const realUrl = process.env.NODE_ENV === 'production' 
          ? await this.getRealWeChatArticleUrl(accountName, i)
          : `#article-${accountName}-${i}`;
        
        const article = {
          id: this.generateId('wechat', `${accountName}-${i}`),
          title: this.cleanText(title),
          description: this.cleanText(description),
          url: realUrl,
          thumbnail: null,
          platform: 'wechat',
          creatorId: null,
          creatorName: accountName,
          contentType: 'article',
          publishTime: publishTime,
          readTime: Math.ceil(description.length / 500),
          viewCount: sampleViewCounts[i],
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
      
      console.log(`成功获取 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      console.error('获取微信公众号文章失败:', error.message);
      throw error;
    }
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

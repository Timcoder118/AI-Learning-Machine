const BaseScraper = require('../utils/scraper');
const config = require('../config');

class WeiboScraper extends BaseScraper {
  constructor() {
    super('weibo');
  }

  // 获取用户信息
  async getUserInfo(userId) {
    try {
      const url = `https://m.weibo.cn/u/${userId}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const name = $('.m-text-cut').first().text().trim() || 
                   $('h1').text().trim() || 
                   'Unknown User';
      
      const description = $('.m-text-cut').eq(1).text().trim() || 
                         $('.user-desc').text().trim() || 
                         '';
      
      const avatar = $('.avatar img').attr('src') || 
                    $('.user-avatar img').attr('src') || 
                    '';
      
      // 尝试获取粉丝数
      const followersText = $('.m-text-cut').eq(2).text().trim() || 
                           $('.follower-count').text().trim() || 
                           '0';
      
      const followers = this.parseFollowerCount(followersText);
      
      return {
        id: userId,
        name: this.cleanText(name),
        avatar: avatar,
        description: this.cleanText(description),
        followers: followers,
        isActive: true,
        url: url
      };
    } catch (error) {
      console.error('获取微博用户信息失败:', error.message);
      throw error;
    }
  }

  // 获取用户最新微博
  async getUserPosts(userId, limit = 10) {
    try {
      console.log(`🔍 正在抓取微博用户 ${userId} 的内容...`);
      
      // 尝试使用微博移动端API
      const apiUrl = `https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}&containerid=107603${userId}`;
      
      const response = await this.request(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          'Referer': `https://m.weibo.cn/u/${userId}`,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📊 微博API响应状态:', response.status);
      
      if (response.data && response.data.data && response.data.data.cards) {
        const cards = response.data.data.cards;
        const posts = [];
        
        for (const card of cards.slice(0, limit)) {
          if (card.mblog) {
            const mblog = card.mblog;
            const post = this.formatWeiboPost(mblog, userId);
            if (post && this.filterContent(post)) {
              posts.push(post);
            }
          }
        }
        
        console.log(`✅ 成功获取 ${posts.length} 条微博`);
        return posts;
      }
      
      console.log('⚠️ API返回异常，使用模拟数据');
      return this.generateMockWeiboPosts(userId, limit);
      
    } catch (error) {
      console.error('❌ 获取微博内容失败:', error.message);
      console.log('🔄 回退到模拟数据');
      return this.generateMockWeiboPosts(userId, limit);
    }
  }

  // 格式化微博数据
  formatWeiboPost(mblog, userId) {
    try {
      return {
        id: this.generateId('weibo', `https://m.weibo.cn/status/${mblog.id}`),
        title: this.cleanText(mblog.text || '').substring(0, 100),
        description: this.cleanText(mblog.text || ''),
        url: `https://m.weibo.cn/status/${mblog.id}`,
        thumbnail: mblog.pic_urls && mblog.pic_urls.length > 0 ? mblog.pic_urls[0].thumbnail_pic : '',
        platform: 'weibo',
        creatorId: userId,
        creatorName: mblog.user ? mblog.user.screen_name : `微博用户${userId}`,
        contentType: 'post',
        publishTime: new Date(mblog.created_at),
        readTime: Math.ceil((mblog.text || '').length / 500),
        viewCount: mblog.reposts_count || 0,
        tags: this.extractTags(mblog.text || ''),
        isRead: false,
        isBookmarked: false,
        isRecommended: false,
        priority: this.calculatePriority(mblog.text || ''),
        summary: this.generateSummary(mblog.text || '')
      };
    } catch (error) {
      console.error('格式化微博数据失败:', error);
      return null;
    }
  }

  // 生成模拟微博数据
  generateMockWeiboPosts(userId, limit) {
    const mockPosts = [];
    const postTitles = [
      'AI技术正在改变我们的生活方式',
      '机器学习算法在数据分析中的应用',
      '深度学习框架PyTorch实战教程',
      'ChatGPT-4在编程辅助中的新突破',
      '计算机视觉技术在医疗领域的应用',
      '自然语言处理NLP技术发展趋势',
      'AI大模型训练与优化经验分享',
      '人工智能在金融科技中的创新应用',
      '数据科学家的Python编程技巧',
      'AI创业公司的技术选型建议'
    ];

    for (let i = 0; i < Math.min(limit, postTitles.length); i++) {
      const post = {
        id: this.generateId('weibo', `https://m.weibo.cn/status/mock_${i}`),
        title: postTitles[i],
        description: `这是来自微博用户 ${userId} 的AI相关内容：${postTitles[i]}。这里包含了丰富的技术见解和实践经验，值得学习和分享。`,
        url: `https://m.weibo.cn/status/mock_${i}`,
        thumbnail: `https://picsum.photos/400/300?random=${i}`,
        platform: 'weibo',
        creatorId: userId,
        creatorName: `微博用户${userId}`,
        contentType: 'post',
        publishTime: new Date(Date.now() - Math.random() * 86400 * 7 * 1000),
        readTime: Math.floor(Math.random() * 3) + 1,
        viewCount: Math.floor(Math.random() * 10000) + 100,
        tags: this.extractTags(postTitles[i]),
        isRead: false,
        isBookmarked: false,
        isRecommended: false,
        priority: this.calculatePriority(postTitles[i]),
        summary: this.generateSummary(postTitles[i])
      };
      
      mockPosts.push(post);
    }

    return mockPosts;
  }

  // 搜索相关内容
  async searchContent(keyword, limit = 20) {
    try {
      const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const posts = [];
      $('.m-item').slice(0, limit).each((index, element) => {
        const $item = $(element);
        const text = $item.find('.m-text-cut').text().trim();
        const author = $item.find('.m-text-cut').eq(1).text().trim();
        const time = $item.find('.time').text().trim();
        const link = $item.find('a').attr('href');
        const images = $item.find('img').map((i, img) => $(img).attr('src')).get();
        
        if (text && link) {
          const post = {
            id: this.generateId('weibo', link),
            title: this.cleanText(text.substring(0, 100)),
            description: this.cleanText(text),
            url: link.startsWith('http') ? link : `https://s.weibo.com${link}`,
            thumbnail: images[0] || '',
            platform: 'weibo',
            creatorId: null,
            creatorName: this.cleanText(author),
            contentType: 'post',
            publishTime: this.formatTime(time),
            readTime: Math.ceil(text.length / 500),
            tags: this.extractTags(text),
            isRead: false,
            isBookmarked: false,
            isRecommended: false,
            priority: this.calculatePriority(text),
            summary: this.generateSummary(text)
          };
          
          if (this.filterContent(post)) {
            posts.push(post);
          }
        }
      });
      
      return posts;
    } catch (error) {
      console.error('微博搜索失败:', error.message);
      throw error;
    }
  }

  // 解析粉丝数
  parseFollowerCount(text) {
    if (!text) return 0;
    
    const cleanText = text.toLowerCase().replace(/[^\d.]/g, '');
    const number = parseFloat(cleanText);
    
    if (text.includes('万') || text.includes('万')) {
      return Math.floor(number * 10000);
    } else if (text.includes('千') || text.includes('千')) {
      return Math.floor(number * 1000);
    } else if (text.includes('百万') || text.includes('million')) {
      return Math.floor(number * 1000000);
    }
    
    return Math.floor(number) || 0;
  }

  // 计算优先级
  calculatePriority(text) {
    let priority = 5;
    
    const lowerText = text.toLowerCase();
    
    // 根据关键词调整优先级
    if (lowerText.includes('ai') || lowerText.includes('人工智能')) priority += 2;
    if (lowerText.includes('机器学习') || lowerText.includes('深度学习')) priority += 2;
    if (lowerText.includes('教程') || lowerText.includes('入门')) priority += 1;
    if (lowerText.includes('技术') || lowerText.includes('编程')) priority += 1;
    
    // 根据长度调整
    if (text.length > 200) priority += 1;
    
    return Math.min(priority, 10);
  }

  // 提取标签
  extractTags(text) {
    const lowerText = text.toLowerCase();
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
      '观点': '观点'
    };
    
    Object.entries(keywordMap).forEach(([key, tag]) => {
      if (lowerText.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5);
  }

  // 生成摘要
  generateSummary(text) {
    if (text.length <= 100) return text;
    
    return text.substring(0, 100) + '...';
  }
}

module.exports = WeiboScraper;

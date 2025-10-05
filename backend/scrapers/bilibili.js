const BaseScraper = require('../utils/scraper');
const config = require('../config');

class BilibiliScraper extends BaseScraper {
  constructor() {
    super('bilibili');
  }

  // 获取UP主信息
  async getUserInfo(userId) {
    try {
      const url = `${config.PLATFORMS.BILIBILI.API_BASE}/x/space/acc/info?mid=${userId}`;
      const response = await this.request(url);
      
      if (response.data.code === 0) {
        const data = response.data.data;
        return {
          id: data.mid,
          name: data.name,
          avatar: data.face,
          description: data.sign,
          followers: data.follower,
          isActive: true,
          url: `https://space.bilibili.com/${userId}`
        };
      }
      
      throw new Error(response.data.message || '获取用户信息失败');
    } catch (error) {
      console.error('获取Bilibili用户信息失败:', error.message);
      throw error;
    }
  }

  // 获取UP主最新视频
  async getUserVideos(userId, limit = 10) {
    try {
      console.log(`🔍 正在抓取Bilibili UP主 ${userId} 的视频...`);
      
      // 添加随机延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      // 使用Bilibili的公开API
      const url = `https://api.bilibili.com/x/space/arc/search?mid=${userId}&ps=${limit}&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`;
      
      const response = await this.request(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://space.bilibili.com/${userId}`,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Origin': 'https://space.bilibili.com'
        }
      });
      
      console.log(`📊 Bilibili API响应码: ${response.data.code}, 消息: ${response.data.message}`);
      
      // 处理不同的错误码
      if (response.data.code === -799) {
        console.log('⚠️ 请求过于频繁，等待后重试...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 添加重试计数器，避免无限递归
        const retryCount = this.retryCount || 0;
        if (retryCount >= 3) {
          console.log('❌ 重试次数过多，放弃抓取');
          return [];
        }
        
        this.retryCount = retryCount + 1;
        const result = await this.getUserVideos(userId, limit);
        this.retryCount = 0; // 重置计数器
        return result;
      }
      
      if (response.data.code === -404) {
        console.log('⚠️ UP主不存在或已被封禁');
        return [];
      }
      
      if (response.data.code === 0 && response.data.data && response.data.data.list) {
        const videos = response.data.data.list.vlist || [];
        console.log(`✅ 成功获取 ${videos.length} 个视频`);
        
        if (videos.length === 0) {
          console.log('⚠️ 该UP主暂无视频或视频不可见');
          return [];
        }
        
        // 验证视频链接有效性
        const validVideos = [];
        for (const video of videos) {
          if (video.bvid && video.title) {
            // 验证bvid格式
            if (video.bvid.match(/^BV[a-zA-Z0-9]{10}$/)) {
              validVideos.push(this.formatVideo(video, userId));
            } else {
              console.log(`⚠️ 无效的BV号: ${video.bvid}`);
            }
          }
        }
        
        console.log(`✅ 有效视频数量: ${validVideos.length}`);
        return validVideos;
      }
      
      console.log(`⚠️ API返回异常，错误码: ${response.data.code}, 消息: ${response.data.message}`);
      return [];
      
    } catch (error) {
      console.error('❌ 获取Bilibili视频失败:', error.message);
      
      // 如果是网络错误，尝试重试
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        console.log('🔄 网络错误，5秒后重试...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await this.getUserVideos(userId, limit);
      }
      
      return [];
    }
  }


  // 格式化视频数据
  formatVideo(video, userId) {
    return {
      id: this.generateId('bilibili', `https://www.bilibili.com/video/${video.bvid}`),
      title: this.cleanText(video.title),
      description: this.cleanText(video.description),
      url: `https://www.bilibili.com/video/${video.bvid}`,
      thumbnail: video.pic,
      platform: 'bilibili',
      creatorId: userId,
      creatorName: video.author,
      contentType: 'video',
      publishTime: new Date(video.created * 1000),
      readTime: Math.ceil(video.length / 60), // 秒转分钟
      tags: this.extractTags(video.title, video.description),
      isRead: false,
      isBookmarked: false,
      isRecommended: false,
      priority: this.calculatePriority(video),
      summary: this.generateSummary(video.title, video.description)
    };
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
      '教程': '教程'
    };
    
    Object.entries(keywordMap).forEach(([key, tag]) => {
      if (text.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5); // 最多5个标签
  }

  // 计算优先级
  calculatePriority(video) {
    let priority = 5; // 基础优先级
    
    // 根据播放量调整
    if (video.play > 100000) priority += 2;
    else if (video.play > 10000) priority += 1;
    
    // 根据点赞数调整
    if (video.video_review > 1000) priority += 1;
    
    // 根据标题关键词调整
    const title = video.title.toLowerCase();
    if (title.includes('ai') || title.includes('人工智能')) priority += 2;
    if (title.includes('教程') || title.includes('入门')) priority += 1;
    
    return Math.min(priority, 10); // 最高优先级为10
  }

  // 生成摘要
  generateSummary(title, description) {
    const text = `${title} ${description}`;
    if (text.length <= 100) return text;
    
    // 简单的摘要生成，取前100个字符
    return text.substring(0, 100) + '...';
  }

  // 搜索相关内容
  async searchContent(keyword, limit = 20) {
    try {
      const url = `${config.PLATFORMS.BILIBILI.SEARCH_BASE}/all/video?keyword=${encodeURIComponent(keyword)}&page=1`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const videos = [];
      $('.video-item').slice(0, limit).each((index, element) => {
        const $item = $(element);
        const title = $item.find('.title').text().trim();
        const author = $item.find('.up-name').text().trim();
        const playCount = $item.find('.play').text().trim();
        const duration = $item.find('.duration').text().trim();
        const link = $item.find('a').attr('href');
        
        if (title && link) {
          const video = {
            id: this.generateId('bilibili', link),
            title: this.cleanText(title),
            description: '',
            url: link.startsWith('http') ? link : `https:${link}`,
            thumbnail: $item.find('img').attr('src'),
            platform: 'bilibili',
            creatorId: null,
            creatorName: this.cleanText(author),
            contentType: 'video',
            publishTime: new Date(),
            readTime: this.parseDuration(duration),
            tags: this.extractTags(title, ''),
            isRead: false,
            isBookmarked: false,
            isRecommended: false,
            priority: this.calculateSearchPriority(playCount),
            summary: this.generateSummary(title, '')
          };
          
          if (this.filterContent(video)) {
            videos.push(video);
          }
        }
      });
      
      return videos;
    } catch (error) {
      console.error('Bilibili搜索失败:', error.message);
      throw error;
    }
  }

  // 解析时长
  parseDuration(duration) {
    if (!duration) return 0;
    
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
    }
    
    return 0;
  }

  // 计算搜索结果的优先级
  calculateSearchPriority(playCount) {
    let priority = 5;
    
    if (playCount.includes('万')) {
      const count = parseFloat(playCount.replace('万', ''));
      if (count > 10) priority += 2;
      else if (count > 1) priority += 1;
    } else if (playCount.includes('千')) {
      const count = parseFloat(playCount.replace('千', ''));
      if (count > 5) priority += 1;
    }
    
    return priority;
  }
}

module.exports = BilibiliScraper;

const BaseScraper = require('../utils/scraper');
const config = require('../config');

class YouTubeScraper extends BaseScraper {
  constructor() {
    super('youtube');
  }

  // 获取频道信息
  async getChannelInfo(channelId) {
    try {
      // 使用网页抓取获取频道信息
      const url = `https://www.youtube.com/channel/${channelId}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const name = $('meta[property="og:title"]').attr('content') || 
                   $('h1').text().trim() || 
                   'Unknown Channel';
      
      const description = $('meta[property="og:description"]').attr('content') || 
                         $('.channel-description').text().trim() || 
                         '';
      
      const avatar = $('meta[property="og:image"]').attr('content') || 
                    $('.channel-avatar img').attr('src') || 
                    '';
      
      // 尝试获取订阅者数量
      const subscribersText = $('.subscriber-count').text().trim() || 
                             $('[aria-label*="subscriber"]').attr('aria-label') || 
                             '0';
      
      const subscribers = this.parseSubscriberCount(subscribersText);
      
      return {
        id: channelId,
        name: this.cleanText(name),
        avatar: avatar,
        description: this.cleanText(description),
        followers: subscribers,
        isActive: true,
        url: url
      };
    } catch (error) {
      console.error('获取YouTube频道信息失败:', error.message);
      throw error;
    }
  }

  // 获取频道最新视频
  async getChannelVideos(channelId, limit = 10) {
    try {
      const url = `https://www.youtube.com/channel/${channelId}/videos`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const videos = [];
      $('.ytd-grid-video-renderer').slice(0, limit).each((index, element) => {
        const $item = $(element);
        const title = $item.find('#video-title').text().trim();
        const link = $item.find('#video-title').attr('href');
        const thumbnail = $item.find('img').attr('src');
        const duration = $item.find('.ytd-thumbnail-overlay-time-status-renderer').text().trim();
        const views = $item.find('#metadata-line span:first-child').text().trim();
        const publishTime = $item.find('#metadata-line span:last-child').text().trim();
        
        if (title && link) {
          const video = {
            id: this.generateId('youtube', `https://www.youtube.com${link}`),
            title: this.cleanText(title),
            description: '',
            url: `https://www.youtube.com${link}`,
            thumbnail: thumbnail,
            platform: 'youtube',
            creatorId: channelId,
            creatorName: '', // 需要单独获取
            contentType: 'video',
            publishTime: this.formatTime(publishTime),
            readTime: this.parseDuration(duration),
            tags: this.extractTags(title, ''),
            isRead: false,
            isBookmarked: false,
            isRecommended: false,
            priority: this.calculatePriority(views),
            summary: this.generateSummary(title, '')
          };
          
          if (this.filterContent(video)) {
            videos.push(video);
          }
        }
      });
      
      return videos;
    } catch (error) {
      console.error('获取YouTube视频失败:', error.message);
      throw error;
    }
  }

  // 搜索相关内容
  async searchContent(keyword, limit = 20) {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
      const $ = await this.scrapeWithPuppeteer(url);
      
      const videos = [];
      $('.ytd-video-renderer').slice(0, limit).each((index, element) => {
        const $item = $(element);
        const title = $item.find('#video-title').text().trim();
        const link = $item.find('#video-title').attr('href');
        const thumbnail = $item.find('img').attr('src');
        const channel = $item.find('#channel-name a').text().trim();
        const views = $item.find('#metadata-line span:first-child').text().trim();
        const publishTime = $item.find('#metadata-line span:last-child').text().trim();
        
        if (title && link) {
          const video = {
            id: this.generateId('youtube', `https://www.youtube.com${link}`),
            title: this.cleanText(title),
            description: '',
            url: `https://www.youtube.com${link}`,
            thumbnail: thumbnail,
            platform: 'youtube',
            creatorId: null,
            creatorName: this.cleanText(channel),
            contentType: 'video',
            publishTime: this.formatTime(publishTime),
            readTime: 0,
            tags: this.extractTags(title, ''),
            isRead: false,
            isBookmarked: false,
            isRecommended: false,
            priority: this.calculatePriority(views),
            summary: this.generateSummary(title, '')
          };
          
          if (this.filterContent(video)) {
            videos.push(video);
          }
        }
      });
      
      return videos;
    } catch (error) {
      console.error('YouTube搜索失败:', error.message);
      throw error;
    }
  }

  // 解析订阅者数量
  parseSubscriberCount(text) {
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

  // 计算优先级
  calculatePriority(views) {
    let priority = 5;
    
    if (views.includes('万') || views.includes('万')) {
      const count = parseFloat(views.replace(/[^\d.]/g, ''));
      if (count > 10) priority += 2;
      else if (count > 1) priority += 1;
    } else if (views.includes('千') || views.includes('千')) {
      const count = parseFloat(views.replace(/[^\d.]/g, ''));
      if (count > 5) priority += 1;
    } else if (views.includes('million')) {
      const count = parseFloat(views.replace(/[^\d.]/g, ''));
      if (count > 1) priority += 2;
    }
    
    return priority;
  }

  // 提取标签
  extractTags(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const tags = [];
    
    const keywordMap = {
      'ai': 'AI',
      'artificial intelligence': 'AI',
      'machine learning': '机器学习',
      'deep learning': '深度学习',
      'algorithm': '算法',
      'python': 'Python',
      'tensorflow': 'TensorFlow',
      'pytorch': 'PyTorch',
      'data science': '数据科学',
      'computer vision': '计算机视觉',
      'nlp': 'NLP',
      'neural network': '神经网络',
      'tutorial': '教程',
      'programming': '编程',
      'development': '开发',
      'technology': '技术'
    };
    
    Object.entries(keywordMap).forEach(([key, tag]) => {
      if (text.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5);
  }

  // 生成摘要
  generateSummary(title, description) {
    const text = `${title} ${description}`;
    if (text.length <= 100) return text;
    
    return text.substring(0, 100) + '...';
  }
}

module.exports = YouTubeScraper;

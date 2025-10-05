const BaseScraper = require('../utils/scraper');
const config = require('../config');

class YouTubeScraper extends BaseScraper {
  constructor() {
    super('youtube');
  }

  // 获取频道信息
  async getChannelInfo(channelId) {
    try {
      // 使用YouTube Data API v3
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API Key未配置');
      }

      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
      
      console.log(`🔍 正在获取YouTube频道 ${channelId} 的信息...`);
      
      const response = await this.request(url);
      
      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        const snippet = channel.snippet;
        const statistics = channel.statistics;
        
        return {
          id: channelId,
          name: snippet.title,
          avatar: snippet.thumbnails?.default?.url || snippet.thumbnails?.medium?.url,
          description: snippet.description,
          followers: parseInt(statistics.subscriberCount) || 0,
          isActive: true,
          url: `https://www.youtube.com/channel/${channelId}`
        };
      }
      
      throw new Error('频道不存在或不可访问');
    } catch (error) {
      console.error('获取YouTube频道信息失败:', error.message);
      throw error;
    }
  }

  // 获取频道最新视频
  async getChannelVideos(channelId, limit = 10) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        console.error('❌ YouTube API Key未配置');
        console.log('💡 请在环境变量中设置 YOUTUBE_API_KEY');
        return [];
      }

      console.log(`🔍 正在抓取YouTube频道 ${channelId} 的视频...`);
      
      // 首先获取频道信息
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
      const channelResponse = await this.request(channelUrl);
      
      console.log(`📊 YouTube频道API响应:`, channelResponse.data);
      
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        console.log('⚠️ 频道不存在或不可访问');
        return [];
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
      console.log(`📋 上传列表ID: ${uploadsPlaylistId}`);
      
      // 获取上传列表中的视频
      const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${limit}&key=${apiKey}`;
      
      const response = await this.request(videosUrl);
      
      console.log(`📊 YouTube视频列表API响应:`, response.data);
      
      if (response.data.items && response.data.items.length > 0) {
        const videos = [];
        
        console.log(`📹 找到 ${response.data.items.length} 个视频，开始获取详细信息...`);
        
        // 获取每个视频的详细信息
        for (const item of response.data.items) {
          const videoId = item.snippet.resourceId.videoId;
          console.log(`🔍 获取视频详情: ${videoId}`);
          
          const videoDetails = await this.getVideoDetails(videoId);
          
          if (videoDetails) {
            videos.push(videoDetails);
          }
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ 成功获取 ${videos.length} 个视频`);
        return videos;
      }
      
      console.log('⚠️ 该频道暂无视频');
      return [];
      
    } catch (error) {
      console.error('❌ 获取YouTube视频失败:', error.message);
      
      // 处理API错误
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          console.error('API错误详情:', errorData.error);
          
          if (errorData.error.code === 403) {
            console.log('💡 可能的原因: API配额不足或API Key无效');
          } else if (errorData.error.code === 404) {
            console.log('💡 频道不存在或已被删除');
          }
        }
      }
      
      return [];
    }
  }

  // 获取视频详细信息
  async getVideoDetails(videoId) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
      
      const response = await this.request(url);
      
      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        const snippet = video.snippet;
        const statistics = video.statistics;
        const contentDetails = video.contentDetails;
        
        return {
          id: this.generateId('youtube', `https://www.youtube.com/watch?v=${videoId}`),
          title: this.cleanText(snippet.title),
          description: this.cleanText(snippet.description),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          platform: 'youtube',
          creatorId: snippet.channelId,
          creatorName: snippet.channelTitle,
          contentType: 'video',
          publishTime: new Date(snippet.publishedAt),
          readTime: this.parseDuration(contentDetails.duration),
          viewCount: parseInt(statistics.viewCount) || 0,
          tags: this.extractTags(snippet.title, snippet.description, snippet.tags),
          isRead: false,
          isBookmarked: false,
          isRecommended: false,
          priority: this.calculatePriority(snippet.title, statistics),
          summary: this.generateSummary(snippet.description)
        };
      }
      
      return null;
    } catch (error) {
      console.error('获取视频详情失败:', error.message);
      return null;
    }
  }

  // 搜索相关内容
  async searchContent(keyword, limit = 20) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API Key未配置');
      }

      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=${limit}&key=${apiKey}`;
      
      console.log(`🔍 正在搜索YouTube关键词: ${keyword}`);
      
      const response = await this.request(url);
      
      if (response.data.items && response.data.items.length > 0) {
        const videos = [];
        
        for (const item of response.data.items) {
          const videoId = item.id.videoId;
          const videoDetails = await this.getVideoDetails(videoId);
          
          if (videoDetails && this.filterContent(videoDetails)) {
            videos.push(videoDetails);
          }
        }
        
        console.log(`✅ 搜索到 ${videos.length} 个相关视频`);
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('YouTube搜索失败:', error.message);
      throw error;
    }
  }

  // 解析时长
  parseDuration(duration) {
    if (!duration) return 0;
    
    // ISO 8601 duration format: PT4M13S (4分13秒)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 60 + minutes + seconds / 60;
  }

  // 计算优先级
  calculatePriority(title, statistics) {
    let priority = 5;
    
    const lowerTitle = title.toLowerCase();
    
    // 根据关键词调整优先级
    if (lowerTitle.includes('ai') || lowerTitle.includes('人工智能')) priority += 2;
    if (lowerTitle.includes('machine learning') || lowerTitle.includes('深度学习')) priority += 2;
    if (lowerTitle.includes('tutorial') || lowerTitle.includes('教程')) priority += 1;
    if (lowerTitle.includes('programming') || lowerTitle.includes('编程')) priority += 1;
    
    // 根据观看量调整
    const viewCount = parseInt(statistics.viewCount) || 0;
    if (viewCount > 1000000) priority += 2;
    else if (viewCount > 100000) priority += 1;
    
    // 根据点赞数调整
    const likeCount = parseInt(statistics.likeCount) || 0;
    if (likeCount > 10000) priority += 1;
    
    return Math.min(priority, 10);
  }

  // 提取标签
  extractTags(title, description, videoTags = []) {
    const text = `${title} ${description}`.toLowerCase();
    const tags = [];
    
    // 使用视频自带的标签
    if (videoTags && videoTags.length > 0) {
      const relevantTags = videoTags.filter(tag => {
        const lowerTag = tag.toLowerCase();
        return lowerTag.includes('ai') || 
               lowerTag.includes('machine learning') || 
               lowerTag.includes('programming') ||
               lowerTag.includes('tutorial') ||
               lowerTag.includes('technology');
      });
      tags.push(...relevantTags.slice(0, 3));
    }
    
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
      'natural language processing': 'NLP',
      'nlp': 'NLP',
      'neural network': '神经网络',
      'large model': '大模型',
      'gpt': 'GPT',
      'chatgpt': 'ChatGPT',
      'programming': '编程',
      'development': '开发',
      'technology': '技术',
      'tutorial': '教程'
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
    if (!description || description.length <= 100) return description || '';
    
    return description.substring(0, 100) + '...';
  }
}

module.exports = YouTubeScraper;
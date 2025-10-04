const { query, run, get } = require('./database');

/**
 * 智能推荐算法
 */
class RecommendationEngine {
  constructor() {
    // 用户偏好配置
    this.userPreferences = {
      categories: {
        'AI大模型前沿技术': { weight: 0.4, tags: ['GPT', '大模型', 'LLM', 'Transformer', '多模态'] },
        'AI行业终端应用': { weight: 0.35, tags: ['应用', '软件', '硬件', '产品', '工具', '系统'] },
        'AI变现': { weight: 0.25, tags: ['变现', '商业', '创业', '投资', '商业模式', '盈利'] }
      },
      
      // 评分因子权重
      scoringFactors: {
        contentPriority: 0.15,      // 内容优先级
        publishFreshness: 0.20,     // 发布时间新鲜度
        platformPreference: 0.15,   // 平台偏好
        contentType: 0.10,          // 内容类型
        userBehavior: 0.15,         // 用户行为
        tagRelevance: 0.15,         // 标签相关性
        popularity: 0.10            // 流行度（浏览量等）
      }
    };
  }

  /**
   * 获取用户推荐内容
   */
  async getRecommendations(userId = 'default', limit = 10) {
    try {
      // 1. 获取用户偏好
      const userPrefs = await this.getUserPreferences(userId);
      
      // 2. 获取所有内容
      const allContent = await query(`
        SELECT c.*, cr.name as creator_name
        FROM content c
        LEFT JOIN creators cr ON c.creator_id = cr.id
        WHERE c.is_recommended = 0 OR c.is_recommended IS NULL
        ORDER BY c.created_at DESC
      `);

      // 3. 计算推荐分数
      const scoredContent = [];
      for (const content of allContent) {
        const score = await this.calculateRecommendationScore(content, userPrefs, userId);
        scoredContent.push({
          ...content,
          recommendation_score: score.total,
          score_breakdown: score.breakdown
        });
      }

      // 4. 按分数排序并返回
      scoredContent.sort((a, b) => b.recommendation_score - a.recommendation_score);
      
      // 5. 保存评分到数据库
      await this.saveContentScores(scoredContent.slice(0, limit), userId);

      return scoredContent.slice(0, limit);
    } catch (error) {
      console.error('获取推荐内容失败:', error);
      throw error;
    }
  }

  /**
   * 计算推荐分数
   */
  async calculateRecommendationScore(content, userPrefs, userId) {
    const breakdown = {};
    let totalScore = 0;

    // 1. 内容优先级 (15%)
    breakdown.contentPriority = this.calculatePriorityScore(content);
    totalScore += breakdown.contentPriority * this.userPreferences.scoringFactors.contentPriority;

    // 2. 发布时间新鲜度 (20%)
    breakdown.publishFreshness = this.calculateFreshnessScore(content);
    totalScore += breakdown.publishFreshness * this.userPreferences.scoringFactors.publishFreshness;

    // 3. 平台偏好 (15%)
    breakdown.platformPreference = this.calculatePlatformScore(content, userPrefs);
    totalScore += breakdown.platformPreference * this.userPreferences.scoringFactors.platformPreference;

    // 4. 内容类型 (10%)
    breakdown.contentType = this.calculateContentTypeScore(content, userPrefs);
    totalScore += breakdown.contentType * this.userPreferences.scoringFactors.contentType;

    // 5. 用户行为 (15%)
    breakdown.userBehavior = await this.calculateUserBehaviorScore(content, userId);
    totalScore += breakdown.userBehavior * this.userPreferences.scoringFactors.userBehavior;

    // 6. 标签相关性 (15%)
    breakdown.tagRelevance = await this.calculateTagRelevanceScore(content, userId);
    totalScore += breakdown.tagRelevance * this.userPreferences.scoringFactors.tagRelevance;

    // 7. 流行度 (10%)
    breakdown.popularity = this.calculatePopularityScore(content);
    totalScore += breakdown.popularity * this.userPreferences.scoringFactors.popularity;

    return {
      total: Math.round(totalScore * 100) / 100,
      breakdown
    };
  }

  /**
   * 计算内容优先级分数
   */
  calculatePriorityScore(content) {
    // 基于内容优先级和分类偏好
    let score = content.priority || 5;
    
    // 根据分类偏好调整
    const title = (content.title || '').toLowerCase();
    const description = (content.description || '').toLowerCase();
    
    // AI大模型前沿技术
    if (this.containsKeywords(title + ' ' + description, this.userPreferences.categories['AI大模型前沿技术'].tags)) {
      score *= 1.4; // 权重0.4
    }
    // AI行业终端应用
    else if (this.containsKeywords(title + ' ' + description, this.userPreferences.categories['AI行业终端应用'].tags)) {
      score *= 1.35; // 权重0.35
    }
    // AI变现
    else if (this.containsKeywords(title + ' ' + description, this.userPreferences.categories['AI变现'].tags)) {
      score *= 1.25; // 权重0.25
    }

    return Math.min(score, 10); // 最高10分
  }

  /**
   * 计算发布时间新鲜度分数
   */
  calculateFreshnessScore(content) {
    const publishTime = new Date(content.publish_time);
    const now = new Date();
    const hoursDiff = (now - publishTime) / (1000 * 60 * 60);

    // 时间越新分数越高
    if (hoursDiff < 24) return 10;      // 24小时内
    if (hoursDiff < 72) return 8;       // 3天内
    if (hoursDiff < 168) return 6;      // 1周内
    if (hoursDiff < 720) return 4;      // 1月内
    return 2;                           // 更早
  }

  /**
   * 计算平台偏好分数
   */
  calculatePlatformScore(content, userPrefs) {
    const platformPrefs = userPrefs.platform_preference || {};
    const platform = content.platform || 'wechat';
    
    return platformPrefs[platform] || 5; // 默认5分
  }

  /**
   * 计算内容类型分数
   */
  calculateContentTypeScore(content, userPrefs) {
    const contentTypePrefs = userPrefs.content_type_preference || {};
    const contentType = content.content_type || 'article';
    
    return contentTypePrefs[contentType] || 5; // 默认5分
  }

  /**
   * 计算用户行为分数
   */
  async calculateUserBehaviorScore(content, userId) {
    try {
      // 获取用户对该内容的交互历史
      const behaviors = await query(`
        SELECT action_type, action_value, COUNT(*) as count
        FROM user_behavior
        WHERE user_id = ? AND content_id = ?
        GROUP BY action_type
      `, [userId, content.id]);

      let score = 5; // 基础分数

      behaviors.forEach(behavior => {
        switch (behavior.action_type) {
          case 'read':
            score += behavior.action_value * 2; // 阅读权重
            break;
          case 'bookmark':
            score += behavior.action_value * 3; // 收藏权重更高
            break;
          case 'like':
            score += behavior.action_value * 2.5;
            break;
          case 'share':
            score += behavior.action_value * 3.5; // 分享权重最高
            break;
          case 'time_spent':
            // 基于阅读时间调整
            if (behavior.action_value > 300) score += 2; // 超过5分钟
            else if (behavior.action_value > 60) score += 1; // 超过1分钟
            break;
        }
      });

      return Math.min(score, 10);
    } catch (error) {
      console.error('计算用户行为分数失败:', error);
      return 5;
    }
  }

  /**
   * 计算标签相关性分数
   */
  async calculateTagRelevanceScore(content, userId) {
    try {
      const contentTags = JSON.parse(content.tags || '[]');
      let score = 5; // 基础分数

      // 获取用户标签权重
      for (const tag of contentTags) {
        const tagWeight = await get(`
          SELECT weight FROM tag_weights 
          WHERE user_id = ? AND tag_name = ?
        `, [userId, tag]);

        if (tagWeight) {
          score += tagWeight.weight;
        }
      }

      return Math.min(score, 10);
    } catch (error) {
      console.error('计算标签相关性分数失败:', error);
      return 5;
    }
  }

  /**
   * 计算流行度分数
   */
  calculatePopularityScore(content) {
    const viewCount = content.view_count || 0;
    
    // 基于浏览量计算流行度
    if (viewCount > 10000) return 10;      // 1万+
    if (viewCount > 5000) return 8;        // 5千+
    if (viewCount > 1000) return 6;        // 1千+
    if (viewCount > 100) return 4;         // 100+
    return 2;                              // 更少
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(userId) {
    try {
      const prefs = {};
      
      // 从数据库获取用户偏好
      const dbPrefs = await query(`
        SELECT key, value FROM user_preferences 
        WHERE key LIKE ?
      `, [`${userId}_%`]);

      dbPrefs.forEach(pref => {
        const key = pref.key.replace(`${userId}_`, '');
        try {
          prefs[key] = JSON.parse(pref.value);
        } catch {
          prefs[key] = pref.value;
        }
      });

      return prefs;
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      return {};
    }
  }

  /**
   * 记录用户行为
   */
  async recordUserBehavior(userId, contentId, actionType, actionValue = 1) {
    try {
      await run(`
        INSERT INTO user_behavior (user_id, content_id, action_type, action_value)
        VALUES (?, ?, ?, ?)
      `, [userId, contentId, actionType, actionValue]);

      // 更新标签权重
      await this.updateTagWeights(userId, contentId, actionType, actionValue);

      console.log(`记录用户行为: ${userId} - ${actionType} - ${contentId}`);
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  }

  /**
   * 更新标签权重
   */
  async updateTagWeights(userId, contentId, actionType, actionValue) {
    try {
      // 获取内容标签
      const content = await get('SELECT tags FROM content WHERE id = ?', [contentId]);
      if (!content) return;

      const tags = JSON.parse(content.tags || '[]');
      
      // 根据行为类型调整权重增量
      let weightIncrement = 0;
      switch (actionType) {
        case 'read':
          weightIncrement = 0.1;
          break;
        case 'bookmark':
          weightIncrement = 0.2;
          break;
        case 'like':
          weightIncrement = 0.15;
          break;
        case 'share':
          weightIncrement = 0.25;
          break;
        default:
          weightIncrement = 0.05;
      }

      // 更新每个标签的权重
      for (const tag of tags) {
        await run(`
          INSERT OR REPLACE INTO tag_weights (user_id, tag_name, weight, interaction_count, last_updated)
          VALUES (?, ?, 
            COALESCE((SELECT weight FROM tag_weights WHERE user_id = ? AND tag_name = ?), 1.0) + ?,
            COALESCE((SELECT interaction_count FROM tag_weights WHERE user_id = ? AND tag_name = ?), 0) + 1,
            CURRENT_TIMESTAMP
          )
        `, [userId, tag, userId, tag, weightIncrement, userId, tag]);
      }
    } catch (error) {
      console.error('更新标签权重失败:', error);
    }
  }

  /**
   * 保存内容评分
   */
  async saveContentScores(scoredContent, userId) {
    try {
      for (const content of scoredContent) {
        await run(`
          INSERT OR REPLACE INTO content_scores 
          (content_id, user_id, base_score, personal_score, final_score, factors)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          content.id,
          userId,
          content.recommendation_score,
          content.recommendation_score,
          content.recommendation_score,
          JSON.stringify(content.score_breakdown)
        ]);
      }
    } catch (error) {
      console.error('保存内容评分失败:', error);
    }
  }

  /**
   * 设置用户偏好
   */
  async setUserPreference(userId, key, value) {
    try {
      await run(`
        INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [`${userId}_${key}`, JSON.stringify(value)]);
    } catch (error) {
      console.error('设置用户偏好失败:', error);
    }
  }

  /**
   * 检查关键词匹配
   */
  containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * 获取推荐统计
   */
  async getRecommendationStats(userId = 'default') {
    try {
      const stats = await get(`
        SELECT 
          COUNT(*) as total_recommended,
          AVG(final_score) as avg_score,
          MAX(final_score) as max_score,
          MIN(final_score) as min_score
        FROM content_scores 
        WHERE user_id = ?
      `, [userId]);

      const readRate = await get(`
        SELECT 
          COUNT(DISTINCT CASE WHEN c.is_read = 1 THEN c.id END) * 100.0 / COUNT(DISTINCT c.id) as read_rate
        FROM content_scores cs
        JOIN content c ON cs.content_id = c.id
        WHERE cs.user_id = ?
      `, [userId]);

      const popularTags = await query(`
        SELECT tag_name, weight, interaction_count
        FROM tag_weights 
        WHERE user_id = ?
        ORDER BY weight DESC, interaction_count DESC
        LIMIT 5
      `, [userId]);

      return {
        totalRecommended: stats.total_recommended || 0,
        avgScore: Math.round((stats.avg_score || 0) * 100) / 100,
        maxScore: stats.max_score || 0,
        minScore: stats.min_score || 0,
        readRate: Math.round((readRate.read_rate || 0) * 100) / 100,
        popularTags: popularTags.length
      };
    } catch (error) {
      console.error('获取推荐统计失败:', error);
      return {
        totalRecommended: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        readRate: 0,
        popularTags: 0
      };
    }
  }
}

module.exports = RecommendationEngine;

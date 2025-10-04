const express = require('express');
const router = express.Router();
const RecommendationEngine = require('../utils/recommendation');
const { run, get, query } = require('../utils/database');

const recommendationEngine = new RecommendationEngine();

/**
 * 获取推荐内容
 */
router.get('/', async (req, res) => {
  try {
    const { userId = 'default', limit = 10 } = req.query;
    
    const recommendations = await recommendationEngine.getRecommendations(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        items: recommendations,
        total: recommendations.length,
        userId
      }
    });
  } catch (error) {
    console.error('获取推荐内容失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 记录用户行为
 */
router.post('/behavior', async (req, res) => {
  try {
    const { userId = 'default', contentId, actionType, actionValue = 1 } = req.body;
    
    if (!contentId || !actionType) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    await recommendationEngine.recordUserBehavior(userId, contentId, actionType, actionValue);
    
    res.json({
      success: true,
      message: '用户行为记录成功'
    });
  } catch (error) {
    console.error('记录用户行为失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 设置用户偏好
 */
router.post('/preferences', async (req, res) => {
  try {
    const { userId = 'default', preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: '缺少偏好设置'
      });
    }

    // 设置各种偏好
    for (const [key, value] of Object.entries(preferences)) {
      await recommendationEngine.setUserPreference(userId, key, value);
    }
    
    res.json({
      success: true,
      message: '用户偏好设置成功'
    });
  } catch (error) {
    console.error('设置用户偏好失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取用户偏好
 */
router.get('/preferences', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    const preferences = await recommendationEngine.getUserPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取推荐统计
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    const stats = await recommendationEngine.getRecommendationStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取推荐统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 刷新推荐
 */
router.post('/refresh', async (req, res) => {
  try {
    const { userId = 'default', limit = 10 } = req.body;
    
    // 清除旧的推荐评分
    await run('DELETE FROM content_scores WHERE user_id = ?', [userId]);
    
    // 重新生成推荐
    const recommendations = await recommendationEngine.getRecommendations(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        items: recommendations,
        total: recommendations.length,
        message: '推荐已刷新'
      }
    });
  } catch (error) {
    console.error('刷新推荐失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取推荐算法说明
 */
router.get('/algorithm', (req, res) => {
  const algorithmInfo = {
    scoringFactors: {
      contentPriority: {
        weight: 15,
        description: '内容优先级',
        details: '基于内容分类偏好和优先级计算，AI大模型前沿技术权重40%，AI行业终端应用权重35%，AI变现权重25%'
      },
      publishFreshness: {
        weight: 20,
        description: '发布时间新鲜度',
        details: '时间越新分数越高，24小时内满分，随时间递减'
      },
      platformPreference: {
        weight: 15,
        description: '平台偏好',
        details: '基于用户对不同平台的使用习惯'
      },
      contentType: {
        weight: 10,
        description: '内容类型',
        details: '基于用户对不同内容类型的偏好'
      },
      userBehavior: {
        weight: 15,
        description: '用户行为',
        details: '基于用户的阅读、收藏、分享等行为历史'
      },
      tagRelevance: {
        weight: 15,
        description: '标签相关性',
        details: '基于用户标签偏好和互动历史计算'
      },
      popularity: {
        weight: 10,
        description: '流行度',
        details: '基于浏览量、互动数据等指标'
      }
    },
    personalizationStrategies: [
      '未读内容优先推荐',
      '收藏内容加权推荐',
      '基于标签偏好学习',
      '平台使用习惯分析',
      '阅读时间模式识别',
      '用户反馈实时调整'
    ],
    categories: {
      'AI大模型前沿技术': {
        weight: 40,
        tags: ['GPT', '大模型', 'LLM', 'Transformer', '多模态', '深度学习', '神经网络']
      },
      'AI行业终端应用': {
        weight: 35,
        tags: ['应用', '软件', '硬件', '产品', '工具', '系统', '解决方案']
      },
      'AI变现': {
        weight: 25,
        tags: ['变现', '商业', '创业', '投资', '商业模式', '盈利', '市场']
      }
    }
  };

  res.json({
    success: true,
    data: algorithmInfo
  });
});

module.exports = router;

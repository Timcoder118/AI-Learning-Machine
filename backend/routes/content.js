const express = require('express');
const router = express.Router();
const { query, run, get } = require('../utils/database');

// 获取所有内容
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, platform, contentType, isRead, isBookmarked } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (platform) {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }
    
    if (contentType) {
      whereClause += ' AND content_type = ?';
      params.push(contentType);
    }
    
    if (isRead !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(isRead === 'true');
    }
    
    if (isBookmarked !== undefined) {
      whereClause += ' AND is_bookmarked = ?';
      params.push(isBookmarked === 'true');
    }
    
    const sql = `
      SELECT * FROM content 
      ${whereClause}
      ORDER BY priority DESC, publish_time DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `SELECT COUNT(*) as total FROM content ${whereClause}`;
    
    const [content, countResult] = await Promise.all([
      query(sql, [...params, parseInt(limit), offset]),
      query(countSql, params)
    ]);
    
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: {
        items: content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个内容
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await get('SELECT * FROM content WHERE id = ?', [id]);
    
    if (!content) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('获取内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 切换已读状态
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先获取当前状态
    const content = await get('SELECT is_read FROM content WHERE id = ?', [id]);
    
    if (!content) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    // 切换状态
    const newReadStatus = !content.is_read;
    const result = await run(
      'UPDATE content SET is_read = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [newReadStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: newReadStatus ? '标记为已读成功' : '标记为未读成功',
      data: { is_read: newReadStatus }
    });
  } catch (error) {
    console.error('切换已读状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 切换收藏状态
router.patch('/:id/bookmark', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await get('SELECT is_bookmarked FROM content WHERE id = ?', [id]);
    
    if (!content) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    const newBookmarkStatus = !content.is_bookmarked;
    const result = await run(
      'UPDATE content SET is_bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [newBookmarkStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: newBookmarkStatus ? '收藏成功' : '取消收藏成功',
      data: { is_bookmarked: newBookmarkStatus }
    });
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索内容
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { limit = 20 } = req.query;
    
    const sql = `
      SELECT * FROM content 
      WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
      ORDER BY priority DESC, publish_time DESC 
      LIMIT ?
    `;
    
    const searchTerm = `%${keyword}%`;
    const content = await query(sql, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);
    
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('搜索内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_bookmarked = 1 THEN 1 ELSE 0 END) as bookmarked_count,
        SUM(CASE WHEN is_recommended = 1 THEN 1 ELSE 0 END) as recommended_count,
        platform,
        content_type
      FROM content 
      GROUP BY platform, content_type
    `);
    
    // 按平台分组
    const platformStats = {};
    const typeStats = {};
    
    stats.forEach(stat => {
      if (!platformStats[stat.platform]) {
        platformStats[stat.platform] = {
          total: 0,
          read: 0,
          bookmarked: 0,
          recommended: 0
        };
      }
      
      if (!typeStats[stat.content_type]) {
        typeStats[stat.content_type] = {
          total: 0,
          read: 0,
          bookmarked: 0,
          recommended: 0
        };
      }
      
      platformStats[stat.platform].total += stat.total;
      platformStats[stat.platform].read += stat.read_count;
      platformStats[stat.platform].bookmarked += stat.bookmarked_count;
      platformStats[stat.platform].recommended += stat.recommended_count;
      
      typeStats[stat.content_type].total += stat.total;
      typeStats[stat.content_type].read += stat.read_count;
      typeStats[stat.content_type].bookmarked += stat.bookmarked_count;
      typeStats[stat.content_type].recommended += stat.recommended_count;
    });
    
    res.json({ 
      success: true, 
      data: {
        platformStats,
        typeStats
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记内容为已读/未读
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await get('SELECT is_read FROM content WHERE id = ?', [id]);
    
    if (!content) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    const newReadStatus = !content.is_read;
    const result = await run(
      'UPDATE content SET is_read = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [newReadStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: newReadStatus ? '标记为已读' : '标记为未读',
      data: { is_read: newReadStatus }
    });
  } catch (error) {
    console.error('标记已读状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 切换收藏状态
router.patch('/:id/bookmark', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await get('SELECT is_bookmarked FROM content WHERE id = ?', [id]);
    
    if (!content) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    const newBookmarkStatus = !content.is_bookmarked;
    const result = await run(
      'UPDATE content SET is_bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [newBookmarkStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: newBookmarkStatus ? '已收藏' : '取消收藏',
      data: { is_bookmarked: newBookmarkStatus }
    });
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除内容
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM content WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '内容不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空所有内容
router.delete('/', async (req, res) => {
  try {
    const result = await run('DELETE FROM content');
    res.json({ 
      success: true, 
      message: `清空成功，删除了 ${result.changes} 条内容` 
    });
  } catch (error) {
    console.error('清空内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

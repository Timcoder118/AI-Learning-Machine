const express = require('express');
const router = express.Router();
const { query, run, get } = require('../utils/database');

// 获取所有博主
router.get('/', async (req, res) => {
  try {
    const { platform, isActive } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (platform) {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }
    
    if (isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true');
    }
    
    const sql = `SELECT * FROM creators ${whereClause} ORDER BY created_at DESC`;
    const creators = await query(sql, params);
    
    res.json({ success: true, data: creators });
  } catch (error) {
    console.error('获取博主列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个博主
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await get('SELECT * FROM creators WHERE id = ?', [id]);
    
    if (!creator) {
      return res.status(404).json({ success: false, error: '博主不存在' });
    }
    
    res.json({ success: true, data: creator });
  } catch (error) {
    console.error('获取博主信息失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加博主
router.post('/', async (req, res) => {
  try {
    const { name, platform, platform_id, avatar, description, tags, url } = req.body;
    
    if (!name || !platform || !platform_id) {
      return res.status(400).json({ 
        success: false, 
        error: '博主名称、平台和平台ID为必填项' 
      });
    }
    
    const result = await run(`
      INSERT INTO creators (name, platform, platform_id, avatar, description, tags, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, platform, platform_id, avatar, description, tags, url]);
    
    const creator = await get('SELECT * FROM creators WHERE id = ?', [result.id]);
    
    res.status(201).json({ 
      success: true, 
      message: '添加博主成功',
      data: creator
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ 
        success: false, 
        error: '该博主已存在' 
      });
    }
    
    console.error('添加博主失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新博主信息
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, description, tags, is_active } = req.body;
    
    const result = await run(`
      UPDATE creators 
      SET name = ?, avatar = ?, description = ?, tags = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, avatar, description, tags, is_active, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '博主不存在' });
    }
    
    const creator = await get('SELECT * FROM creators WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: '更新博主信息成功',
      data: creator
    });
  } catch (error) {
    console.error('更新博主信息失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除博主
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先删除相关的内容
    await run('DELETE FROM content WHERE creator_id = ?', [id]);
    
    // 再删除博主
    const result = await run('DELETE FROM creators WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '博主不存在' });
    }
    
    res.json({ success: true, message: '删除博主成功' });
  } catch (error) {
    console.error('删除博主失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 切换博主激活状态
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await get('SELECT is_active FROM creators WHERE id = ?', [id]);
    
    if (!creator) {
      return res.status(404).json({ success: false, error: '博主不存在' });
    }
    
    const newActiveStatus = !creator.is_active;
    const result = await run(
      'UPDATE creators SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [newActiveStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: newActiveStatus ? '激活博主成功' : '停用博主成功',
      data: { is_active: newActiveStatus }
    });
  } catch (error) {
    console.error('切换博主状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取博主的统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await query(`
      SELECT 
        COUNT(*) as total_content,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_content,
        SUM(CASE WHEN is_bookmarked = 1 THEN 1 ELSE 0 END) as bookmarked_content,
        SUM(CASE WHEN is_recommended = 1 THEN 1 ELSE 0 END) as recommended_content,
        AVG(priority) as avg_priority
      FROM content 
      WHERE creator_id = ?
    `, [id]);
    
    const recentContent = await query(`
      SELECT * FROM content 
      WHERE creator_id = ? 
      ORDER BY publish_time DESC 
      LIMIT 5
    `, [id]);
    
    res.json({ 
      success: true, 
      data: {
        stats: stats[0],
        recentContent
      }
    });
  } catch (error) {
    console.error('获取博主统计信息失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量导入博主
router.post('/batch', async (req, res) => {
  try {
    const { creators } = req.body;
    
    if (!Array.isArray(creators) || creators.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供有效的博主列表' 
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const creator of creators) {
      try {
        const { name, platform, platform_id, avatar, description, tags, url } = creator;
        
        if (!name || !platform || !platform_id) {
          errors.push({ creator, error: '博主名称、平台和平台ID为必填项' });
          continue;
        }
        
        const result = await run(`
          INSERT OR IGNORE INTO creators (name, platform, platform_id, avatar, description, tags, url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, platform, platform_id, avatar, description, tags, url]);
        
        if (result.changes > 0) {
          const newCreator = await get('SELECT * FROM creators WHERE id = ?', [result.id]);
          results.push(newCreator);
        } else {
          errors.push({ creator, error: '该博主已存在' });
        }
      } catch (error) {
        errors.push({ creator, error: error.message });
      }
    }
    
    res.json({ 
      success: true, 
      message: `成功导入 ${results.length} 个博主`,
      data: {
        success: results,
        errors
      }
    });
  } catch (error) {
    console.error('批量导入博主失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

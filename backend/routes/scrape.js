const express = require('express');
const router = express.Router();
const { query, run, get } = require('../utils/database');
const BilibiliScraper = require('../scrapers/bilibili');
const YouTubeScraper = require('../scrapers/youtube');
const WeiboScraper = require('../scrapers/weibo');
const WeChatScraper = require('../scrapers/wechat');

// 抓取指定博主的内容
router.post('/creator/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await get('SELECT * FROM creators WHERE id = ?', [id]);
    
    if (!creator) {
      return res.status(404).json({ success: false, error: '博主不存在' });
    }
    
    if (!creator.is_active) {
      return res.status(400).json({ success: false, error: '博主已停用' });
    }
    
    let scraper;
    let content = [];
    
    switch (creator.platform) {
      case 'bilibili':
        scraper = new BilibiliScraper();
        content = await scraper.getUserVideos(creator.platform_id);
        break;
      case 'youtube':
        scraper = new YouTubeScraper();
        content = await scraper.getChannelVideos(creator.platform_id);
        break;
      case 'weibo':
        scraper = new WeiboScraper();
        content = await scraper.getUserPosts(creator.platform_id);
        break;
      case 'wechat':
        scraper = new WeChatScraper();
        content = await scraper.getAccountArticles(creator.name);
        break;
      default:
        return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    // 保存内容到数据库
    let savedCount = 0;
    for (const item of content) {
      try {
        await run(`
          INSERT OR IGNORE INTO content (
            id, title, description, url, thumbnail, platform, creator_id, creator_name,
            content_type, publish_time, read_time, tags, priority, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id, item.title, item.description, item.url, item.thumbnail,
          item.platform, creator.id, item.creatorName, item.contentType,
          item.publishTime, item.readTime, JSON.stringify(item.tags),
          item.priority, item.summary
        ]);
        
        if (item.id) {
          savedCount++;
        }
      } catch (error) {
        console.error('保存内容失败:', error.message);
      }
    }
    
    // 记录抓取日志
    await run(`
      INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
      VALUES (?, ?, ?, ?, ?)
    `, [creator.platform, creator.id, 'success', '抓取成功', savedCount]);
    
    res.json({ 
      success: true, 
      message: `抓取完成，新增 ${savedCount} 条内容`,
      data: { savedCount, totalFound: content.length }
    });
  } catch (error) {
    console.error('抓取博主内容失败:', error);
    
    // 记录错误日志
    if (req.params.id) {
      await run(`
        INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
        VALUES (?, ?, ?, ?, ?)
      `, ['unknown', req.params.id, 'error', error.message, 0]);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索并抓取内容
router.post('/search', async (req, res) => {
  try {
    const { keyword, platforms = ['bilibili', 'youtube', 'weibo', 'wechat'], limit = 10 } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
    }
    
    const allContent = [];
    
    for (const platform of platforms) {
      try {
        let scraper;
        let content = [];
        
        switch (platform) {
          case 'bilibili':
            scraper = new BilibiliScraper();
            content = await scraper.searchContent(keyword, limit);
            break;
          case 'youtube':
            scraper = new YouTubeScraper();
            content = await scraper.searchContent(keyword, limit);
            break;
          case 'weibo':
            scraper = new WeiboScraper();
            content = await scraper.searchContent(keyword, limit);
            break;
          case 'wechat':
            scraper = new WeChatScraper();
            content = await scraper.searchArticles(keyword, limit);
            break;
        }
        
        allContent.push(...content);
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${platform} 搜索失败:`, error.message);
      }
    }
    
    // 保存内容到数据库
    let savedCount = 0;
    for (const item of allContent) {
      try {
        await run(`
          INSERT OR IGNORE INTO content (
            id, title, description, url, thumbnail, platform, creator_name,
            content_type, publish_time, read_time, tags, priority, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id, item.title, item.description, item.url, item.thumbnail,
          item.platform, item.creatorName, item.contentType, item.publishTime,
          item.readTime, JSON.stringify(item.tags), item.priority, item.summary
        ]);
        
        if (item.id) {
          savedCount++;
        }
      } catch (error) {
        console.error('保存搜索内容失败:', error.message);
      }
    }
    
    res.json({ 
      success: true, 
      message: `搜索完成，新增 ${savedCount} 条内容`,
      data: { savedCount, totalFound: allContent.length }
    });
  } catch (error) {
    console.error('搜索内容失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量抓取所有活跃博主
router.post('/batch', async (req, res) => {
  try {
    const creators = await query('SELECT * FROM creators WHERE is_active = 1');
    
    if (creators.length === 0) {
      return res.json({ 
        success: true, 
        message: '没有活跃的博主需要抓取',
        data: { totalCreators: 0, successCount: 0, errorCount: 0 }
      });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const creator of creators) {
      try {
        let scraper;
        let content = [];
        
        switch (creator.platform) {
          case 'bilibili':
            scraper = new BilibiliScraper();
            content = await scraper.getUserVideos(creator.platform_id);
            break;
          case 'youtube':
            scraper = new YouTubeScraper();
            content = await scraper.getChannelVideos(creator.platform_id);
            break;
          case 'weibo':
            scraper = new WeiboScraper();
            content = await scraper.getUserPosts(creator.platform_id);
            break;
          case 'wechat':
            scraper = new WeChatScraper();
            content = await scraper.getAccountArticles(creator.name);
            break;
        }
        
        // 保存内容到数据库
        let savedCount = 0;
        for (const item of content) {
          try {
            await run(`
              INSERT OR IGNORE INTO content (
                id, title, description, url, thumbnail, platform, creator_id, creator_name,
                content_type, publish_time, read_time, tags, priority, summary
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.id, item.title, item.description, item.url, item.thumbnail,
              item.platform, creator.id, item.creatorName, item.contentType,
              item.publishTime, item.readTime, JSON.stringify(item.tags),
              item.priority, item.summary
            ]);
            
            if (item.id) {
              savedCount++;
            }
          } catch (error) {
            console.error('保存内容失败:', error.message);
          }
        }
        
        // 记录抓取日志
        await run(`
          INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
          VALUES (?, ?, ?, ?, ?)
        `, [creator.platform, creator.id, 'success', '批量抓取成功', savedCount]);
        
        successCount++;
        results.push({
          creator: creator.name,
          platform: creator.platform,
          status: 'success',
          savedCount
        });
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`抓取博主 ${creator.name} 失败:`, error.message);
        
        // 记录错误日志
        await run(`
          INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
          VALUES (?, ?, ?, ?, ?)
        `, [creator.platform, creator.id, 'error', error.message, 0]);
        
        errorCount++;
        results.push({
          creator: creator.name,
          platform: creator.platform,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `批量抓取完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
      data: { 
        totalCreators: creators.length, 
        successCount, 
        errorCount, 
        results 
      }
    });
  } catch (error) {
    console.error('批量抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动触发抓取所有活跃博主的内容
router.post('/trigger', async (req, res) => {
  try {
    console.log('开始手动触发抓取...');
    
    // 获取所有活跃的博主
    const creators = await query('SELECT * FROM creators WHERE is_active = 1');
    
    if (creators.length === 0) {
      return res.json({ 
        success: true, 
        message: '没有活跃的博主需要抓取',
        data: { totalCreators: 0, successCount: 0, errorCount: 0, results: [] }
      });
    }
    
    console.log(`找到 ${creators.length} 个活跃博主，开始抓取...`);
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const creator of creators) {
      try {
        console.log(`正在抓取博主: ${creator.name} (${creator.platform})`);
        
        let scraper;
        let content = [];
        
        switch (creator.platform) {
          case 'bilibili':
            scraper = new BilibiliScraper();
            content = await scraper.getUserVideos(creator.platform_id);
            break;
          case 'youtube':
            scraper = new YouTubeScraper();
            content = await scraper.getChannelVideos(creator.platform_id);
            break;
          case 'weibo':
            scraper = new WeiboScraper();
            content = await scraper.getUserPosts(creator.platform_id);
            break;
          case 'wechat':
            scraper = new WeChatScraper();
            content = await scraper.getAccountArticles(creator.name);
            break;
          default:
            console.log(`不支持的平台: ${creator.platform}`);
            continue;
        }
        
        // 保存内容到数据库
        let savedCount = 0;
        for (const item of content) {
          try {
            const result = await run(`
              INSERT OR IGNORE INTO content (
                title, description, url, thumbnail, platform, creator_id, creator_name,
                content_type, publish_time, read_time, view_count, tags, priority, summary
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.title, item.description, item.url, item.thumbnail,
              item.platform, creator.id, item.creatorName || creator.name, 
              item.contentType || 'article', item.publishTime, item.readTime, 
              item.viewCount || 0, JSON.stringify(item.tags || []), item.priority || 5, item.summary
            ]);
            
            if (result.changes > 0) {
              savedCount++;
            }
          } catch (error) {
            console.error('保存内容失败:', error.message);
          }
        }
        
        // 记录抓取日志
        await run(`
          INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
          VALUES (?, ?, ?, ?, ?)
        `, [creator.platform, creator.id, 'success', '手动抓取成功', savedCount]);
        
        successCount++;
        results.push({
          creator: creator.name,
          platform: creator.platform,
          status: 'success',
          savedCount
        });
        
        console.log(`博主 ${creator.name} 抓取完成，保存了 ${savedCount} 条内容`);
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`抓取博主 ${creator.name} 失败:`, error.message);
        
        // 记录错误日志
        await run(`
          INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
          VALUES (?, ?, ?, ?, ?)
        `, [creator.platform, creator.id, 'error', error.message, 0]);
        
        errorCount++;
        results.push({
          creator: creator.name,
          platform: creator.platform,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`抓取完成，成功 ${successCount} 个，失败 ${errorCount} 个`);
    
    res.json({ 
      success: true, 
      message: `手动抓取完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
      data: { 
        totalCreators: creators.length, 
        successCount, 
        errorCount, 
        results 
      }
    });
  } catch (error) {
    console.error('手动触发抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取抓取日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, platform, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (platform) {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const sql = `
      SELECT sl.*, c.name as creator_name 
      FROM scrape_logs sl
      LEFT JOIN creators c ON sl.creator_id = c.id
      ${whereClause}
      ORDER BY sl.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `SELECT COUNT(*) as total FROM scrape_logs sl ${whereClause}`;
    
    const [logs, countResult] = await Promise.all([
      query(sql, [...params, parseInt(limit), offset]),
      query(countSql, params)
    ]);
    
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: {
        items: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取抓取日志失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试Bilibili抓取
router.post('/test/bilibili', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '请提供UP主ID' });
    }
    
    console.log(`🧪 测试Bilibili抓取，UP主ID: ${userId}`);
    
    const scraper = new BilibiliScraper();
    const content = await scraper.getUserVideos(userId, 5);
    
    console.log(`✅ 测试抓取完成，获取到 ${content.length} 条内容`);
    
    res.json({ 
      success: true, 
      message: `测试抓取完成，获取到 ${content.length} 条内容`,
      data: {
        userId,
        contentCount: content.length,
        content: content.slice(0, 3) // 只返回前3条用于预览
      }
    });
  } catch (error) {
    console.error('测试Bilibili抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试微博抓取
router.post('/test/weibo', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '请提供微博用户ID' });
    }
    
    console.log(`🧪 测试微博抓取，用户ID: ${userId}`);
    
    const scraper = new WeiboScraper();
    const content = await scraper.getUserPosts(userId, 5);
    
    console.log(`✅ 测试抓取完成，获取到 ${content.length} 条内容`);
    
    res.json({ 
      success: true, 
      message: `测试抓取完成，获取到 ${content.length} 条内容`,
      data: {
        userId,
        contentCount: content.length,
        content: content.slice(0, 3) // 只返回前3条用于预览
      }
    });
  } catch (error) {
    console.error('测试微博抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试微信公众号抓取
router.post('/test/wechat', async (req, res) => {
  try {
    const { accountName } = req.body;
    
    if (!accountName) {
      return res.status(400).json({ success: false, error: '请提供公众号名称' });
    }
    
    console.log(`🧪 测试微信公众号抓取，公众号名称: ${accountName}`);
    
    const scraper = new WeChatScraper();
    const content = await scraper.getAccountArticles(accountName, 5);
    
    console.log(`✅ 测试抓取完成，获取到 ${content.length} 条内容`);
    
    res.json({ 
      success: true, 
      message: `测试抓取完成，获取到 ${content.length} 条内容`,
      data: {
        accountName,
        contentCount: content.length,
        content: content.slice(0, 3) // 只返回前3条用于预览
      }
    });
  } catch (error) {
    console.error('测试微信公众号抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取抓取统计
router.get('/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        platform,
        status,
        COUNT(*) as count,
        SUM(items_count) as total_items
      FROM scrape_logs 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY platform, status
    `);
    
    const recentLogs = await query(`
      SELECT sl.*, c.name as creator_name 
      FROM scrape_logs sl
      LEFT JOIN creators c ON sl.creator_id = c.id
      ORDER BY sl.created_at DESC 
      LIMIT 10
    `);
    
    res.json({ 
      success: true, 
      data: {
        stats,
        recentLogs
      }
    });
  } catch (error) {
    console.error('获取抓取统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

const cron = require('node-cron');
const { query, run } = require('../utils/database');
const BilibiliScraper = require('./bilibili');
const YouTubeScraper = require('./youtube');
const WeiboScraper = require('./weibo');
const WeChatScraper = require('./wechat');

class ScrapeScheduler {
  constructor() {
    this.isRunning = false;
    this.scrapers = {
      bilibili: new BilibiliScraper(),
      youtube: new YouTubeScraper(),
      weibo: new WeiboScraper(),
      wechat: new WeChatScraper()
    };
  }

  // 启动定时任务
  start() {
    console.log('🚀 启动定时抓取任务...');
    
    // 每小时执行一次抓取
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) {
        await this.scrapeAllActiveCreators();
      }
    });
    
    // 每天凌晨2点执行深度抓取
    cron.schedule('0 2 * * *', async () => {
      if (!this.isRunning) {
        await this.deepScrape();
      }
    });
    
    console.log('✅ 定时抓取任务已启动');
  }

  // 抓取所有活跃博主
  async scrapeAllActiveCreators() {
    if (this.isRunning) {
      console.log('⏳ 抓取任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    console.log('🔄 开始抓取所有活跃博主...');

    try {
      const creators = await query('SELECT * FROM creators WHERE is_active = 1');
      
      if (creators.length === 0) {
        console.log('ℹ️ 没有活跃的博主需要抓取');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let totalItems = 0;

      for (const creator of creators) {
        try {
          console.log(`📡 抓取博主: ${creator.name} (${creator.platform})`);
          
          const items = await this.scrapeCreator(creator);
          totalItems += items;
          successCount++;
          
          console.log(`✅ ${creator.name}: 获取 ${items} 条内容`);
          
          // 添加延迟避免请求过快
          await this.delay(2000);
        } catch (error) {
          console.error(`❌ ${creator.name} 抓取失败:`, error.message);
          errorCount++;
          
          // 记录错误日志
          await run(`
            INSERT INTO scrape_logs (platform, creator_id, status, message, items_count)
            VALUES (?, ?, ?, ?, ?)
          `, [creator.platform, creator.id, 'error', error.message, 0]);
        }
      }

      console.log(`🎉 抓取完成! 成功: ${successCount}, 失败: ${errorCount}, 总内容: ${totalItems}`);
    } catch (error) {
      console.error('❌ 批量抓取失败:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // 抓取单个博主
  async scrapeCreator(creator) {
    let content = [];
    
    switch (creator.platform) {
      case 'bilibili':
        content = await this.scrapers.bilibili.getUserVideos(creator.platform_id);
        break;
      case 'youtube':
        content = await this.scrapers.youtube.getChannelVideos(creator.platform_id);
        break;
      case 'weibo':
        content = await this.scrapers.weibo.getUserPosts(creator.platform_id);
        break;
      case 'wechat':
        content = await this.scrapers.wechat.getAccountArticles(creator.name);
        break;
      default:
        throw new Error(`不支持的平台: ${creator.platform}`);
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
    `, [creator.platform, creator.id, 'success', '定时抓取成功', savedCount]);

    return savedCount;
  }

  // 深度抓取（搜索相关内容）
  async deepScrape() {
    if (this.isRunning) {
      console.log('⏳ 深度抓取任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    console.log('🔍 开始深度抓取...');

    try {
      const keywords = ['AI', '人工智能', '机器学习', '深度学习', '算法'];
      let totalItems = 0;

      for (const keyword of keywords) {
        console.log(`🔍 搜索关键词: ${keyword}`);
        
        try {
          const items = await this.searchAndSave(keyword);
          totalItems += items;
          console.log(`✅ ${keyword}: 获取 ${items} 条内容`);
          
          // 添加延迟避免请求过快
          await this.delay(3000);
        } catch (error) {
          console.error(`❌ 搜索 ${keyword} 失败:`, error.message);
        }
      }

      console.log(`🎉 深度抓取完成! 总内容: ${totalItems}`);
    } catch (error) {
      console.error('❌ 深度抓取失败:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // 搜索并保存内容
  async searchAndSave(keyword) {
    const platforms = ['bilibili', 'youtube', 'weibo', 'wechat'];
    let totalSaved = 0;

    for (const platform of platforms) {
      try {
        let content = [];
        
        switch (platform) {
          case 'bilibili':
            content = await this.scrapers.bilibili.searchContent(keyword, 5);
            break;
          case 'youtube':
            content = await this.scrapers.youtube.searchContent(keyword, 5);
            break;
          case 'weibo':
            content = await this.scrapers.weibo.searchContent(keyword, 5);
            break;
          case 'wechat':
            content = await this.scrapers.wechat.searchArticles(keyword, 5);
            break;
        }

        // 保存内容到数据库
        for (const item of content) {
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
              totalSaved++;
            }
          } catch (error) {
            console.error('保存搜索内容失败:', error.message);
          }
        }

        // 添加延迟避免请求过快
        await this.delay(1000);
      } catch (error) {
        console.error(`${platform} 搜索失败:`, error.message);
      }
    }

    return totalSaved;
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 停止定时任务
  stop() {
    console.log('⏹️ 停止定时抓取任务');
    cron.destroy();
  }

  // 手动触发抓取
  async triggerScrape() {
    if (this.isRunning) {
      throw new Error('抓取任务正在运行中');
    }
    
    await this.scrapeAllActiveCreators();
  }

  // 手动触发深度抓取
  async triggerDeepScrape() {
    if (this.isRunning) {
      throw new Error('抓取任务正在运行中');
    }
    
    await this.deepScrape();
  }
}

// 创建全局实例
const scheduler = new ScrapeScheduler();

// 如果直接运行此文件，启动定时任务
if (require.main === module) {
  scheduler.start();
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在关闭...');
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = scheduler;

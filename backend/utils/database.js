const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'aggregator.db');
let db = null;

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ 数据库连接成功');
      createTables().then(resolve).catch(reject);
    });
  });
}

// 创建表结构
function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // 博主表
      `CREATE TABLE IF NOT EXISTS creators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        avatar TEXT,
        description TEXT,
        followers INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        tags TEXT,
        url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, platform_id)
      )`,
      
      // 内容表
      `CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        thumbnail TEXT,
        platform TEXT NOT NULL,
        creator_id INTEGER,
        creator_name TEXT,
        content_type TEXT,
        publish_time DATETIME,
        read_time INTEGER,
        view_count INTEGER DEFAULT 0,
        tags TEXT,
        is_read BOOLEAN DEFAULT 0,
        is_bookmarked BOOLEAN DEFAULT 0,
        is_recommended BOOLEAN DEFAULT 0,
        priority INTEGER DEFAULT 5,
        summary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, url),
        FOREIGN KEY (creator_id) REFERENCES creators (id)
      )`,
      
      // 抓取日志表
      `CREATE TABLE IF NOT EXISTS scrape_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        creator_id INTEGER,
        status TEXT NOT NULL,
        message TEXT,
        items_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES creators (id)
      )`,
      
      // 用户偏好表
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 用户行为表
      `CREATE TABLE IF NOT EXISTS user_behavior (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        content_id INTEGER,
        action_type TEXT,
        action_value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES content (id)
      )`,
      
      // 标签权重表
      `CREATE TABLE IF NOT EXISTS tag_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        tag_name TEXT,
        weight REAL DEFAULT 1.0,
        interaction_count INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tag_name)
      )`,
      
      // 内容评分表
      `CREATE TABLE IF NOT EXISTS content_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        user_id TEXT,
        base_score REAL,
        personal_score REAL,
        final_score REAL,
        factors TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES content (id)
      )`
    ];
    
    let completed = 0;
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`创建表 ${index + 1} 失败:`, err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === tables.length) {
          console.log('✅ 数据库表创建完成');
          resolve();
        }
      });
    });
  });
}

// 通用查询方法
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 通用执行方法
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// 获取单条记录
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

// 关闭数据库连接
function close() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err.message);
        } else {
          console.log('✅ 数据库连接已关闭');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  query,
  run,
  get,
  close,
  db
};

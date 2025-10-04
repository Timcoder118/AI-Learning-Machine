const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库路径
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'aggregator.db');

console.log('开始数据库迁移...');

// 打开数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    return;
  }
  
  console.log('✅ 数据库连接成功');
  
  // 检查 view_count 字段是否存在
  db.get("PRAGMA table_info(content)", (err, rows) => {
    if (err) {
      console.error('获取表结构失败:', err.message);
      return;
    }
    
    // 获取所有列信息
    db.all("PRAGMA table_info(content)", (err, columns) => {
      if (err) {
        console.error('获取列信息失败:', err.message);
        return;
      }
      
      const hasViewCount = columns.some(col => col.name === 'view_count');
      
      if (!hasViewCount) {
        console.log('添加 view_count 字段...');
        
        // 添加 view_count 字段
        db.run("ALTER TABLE content ADD COLUMN view_count INTEGER DEFAULT 0", (err) => {
          if (err) {
            console.error('添加字段失败:', err.message);
          } else {
            console.log('✅ view_count 字段添加成功');
          }
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('关闭数据库失败:', err.message);
            } else {
              console.log('✅ 数据库迁移完成');
            }
          });
        });
      } else {
        console.log('✅ view_count 字段已存在');
        
        // 关闭数据库连接
        db.close((err) => {
          if (err) {
            console.error('关闭数据库失败:', err.message);
          } else {
            console.log('✅ 数据库迁移完成');
          }
        });
      }
    });
  });
});

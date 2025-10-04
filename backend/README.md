# AI知识聚合平台 - 后端服务

## 🎯 功能概述

这是一个专为个人学习使用的内容抓取和聚合系统，支持从多个平台自动收集AI相关的最新资讯。

## 🔧 技术栈

- **Node.js** - 运行时环境
- **Express** - Web框架
- **SQLite** - 轻量级数据库
- **Puppeteer** - 网页自动化
- **Cheerio** - HTML解析
- **Axios** - HTTP请求
- **node-cron** - 定时任务

## 📋 支持的平台

### 1. Bilibili (哔哩哔哩)
- **功能**: 获取UP主最新视频
- **方法**: 官方API + 网页抓取
- **特点**: 支持视频信息、播放量、点赞数等

### 2. YouTube
- **功能**: 获取频道最新视频
- **方法**: 网页抓取
- **特点**: 支持视频信息、观看次数等

### 3. 微博
- **功能**: 获取用户最新微博
- **方法**: 网页抓取
- **特点**: 支持文本、图片内容

### 4. 微信公众号
- **功能**: 搜索公众号文章
- **方法**: 搜狗微信搜索
- **特点**: 支持文章标题、摘要等

## 🚀 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 启动抓取任务
```bash
# 手动抓取
npm run scrape
```

## 📊 API接口

### 内容管理
- `GET /api/content` - 获取内容列表
- `GET /api/content/:id` - 获取单个内容
- `PATCH /api/content/:id/read` - 标记为已读
- `PATCH /api/content/:id/bookmark` - 切换收藏状态
- `GET /api/content/search/:keyword` - 搜索内容
- `GET /api/content/stats/overview` - 获取统计信息

### 博主管理
- `GET /api/creators` - 获取博主列表
- `POST /api/creators` - 添加博主
- `PUT /api/creators/:id` - 更新博主信息
- `DELETE /api/creators/:id` - 删除博主
- `PATCH /api/creators/:id/toggle-active` - 切换激活状态
- `POST /api/creators/batch` - 批量导入博主

### 抓取管理
- `POST /api/scrape/creator/:id` - 抓取指定博主
- `POST /api/scrape/search` - 搜索并抓取内容
- `POST /api/scrape/batch` - 批量抓取所有博主
- `GET /api/scrape/logs` - 获取抓取日志
- `GET /api/scrape/stats` - 获取抓取统计

## ⚙️ 配置说明

### 环境变量
```bash
NODE_ENV=development
PORT=3001
DB_PATH=./data/aggregator.db
SCRAPE_INTERVAL=3600000
MAX_CONCURRENT_REQUESTS=3
REQUEST_DELAY=2000
```

### 抓取配置
- **抓取间隔**: 1小时
- **请求延迟**: 2秒
- **最大并发**: 3个请求
- **重试次数**: 3次
- **超时时间**: 10秒

## 🔄 定时任务

### 自动抓取
- **频率**: 每小时执行一次
- **目标**: 所有活跃博主
- **内容**: 最新发布的视频/文章

### 深度抓取
- **频率**: 每天凌晨2点
- **目标**: 关键词搜索
- **内容**: AI相关的最新资讯

## 📝 使用示例

### 1. 添加博主
```bash
curl -X POST http://localhost:3001/api/creators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李沐",
    "platform": "bilibili",
    "platform_id": "15627787",
    "description": "AI专家",
    "tags": "AI,机器学习,深度学习"
  }'
```

### 2. 抓取博主内容
```bash
curl -X POST http://localhost:3001/api/scrape/creator/1
```

### 3. 搜索相关内容
```bash
curl -X POST http://localhost:3001/api/scrape/search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "ChatGPT",
    "platforms": ["bilibili", "youtube"],
    "limit": 10
  }'
```

## 🛡️ 安全与合规

### 使用原则
1. **个人学习**: 仅用于个人学习研究
2. **合理频率**: 设置合理的抓取间隔
3. **遵守条款**: 遵守各平台使用条款
4. **非商业用途**: 不得用于商业目的

### 技术措施
- 请求频率限制
- 用户代理伪装
- 错误重试机制
- 请求延迟控制

## 📈 监控与日志

### 抓取日志
- 记录每次抓取的结果
- 包含成功/失败状态
- 统计抓取的内容数量

### 性能监控
- 请求响应时间
- 错误率统计
- 数据库性能

## 🔧 故障排除

### 常见问题

**1. 抓取失败**
- 检查网络连接
- 确认目标网站可访问
- 查看错误日志

**2. 数据库错误**
- 检查数据库文件权限
- 确认SQLite版本兼容性

**3. 内存不足**
- 减少并发请求数
- 增加请求延迟
- 优化抓取逻辑

### 调试模式
```bash
NODE_ENV=development npm run dev
```

## 📚 扩展开发

### 添加新平台
1. 继承 `BaseScraper` 类
2. 实现平台特定的抓取逻辑
3. 在路由中注册新平台
4. 更新配置文件

### 自定义抓取规则
1. 修改 `config.js` 中的过滤规则
2. 调整关键词匹配逻辑
3. 自定义优先级计算

## 📄 许可证

MIT License

## ⚠️ 免责声明

本工具仅用于个人学习研究，请遵守相关法律法规和各平台的使用条款。使用者需自行承担使用风险，开发者不承担任何法律责任。

---

*让AI知识触手可及，让学习更加高效！*

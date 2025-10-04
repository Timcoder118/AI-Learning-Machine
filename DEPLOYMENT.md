# 生产环境部署指南

## 概述

本文档说明如何将AI知识聚合平台部署到生产环境，并配置真实的微信公众号文章抓取功能。

## 环境配置

### 1. 环境变量配置

创建 `.env.production` 文件：

```bash
# 生产环境标识
NODE_ENV=production

# 微信公众号API配置（推荐方式）
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 网页抓取配置（备选方式）
ENABLE_WEB_SCRAPING=true
SCRAPING_DELAY=2000
USER_AGENT=Mozilla/5.0 (compatible; AI-Aggregator/1.0)

# 第三方聚合服务配置（备选方式）
THIRD_PARTY_API_KEY=your_api_key
THIRD_PARTY_API_URL=https://api.example.com

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/ai_aggregator

# 服务器配置
PORT=3001
CORS_ORIGIN=https://your-domain.com
```

### 2. 微信公众号API配置

#### 2.1 申请微信公众号

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册并认证公众号
3. 获取 AppID 和 AppSecret

#### 2.2 配置API权限

1. 在公众号后台设置 → 功能设置中启用：
   - 网页授权域名
   - JS接口安全域名
   - 业务域名

2. 在开发 → 基本配置中获取：
   - AppID (应用ID)
   - AppSecret (应用密钥)

### 3. 网页抓取配置

#### 3.1 遵守robots.txt

检查目标网站的robots.txt文件：
```
User-agent: *
Disallow: /search/
Disallow: /admin/
Allow: /articles/
```

#### 3.2 请求频率控制

```javascript
// 配置请求延迟
const SCRAPING_DELAY = 2000; // 2秒延迟
const MAX_REQUESTS_PER_MINUTE = 30;

// 设置User-Agent
const USER_AGENT = 'Mozilla/5.0 (compatible; AI-Aggregator/1.0)';
```

### 4. 第三方聚合服务

#### 4.1 推荐的第三方服务

1. **聚合数据** - 提供微信公众号文章API
2. **阿里云** - 内容安全与数据服务
3. **腾讯云** - 内容审核与数据服务

#### 4.2 API调用示例

```javascript
// 聚合数据API示例
const response = await fetch('http://v.juhe.cn/weixin/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    key: process.env.THIRD_PARTY_API_KEY,
    pno: 1,
    ps: 20,
    dtype: 'json'
  })
});
```

## 部署步骤

### 1. 服务器准备

```bash
# 安装Node.js (推荐使用nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安装PM2进程管理器
npm install -g pm2

# 安装PostgreSQL数据库
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. 代码部署

```bash
# 克隆代码
git clone https://github.com/your-repo/ai-knowledge-aggregator.git
cd ai-knowledge-aggregator

# 安装依赖
npm install

# 构建前端
npm run build

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 启动服务
pm2 start ecosystem.config.js
```

### 3. 数据库配置

```bash
# 创建数据库
sudo -u postgres createdb ai_aggregator

# 运行迁移
npm run migrate

# 初始化数据
npm run seed
```

### 4. Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/ai-knowledge-aggregator/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控与维护

### 1. 日志监控

```bash
# 查看PM2日志
pm2 logs

# 查看错误日志
pm2 logs --err

# 查看系统资源使用
pm2 monit
```

### 2. 数据备份

```bash
# 数据库备份
pg_dump ai_aggregator > backup_$(date +%Y%m%d).sql

# 定时备份脚本
0 2 * * * /path/to/backup_script.sh
```

### 3. 性能优化

```javascript
// 启用缓存
const redis = require('redis');
const client = redis.createClient();

// 缓存文章数据
await client.setex(`article:${id}`, 3600, JSON.stringify(article));

// 启用CDN
app.use('/static', express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

## 安全考虑

### 1. API安全

```javascript
// 限制请求频率
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api', limiter);
```

### 2. 数据安全

```javascript
// 数据加密
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encrypt(text) {
  const cipher = crypto.createCipher(algorithm, process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

### 3. 访问控制

```javascript
// JWT认证
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

## 故障排除

### 1. 常见问题

**问题：微信公众号API调用失败**
```bash
# 检查AppID和AppSecret
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=YOUR_APPID&secret=YOUR_SECRET"
```

**问题：网页抓取被反爬虫**
```javascript
// 增加随机延迟
const delay = Math.random() * 3000 + 2000; // 2-5秒随机延迟
await new Promise(resolve => setTimeout(resolve, delay));

// 使用代理IP
const proxy = 'http://proxy-server:port';
const response = await fetch(url, { proxy });
```

**问题：数据库连接失败**
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U username -d ai_aggregator
```

### 2. 性能监控

```javascript
// 添加性能监控
const performance = require('perf_hooks');

app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
  });
  
  next();
});
```

## 更新与维护

### 1. 代码更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart all
```

### 2. 数据迁移

```bash
# 运行数据库迁移
npm run migrate

# 回滚迁移
npm run migrate:rollback
```

## 总结

部署到生产环境后，系统将能够：

1. **获取真实文章链接** - 通过微信公众号API或网页抓取
2. **实时内容更新** - 定时抓取最新文章
3. **高性能访问** - 支持大量用户并发访问
4. **数据安全** - 加密存储和传输
5. **监控告警** - 实时监控系统状态

确保在生产环境中配置正确的环境变量和API密钥，系统就能正常工作并获取真实的微信公众号文章链接。

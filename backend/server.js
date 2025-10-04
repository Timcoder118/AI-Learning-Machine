const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    // Vercel部署的前端域名
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.dev$/,
    // 自定义域名
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 解析JSON
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 静态文件服务
app.use(express.static('../dist'));

// 数据库初始化
const { initDatabase } = require('./utils/database');
initDatabase();

// 路由
const contentRoutes = require('./routes/content');
const creatorRoutes = require('./routes/creators');
const scrapeRoutes = require('./routes/scrape');
const recommendationRoutes = require('./routes/recommendation');

app.use('/api/content', contentRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/recommendation', recommendationRoutes);

// 根路径处理
app.get('/', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'AI知识聚合平台后端服务正在运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      creators: '/api/creators',
      content: '/api/content',
      scrape: '/api/scrape',
      recommendation: '/api/recommendation'
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'AI知识聚合平台后端服务正常运行'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 后端服务启动成功！`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;

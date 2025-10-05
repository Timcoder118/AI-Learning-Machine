# YouTube API Key 配置指南

## 🎯 为什么需要YouTube API Key？

YouTube抓取功能需要YouTube Data API v3来获取频道信息和视频数据。这是Google官方提供的API服务，需要API Key才能使用。

## 📋 获取YouTube API Key的步骤

### 1. 创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击"创建项目"或选择现有项目
3. 输入项目名称，例如："AI-Learning-Machine"

### 2. 启用YouTube Data API v3
1. 在Google Cloud Console中，点击"API和服务" > "库"
2. 搜索"YouTube Data API v3"
3. 点击"启用"

### 3. 创建API凭据
1. 点击"API和服务" > "凭据"
2. 点击"创建凭据" > "API密钥"
3. 复制生成的API Key

### 4. 配置API Key
将API Key设置为环境变量：

#### 本地开发环境
```bash
# Windows PowerShell
$env:YOUTUBE_API_KEY="你的API_KEY"

# Windows CMD
set YOUTUBE_API_KEY=你的API_KEY

# 或者创建.env文件
echo YOUTUBE_API_KEY=你的API_KEY > .env
```

#### Render部署环境
1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 选择你的后端服务
3. 点击"Environment"标签
4. 添加环境变量：
   - Key: `YOUTUBE_API_KEY`
   - Value: `你的API_KEY`

## 🔧 测试API Key

配置完成后，可以通过以下方式测试：

1. **使用测试脚本**：
   ```bash
   cd backend
   node test_scrapers.js
   ```

2. **通过前端测试按钮**：
   - 访问内容聚合页面
   - 点击"测试YouTube"按钮
   - 输入Jeff Su的频道ID：`UCwAnu01qlnVg1Ai2AbtTMaA`

## 📊 API配额说明

YouTube Data API v3有每日配额限制：
- 免费配额：10,000个单位/天
- 每个API调用消耗不同的单位：
  - 频道信息：1单位
  - 视频列表：1单位
  - 视频详情：1单位

## 🚨 注意事项

1. **API Key安全**：
   - 不要将API Key提交到代码仓库
   - 使用环境变量存储API Key
   - 定期轮换API Key

2. **配额管理**：
   - 监控API使用量
   - 避免频繁调用
   - 考虑缓存策略

3. **错误处理**：
   - API Key无效：检查配置
   - 配额不足：等待第二天或升级配额
   - 频道不存在：检查频道ID

## 🔗 相关链接

- [YouTube Data API v3 文档](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API配额说明](https://developers.google.com/youtube/v3/determine_quota_cost)

## 💡 快速测试

如果你已经有API Key，可以立即测试：

```bash
# 设置环境变量
$env:YOUTUBE_API_KEY="你的API_KEY"

# 运行测试
cd backend
node test_scrapers.js
```

成功的话会看到YouTube视频数据！

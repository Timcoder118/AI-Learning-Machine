# AI知识聚合平台 - 部署上线指南

## 部署方式选择

### 1. 云服务器部署（推荐）

#### 服务器要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 50GB以上SSD
- **带宽**: 5Mbps以上
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8

#### 推荐云服务商
- **阿里云ECS**: 性价比高，国内访问快
- **腾讯云CVM**: 稳定性好，技术支持完善
- **华为云ECS**: 企业级服务，安全性高
- **AWS EC2**: 全球部署，功能丰富

### 2. 容器化部署

#### Docker部署
```bash
# 1. 构建镜像
docker build -t ai-aggregator .

# 2. 运行容器
docker run -d \
  --name ai-aggregator \
  -p 3001:3001 \
  -v $(pwd)/data:/app/backend/data \
  -v $(pwd)/logs:/app/logs \
  ai-aggregator

# 3. 使用Docker Compose
docker-compose up -d
```

#### Kubernetes部署
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-aggregator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-aggregator
  template:
    metadata:
      labels:
        app: ai-aggregator
    spec:
      containers:
      - name: ai-aggregator
        image: ai-aggregator:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
```

### 3. 静态网站托管

#### Vercel部署
```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 部署
vercel --prod

# 3. 配置环境变量
vercel env add NODE_ENV production
```

#### Netlify部署
```bash
# 1. 构建前端
npm run build

# 2. 部署到Netlify
netlify deploy --prod --dir=dist
```

## 详细部署步骤

### 方式一：传统服务器部署

#### 1. 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y

# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

#### 2. 项目部署
```bash
# 1. 克隆代码
git clone https://github.com/your-repo/ai-knowledge-aggregator.git
cd ai-knowledge-aggregator

# 2. 安装依赖
npm install
cd backend && npm install && cd ..

# 3. 构建前端
npm run build

# 4. 配置环境变量
cp env.production .env
nano .env  # 编辑配置

# 5. 启动服务
pm2 start ecosystem.config.js --env production

# 6. 设置开机自启
pm2 startup
pm2 save
```

#### 3. Nginx配置
```bash
# 创建Nginx配置
sudo nano /etc/nginx/sites-available/ai-aggregator

# 配置文件内容
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/ai-knowledge-aggregator/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/ai-aggregator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 方式二：Docker部署

#### 1. 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 部署应用
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/ai-knowledge-aggregator.git
cd ai-knowledge-aggregator

# 2. 配置环境变量
cp env.production .env
nano .env  # 编辑配置

# 3. 启动服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
docker-compose logs -f
```

### 方式三：云平台部署

#### 阿里云部署
```bash
# 1. 创建ECS实例
# 2. 配置安全组（开放80、443、3001端口）
# 3. 连接服务器并按照方式一部署

# 4. 配置域名解析
# 5. 申请SSL证书
# 6. 配置HTTPS
```

#### 腾讯云部署
```bash
# 1. 使用腾讯云CVM
# 2. 配置云数据库PostgreSQL
# 3. 使用腾讯云CDN加速
# 4. 配置云监控
```

## 域名和SSL配置

### 1. 域名购买和解析
```bash
# 推荐域名注册商
- 阿里云域名
- 腾讯云域名
- 万网
- GoDaddy

# DNS解析配置
A记录: @ -> 服务器IP
A记录: www -> 服务器IP
CNAME: api -> your-domain.com
```

### 2. SSL证书配置
```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 监控和维护

### 1. 系统监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs -y

# 使用PM2监控
pm2 monit

# 查看日志
pm2 logs
docker-compose logs -f
```

### 2. 数据备份
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump ai_aggregator > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/

# 定时备份
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

### 3. 性能优化
```bash
# Nginx优化
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# Node.js优化
NODE_OPTIONS="--max-old-space-size=2048"
```

## 安全配置

### 1. 防火墙设置
```bash
# UFW防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3001  # 禁止直接访问后端端口
```

### 2. 安全加固
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装fail2ban
sudo apt install fail2ban -y

# 配置SSH密钥登录
ssh-keygen -t rsa -b 4096
ssh-copy-id user@server
```

## 成本估算

### 云服务器成本（月）
- **阿里云ECS**: 2核4G - ¥200-300
- **腾讯云CVM**: 2核4G - ¥180-280
- **华为云ECS**: 2核4G - ¥220-320

### 域名和SSL成本（年）
- **域名**: ¥50-100
- **SSL证书**: 免费（Let's Encrypt）
- **CDN**: ¥50-200

### 总成本估算
- **小型部署**: ¥300-500/月
- **中型部署**: ¥500-1000/月
- **大型部署**: ¥1000+/月

## 常见问题解决

### 1. 端口冲突
```bash
# 查看端口占用
netstat -tulpn | grep :3001
lsof -i :3001

# 终止进程
kill -9 PID
```

### 2. 内存不足
```bash
# 查看内存使用
free -h
top

# 优化Node.js内存
NODE_OPTIONS="--max-old-space-size=2048"
```

### 3. 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql
sudo systemctl restart postgresql

# 检查连接
psql -h localhost -U ai_user -d ai_aggregator
```

## 发布检查清单

- [ ] 服务器环境配置完成
- [ ] 域名解析配置正确
- [ ] SSL证书安装成功
- [ ] 数据库连接正常
- [ ] 前端构建成功
- [ ] 后端服务启动正常
- [ ] Nginx配置正确
- [ ] 防火墙设置完成
- [ ] 监控系统配置
- [ ] 备份策略制定
- [ ] 性能测试通过
- [ ] 安全扫描通过

## 上线后优化

### 1. 性能优化
- 启用CDN加速
- 配置Redis缓存
- 优化数据库查询
- 启用Gzip压缩

### 2. 功能扩展
- 添加用户认证
- 实现实时通知
- 增加数据分析
- 优化推荐算法

### 3. 运维自动化
- 设置自动部署
- 配置监控告警
- 实现自动备份
- 建立日志分析

按照这个指南，您就可以成功将AI知识聚合平台部署上线了！

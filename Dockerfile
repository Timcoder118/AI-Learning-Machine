# 多阶段构建
FROM node:18-alpine AS frontend-build

# 设置工作目录
WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./

# 安装前端依赖
RUN npm ci --only=production

# 复制前端源码
COPY . .

# 构建前端
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装PM2
RUN npm install -g pm2

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY backend/ ./backend/

# 安装后端依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 复制前端构建文件
COPY --from=frontend-build /app/dist ./public

# 创建日志目录
RUN mkdir -p logs

# 复制PM2配置
COPY ecosystem.config.js ./

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]

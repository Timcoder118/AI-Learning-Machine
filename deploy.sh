#!/bin/bash

# AI知识聚合平台部署脚本
# 使用方法: ./deploy.sh [production|development]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-production}

if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "development" ]]; then
    log_error "无效的环境参数: $ENVIRONMENT"
    log_info "使用方法: ./deploy.sh [production|development]"
    exit 1
fi

log_info "开始部署AI知识聚合平台 (环境: $ENVIRONMENT)"

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2未安装，正在安装..."
        npm install -g pm2
    fi
    
    log_success "依赖检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 前端依赖
    log_info "安装前端依赖..."
    npm install
    
    # 后端依赖
    log_info "安装后端依赖..."
    cd backend && npm install && cd ..
    
    log_success "依赖安装完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "前端构建失败，dist目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ "$ENVIRONMENT" = "production" ]; then
            cp env.production .env
            log_info "已复制生产环境配置"
        else
            cp .env.example .env 2>/dev/null || log_warning ".env.example不存在，请手动创建.env文件"
        fi
    else
        log_warning ".env文件已存在，跳过配置"
    fi
    
    log_success "环境变量配置完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p logs
    mkdir -p data
    mkdir -p backend/logs
    
    log_success "目录创建完成"
}

# 数据库初始化
init_database() {
    log_info "初始化数据库..."
    
    # 这里可以添加数据库迁移脚本
    # node backend/migrate.js
    
    log_success "数据库初始化完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 停止现有服务
    pm2 stop ai-aggregator-backend 2>/dev/null || true
    pm2 delete ai-aggregator-backend 2>/dev/null || true
    
    # 启动新服务
    if [ "$ENVIRONMENT" = "production" ]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start ecosystem.config.js --env development
    fi
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if pm2 list | grep -q "ai-aggregator-backend.*online"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        pm2 logs ai-aggregator-backend --lines 20
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务完全启动
    sleep 10
    
    # 检查API健康状态
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        log_success "API健康检查通过"
    else
        log_error "API健康检查失败"
        pm2 logs ai-aggregator-backend --lines 20
        exit 1
    fi
    
    log_success "健康检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo
    echo "=== 部署信息 ==="
    echo "环境: $ENVIRONMENT"
    echo "前端地址: http://localhost:3000"
    echo "后端API: http://localhost:3001"
    echo "PM2状态: pm2 list"
    echo "查看日志: pm2 logs ai-aggregator-backend"
    echo "重启服务: pm2 restart ai-aggregator-backend"
    echo "停止服务: pm2 stop ai-aggregator-backend"
    echo
    echo "=== 生产环境部署建议 ==="
    echo "1. 配置Nginx反向代理"
    echo "2. 设置SSL证书"
    echo "3. 配置防火墙"
    echo "4. 设置监控告警"
    echo "5. 配置自动备份"
    echo
}

# 主部署流程
main() {
    check_dependencies
    install_dependencies
    setup_environment
    create_directories
    build_frontend
    init_database
    start_services
    health_check
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行部署
main

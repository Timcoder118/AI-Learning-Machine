@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM AI知识聚合平台Windows部署脚本
REM 使用方法: deploy.bat [production|development]

set "ENVIRONMENT=%1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=production"

echo [INFO] 开始部署AI知识聚合平台 (环境: %ENVIRONMENT%)

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js未安装，请先安装Node.js 18+
    pause
    exit /b 1
)

REM 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm未安装
    pause
    exit /b 1
)

REM 安装PM2（如果未安装）
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PM2未安装，正在安装...
    npm install -g pm2
)

echo [INFO] 安装项目依赖...

REM 前端依赖
echo [INFO] 安装前端依赖...
call npm install
if errorlevel 1 (
    echo [ERROR] 前端依赖安装失败
    pause
    exit /b 1
)

REM 后端依赖
echo [INFO] 安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] 后端依赖安装失败
    pause
    exit /b 1
)
cd ..

REM 构建前端
echo [INFO] 构建前端应用...
call npm run build
if errorlevel 1 (
    echo [ERROR] 前端构建失败
    pause
    exit /b 1
)

REM 创建必要目录
echo [INFO] 创建必要目录...
if not exist "logs" mkdir logs
if not exist "data" mkdir data
if not exist "backend\logs" mkdir backend\logs

REM 停止现有服务
echo [INFO] 停止现有服务...
pm2 stop ai-aggregator-backend 2>nul
pm2 delete ai-aggregator-backend 2>nul

REM 启动服务
echo [INFO] 启动服务...
if "%ENVIRONMENT%"=="production" (
    pm2 start ecosystem.config.js --env production
) else (
    pm2 start ecosystem.config.js --env development
)

REM 等待服务启动
timeout /t 5 /nobreak >nul

REM 检查服务状态
pm2 list | findstr "ai-aggregator-backend" | findstr "online" >nul
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    echo [INFO] 查看日志:
    pm2 logs ai-aggregator-backend --lines 20
    pause
    exit /b 1
)

echo [SUCCESS] 部署完成！
echo.
echo === 部署信息 ===
echo 环境: %ENVIRONMENT%
echo 前端地址: http://localhost:3000
echo 后端API: http://localhost:3001
echo.
echo === 常用命令 ===
echo 查看PM2状态: pm2 list
echo 查看日志: pm2 logs ai-aggregator-backend
echo 重启服务: pm2 restart ai-aggregator-backend
echo 停止服务: pm2 stop ai-aggregator-backend
echo.
echo === 生产环境部署建议 ===
echo 1. 配置Nginx反向代理
echo 2. 设置SSL证书
echo 3. 配置防火墙
echo 4. 设置监控告警
echo 5. 配置自动备份
echo.

pause

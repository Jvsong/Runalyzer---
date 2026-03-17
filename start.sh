#!/bin/bash

# Runalyzer 启动脚本
# 同时启动后端和前端服务

echo "🏃 启动 Runalyzer 跑步训练分析工具..."
echo "========================================"

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  端口 $port 已被占用"
        return 1
    fi
    return 0
}

# 检查后端端口
if ! check_port 8000; then
    echo "请关闭占用端口 8000 的程序，或修改后端端口"
    exit 1
fi

# 检查前端端口
if ! check_port 3000; then
    echo "请关闭占用端口 3000 的程序，或修改前端端口"
    exit 1
fi

# 启动后端服务
echo "🚀 启动后端服务 (端口: 8000)..."
cd backend
python -m venv venv 2>/dev/null || echo "虚拟环境已存在"
source venv/bin/activate 2>/dev/null || .\venv\Scripts\activate 2>/dev/null
pip install -r requirements.txt > /dev/null 2>&1 || echo "依赖安装中..."
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 启动前端服务
echo "🚀 启动前端服务 (端口: 3000)..."
cd frontend
npm install > /dev/null 2>&1 || echo "依赖安装中..."
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务启动成功！"
echo ""
echo "🔗 访问地址:"
echo "   前端界面: http://localhost:3000"
echo "   后端API:  http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "📋 使用说明:"
echo "   1. 打开浏览器访问 http://localhost:3000"
echo "   2. 上传您的跑步数据文件 (FIT/GPX/CSV)"
echo "   3. 查看分析结果和训练建议"
echo ""
echo "🛑 停止服务:"
echo "   按 Ctrl+C 停止所有服务"
echo ""

# 捕获 Ctrl+C 信号
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "服务已停止"; exit' INT

# 等待用户中断
wait
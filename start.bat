@echo off
chcp 65001 >nul
echo.
echo  启动 Runalyzer 跑步训练分析工具...
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "backend" (
    echo  错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)
if not exist "frontend" (
    echo  错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 检查端口是否被占用
setlocal enabledelayedexpansion

echo  检查端口占用情况...

REM 检查端口8000
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo  端口 8000 已被占用
    echo    请关闭占用端口 8000 的程序，或修改后端端口
    pause
    exit /b 1
)

REM 检查端口3000
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo  端口 3000 已被占用
    echo    请关闭占用端口 3000 的程序，或修改前端端口
    pause
    exit /b 1
)

echo  端口检查通过
echo.

REM 启动后端服务
echo  启动后端服务 (端口: 8000)...
cd backend

REM 检查Python环境
python --version >nul 2>&1
if errorlevel 1 (
    echo  未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM 创建或激活虚拟环境
if not exist "venv" (
    echo  创建Python虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo  安装Python依赖...
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo  依赖安装失败，尝试重新安装...
    pip install -r requirements.txt
)

REM 启动后端
start "Runalyzer Backend" python main.py
cd ..

echo  等待后端服务启动...
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo  启动前端服务 (端口: 3000)...
cd frontend

REM 检查Node.js环境
node --version >nul 2>&1
if errorlevel 1 (
    echo  未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 安装依赖
echo  安装Node.js依赖...
call npm install >nul 2>&1
if errorlevel 1 (
    echo  依赖安装失败，尝试重新安装...
    call npm install
)

REM 启动前端
start "Runalyzer Frontend" cmd /c "npm start"
cd ..

echo.
echo  服务启动成功！
echo.
echo  访问地址：
echo    前端界面：http://localhost:3000
echo    后端API： http://localhost:8000
echo    API文档：http://localhost:8000/docs
echo.
echo  使用说明：
echo    1. 打开浏览器访问 http://localhost:3000
echo    2. 上传您的跑步数据文件 (FIT/GPX/CSV)
echo    3. 查看分析结果和训练建议
echo.
echo  注意：
echo    这两个窗口将保持打开状态
echo    关闭这些窗口将停止服务
echo.
echo 按任意键退出此脚本，服务将继续在后台运行...
pause >nul

echo.
echo  正在停止服务...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo  服务已停止
pause
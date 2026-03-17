# 🏃 Runalyzer 使用指南

本文档详细介绍了如何安装、运行和使用 Runalyzer 跑步训练数据分析工具。

## 📦 系统要求

### 软件要求
- **Python 3.8+** (后端)
- **Node.js 14+** (前端)
- **npm** 或 **yarn** (包管理)
- **Git** (版本控制，可选)

### 硬件要求
- **内存**: 至少 4GB RAM
- **存储**: 至少 500MB 可用空间
- **网络**: 本地网络连接

### 平台支持
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, CentOS 7+)

## 🚀 快速安装

### 方法一：使用启动脚本（推荐）

#### Windows 用户
1. 双击 `start.bat` 文件
2. 按提示操作
3. 访问 http://localhost:3000

#### Linux/macOS 用户
```bash
# 添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法二：手动安装

#### 1. 后端安装
```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python main.py
```

#### 2. 前端安装
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm start
```

## 📁 项目结构说明

```
runalyzer/
├── start.bat           # Windows启动脚本
├── start.sh            # Linux/macOS启动脚本
├── test_api.py         # API测试脚本
├── sample_data/        # 示例数据
│   └── sample_activity.csv
├── backend/           # 后端服务
│   ├── main.py       # FastAPI主应用
│   ├── parser.py     # 文件解析器
│   ├── analysis.py   # 数据分析
│   └── requirements.txt
└── frontend/         # 前端界面
    ├── src/          # React源代码
    ├── public/       # 静态资源
    └── package.json
```

## 🎯 基本使用

### 1. 访问应用
打开浏览器访问：http://localhost:3000

### 2. 上传数据文件
支持三种格式：
- **FIT 文件**: Garmin设备导出格式
- **GPX 文件**: GPS交换格式（Strava等）
- **CSV 文件**: 通用格式（Apple Watch等）

上传方式：
- 拖放文件到上传区域
- 点击选择文件按钮
- 使用示例数据进行测试

### 3. 查看分析结果

#### 关键指标
- **心率指标**: 平均心率、最大心率、心率变异性
- **配速指标**: 平均配速、最快配速、配速稳定性
- **距离指标**: 总距离、爬升高度、训练时间
- **训练负荷**: TRIMP值

#### 可视化图表
1. **心率曲线**: 随时间变化的心率图表
2. **配速曲线**: 随时间变化的配速图表
3. **距离图表**: 累积距离变化
4. **海拔图表**: 海拔变化（如有数据）

#### 心率区间分析
- 5个心率区间的时间分布
- 各区间的百分比统计
- 饼图和进度条可视化

#### 训练建议
- 基于数据的个性化建议
- 训练强度评估
- 恢复建议

## 🔧 高级功能

### 使用示例数据
如果没有实际数据文件，可以：
1. 点击"查看示例数据"按钮
2. 使用 `sample_data/sample_activity.csv` 文件
3. 访问 `/api/sample` 端点获取模拟数据

### API测试
```bash
# 快速测试API是否正常
python test_api.py --quick

# 全面测试
python test_api.py --full

# 测试特定文件
python test_api.py --upload sample_data/sample_activity.csv
```

### 自定义配置

#### 后端配置
修改 `backend/main.py`：
```python
# 修改端口
uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)

# 修改CORS设置
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
```

#### 前端配置
修改 `frontend/package.json`：
```json
{
  "proxy": "http://localhost:8000",
  "scripts": {
    "start": "PORT=3001 react-scripts start"
  }
}
```

### 心率区间自定义
默认使用5个心率区间：
- Z1: < 120 bpm (恢复区)
- Z2: 120-140 bpm (有氧区)
- Z3: 140-160 bpm (节奏区)
- Z4: 160-180 bpm (阈值区)
- Z5: > 180 bpm (无氧区)

如需自定义，修改 `backend/analysis.py` 中的 `analyze_hr_zones` 函数。

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/macOS

# 修改端口
# 后端: 修改 backend/main.py 中的端口号
# 前端: 修改 frontend/package.json 中的代理设置
```

#### 2. Python依赖安装失败
```bash
# 升级pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

#### 3. Node.js依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

#### 4. 文件上传失败
- 检查文件格式（支持 .fit, .gpx, .csv）
- 检查文件大小（建议 < 50MB）
- 检查文件是否损坏

#### 5. 图表不显示
- 检查浏览器控制台错误
- 确保有足够的数据点
- 刷新页面重新加载

### 日志查看

#### 后端日志
后端服务启动时会显示日志，包含：
- 服务启动信息
- API请求记录
- 错误和异常信息

#### 前端日志
浏览器开发者工具中查看：
1. 按 F12 打开开发者工具
2. 选择 Console 标签页
3. 查看错误和警告信息

## 📊 数据格式说明

### CSV文件格式要求
建议包含以下列：
- `timestamp`: 时间戳（ISO格式或可解析格式）
- `heart_rate`: 心率（bpm）
- `pace`: 配速（分钟/公里）
- `distance`: 距离（公里）
- `cadence`: 步频（步/分钟）
- `altitude`: 海拔（米）

### FIT文件支持
自动解析以下字段：
- 心率、配速、距离
- 步频、海拔、位置
- 时间戳、速度

### GPX文件支持
自动解析以下字段：
- GPS位置（经纬度）
- 海拔、时间戳
- 自动计算距离和速度

## 🔄 更新和维护

### 更新代码
```bash
# 拉取最新代码
git pull origin main

# 更新依赖
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### 数据清理
- 上传的文件会在分析后自动删除
- 不会在服务器保存用户数据
- 所有处理都在内存中进行

### 备份配置
建议备份以下文件：
- `backend/requirements.txt`
- `frontend/package.json`
- 自定义的配置文件

## 🚀 性能优化

### 大文件处理
- 支持最大50MB文件
- 自动采样减少数据点
- 异步处理避免阻塞

### 内存管理
- 使用pandas高效处理数据
- 及时释放内存
- 流式处理大文件

### 响应速度
- 前端使用代码分割
- 后端使用异步API
- 图表数据采样

## 🔒 安全性说明

### 数据安全
- 不上传文件到远程服务器
- 不在服务器保存用户数据
- 所有处理在本地完成

### 网络安全
- 仅限本地访问
- CORS保护
- 输入验证和清理

### 隐私保护
- 不收集个人信息
- 不记录用户行为
- 完全开源可审计

## 📞 获取帮助

### 文档资源
1. **README.md**: 项目概述和安装说明
2. **USAGE.md**: 详细使用指南（本文档）
3. **API文档**: http://localhost:8000/docs

### 问题反馈
1. 检查故障排除部分
2. 查看日志文件
3. 创建Issue报告问题

### 社区支持
- GitHub Discussions
- 跑步爱好者论坛
- 开发者社区

## 🎉 下一步

### 学习资源
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [React官方文档](https://reactjs.org/)
- [Pandas用户指南](https://pandas.pydata.org/docs/)

### 扩展开发
1. 添加新的数据格式支持
2. 实现用户账户系统
3. 添加训练计划生成
4. 集成Strava API

### 贡献项目
欢迎贡献代码、报告问题、改进文档！

---

**祝您训练愉快，跑步健康！** 🏃‍♂️🏃‍♀️
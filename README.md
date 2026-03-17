# 🏃 Runalyzer - 跑步训练数据分析工具

一个类似 Intervals.icu 的跑步训练数据分析工具，支持上传 FIT、GPX、CSV 格式的跑步数据文件，进行详细的分析和可视化。

## ✨ 功能特性

- **📁 多格式支持**: 支持 FIT (Garmin), GPX (Strava等), CSV 格式
- **📊 数据分析**: 计算平均心率、最大心率、平均配速、总距离、总时间等关键指标
- **❤️ 心率区间分析**: 5个心率区间分析，可视化时间分布
- **📈 交互式图表**: 心率、配速、距离、海拔随时间变化的曲线图
- **💡 智能建议**: 基于分析结果生成个性化训练建议
- **🎨 现代化界面**: 响应式设计，美观易用的用户界面

## 🚀 技术栈

### 后端
- **FastAPI**: 高性能 Python Web 框架
- **Pandas + NumPy**: 数据处理和分析
- **fitparse**: FIT 文件解析
- **gpxpy**: GPX 文件解析

### 前端
- **React 18**: 前端框架
- **Recharts**: 数据可视化图表
- **React Bootstrap**: UI 组件库
- **Axios**: HTTP 请求库

## 📁 项目结构

```
runalyzer/
├── backend/                 # 后端代码
│   ├── main.py             # FastAPI 主应用
│   ├── parser.py           # 文件解析器
│   ├── analysis.py         # 数据分析模块
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── services/       # API 服务
│   │   └── styles/         # 样式文件
│   ├── public/             # 静态资源
│   └── package.json        # Node.js 依赖
└── README.md               # 项目说明
```

## 🛠️ 安装和运行

### 1. 后端设置

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 运行后端服务器
python main.py
```

后端将在 http://localhost:8000 启动。

### 2. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm start
```

前端将在 http://localhost:3000 启动。

## 📖 使用方法

1. 访问 http://localhost:3000
2. 点击上传区域或拖放跑步数据文件
3. 支持的文件格式：
   - `.fit`: Garmin 设备导出格式
   - `.gpx`: GPS 交换格式（Strava, Suunto 等）
   - `.csv`: 逗号分隔值格式
4. 查看分析结果：
   - 关键指标卡片
   - 心率区间分布
   - 交互式图表
   - 个性化训练建议

## 🔧 开发说明

### 后端 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | API 状态检查 |
| `/health` | GET | 健康检查 |
| `/api/upload` | POST | 上传和分析文件 |
| `/api/sample` | GET | 获取示例数据 |

### 数据解析

- **FIT 文件**: 使用 `fitparse` 库解析 Garmin 设备数据
- **GPX 文件**: 使用 `gpxpy` 库解析 GPS 轨迹数据
- **CSV 文件**: 使用 `pandas` 库解析通用格式数据

### 数据分析指标

1. **心率指标**: 平均心率、最大心率、心率变异性
2. **配速指标**: 平均配速、最快配速、配速稳定性
3. **距离指标**: 总距离、爬升高度
4. **时间指标**: 总时间、训练负荷（TRIMP）

## 🎯 一周开发计划

| 天数 | 任务 | 状态 |
|------|------|------|
| 第1天 | 项目架构设计，创建基础框架 | ✅ 完成 |
| 第2天 | 后端API开发，数据解析实现 | ✅ 完成 |
| 第3天 | 前端界面开发，组件实现 | ✅ 完成 |
| 第4天 | 图表可视化，数据分析 | ✅ 完成 |
| 第5天 | 训练建议生成，UI优化 | ✅ 完成 |
| 第6天 | 集成测试，Bug修复 | 🔄 进行中 |
| 第7天 | 文档编写，最终优化 | ⏳ 待开始 |

## 📊 心率区间定义

| 区间 | 名称 | 心率范围 | 训练效果 |
|------|------|----------|----------|
| Z1 | 恢复区 | < 120 bpm | 恢复、热身 |
| Z2 | 有氧区 | 120-140 bpm | 基础有氧能力 |
| Z3 | 节奏区 | 140-160 bpm | 有氧能力提升 |
| Z4 | 阈值区 | 160-180 bpm | 乳酸阈值训练 |
| Z5 | 无氧区 | > 180 bpm | 最大摄氧量提升 |

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 提交 Pull Request

## 🙏 致谢

- 感谢 [Intervals.icu](https://intervals.icu) 的灵感
- 感谢所有开源项目的贡献者
- 感谢跑步社区的支持

---

**Made with ❤️ for runners**
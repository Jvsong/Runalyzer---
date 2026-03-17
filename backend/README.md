# Runalyzer 后端 API

基于 FastAPI 的跑步训练数据分析后端服务。

## 🚀 快速开始

### 安装依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 运行服务

```bash
python main.py
```

服务将在 http://localhost:8000 启动。

### API 文档

启动服务后，访问以下地址查看 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 项目结构

```
backend/
├── main.py             # FastAPI 主应用
├── parser.py           # 文件解析模块
├── analysis.py         # 数据分析模块
├── requirements.txt    # Python 依赖
└── README.md          # 说明文档
```

## 🔧 核心模块

### 1. parser.py - 文件解析器

支持三种文件格式的解析：

#### FIT 文件解析 (`parse_fit_file`)
- 解析 Garmin 设备导出的 FIT 文件
- 提取心率、配速、距离、海拔等数据
- 使用 `fitparse` 库

#### GPX 文件解析 (`parse_gpx_file`)
- 解析 GPS 交换格式文件
- 提取位置、海拔、时间数据
- 计算距离和速度
- 使用 `gpxpy` 库

#### CSV 文件解析 (`parse_csv_file`)
- 解析通用 CSV 格式
- 自动识别列名
- 标准化数据格式
- 使用 `pandas` 库

### 2. analysis.py - 数据分析模块

#### 指标计算 (`calculate_basic_metrics`)
- **心率指标**: 平均心率、最大心率、心率变异性
- **配速指标**: 平均配速、最快配速、配速稳定性
- **距离指标**: 总距离、爬升高度、下降高度
- **时间指标**: 总时间、训练负荷（TRIMP）
- **其他指标**: 平均步频、海拔数据

#### 心率区间分析 (`analyze_hr_zones`)
- 5个心率区间的时间分布统计
- 各区间的百分比计算
- 支持自定义心率区间

#### 训练建议生成 (`generate_training_suggestions`)
- 基于心率区间分布的建议
- 基于训练负荷的建议
- 基于步频数据的建议
- 基于距离和时间的建议

## 📡 API 端点

### GET `/`
- **描述**: API 状态检查
- **响应**:
```json
{
  "message": "Runalyzer API is running",
  "version": "1.0.0"
}
```

### GET `/health`
- **描述**: 健康检查端点
- **响应**:
```json
{
  "status": "healthy"
}
```

### POST `/api/upload`
- **描述**: 上传和分析跑步数据文件
- **请求**: `multipart/form-data`
- **参数**: `file` (FIT/GPX/CSV 文件)
- **响应**: 包含完整分析结果的 JSON

### GET `/api/sample`
- **描述**: 获取示例数据（用于测试）
- **响应**: 模拟的分析结果 JSON

## 📊 数据格式

### 上传响应格式

```json
{
  "filename": "activity.fit",
  "metadata": {
    "file_type": "FIT",
    "data_points": 1200,
    "has_hr": true,
    "has_gps": true,
    "has_altitude": true,
    "timestamp_range": {
      "start": "2024-01-15T08:00:00",
      "end": "2024-01-15T09:30:00"
    }
  },
  "metrics": {
    "avg_heart_rate": 155.5,
    "max_heart_rate": 185.0,
    "avg_pace": 5.2,
    "total_distance": 10.5,
    "total_time_minutes": 55.5,
    "training_load": 45.3
  },
  "hr_zones": [
    {
      "zone": "Z1",
      "name": "恢复区",
      "time_minutes": 5.0,
      "percentage": 9.0
    }
  ],
  "time_series": {
    "timestamps": ["08:00:00", "08:05:00"],
    "heart_rates": [120, 125],
    "paces": [6.0, 5.8],
    "distances": [0, 0.5]
  },
  "suggestions": [
    "训练强度分布良好",
    "建议增加轻松跑比例"
  ]
}
```

## 🔍 错误处理

### 常见错误状态码

| 状态码 | 描述 | 可能原因 |
|--------|------|----------|
| 400 | 错误请求 | 不支持的文件格式 |
| 413 | 请求实体过大 | 文件超过大小限制 |
| 415 | 不支持的媒体类型 | 文件格式错误 |
| 500 | 服务器内部错误 | 文件解析失败 |

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

## ⚙️ 配置选项

可以通过环境变量配置：

```bash
# 服务器配置
export RUNALYZER_HOST=0.0.0.0
export RUNALYZER_PORT=8000

# 文件上传配置
export MAX_UPLOAD_SIZE=52428800  # 50MB
export ALLOWED_EXTENSIONS=.fit,.gpx,.csv
```

## 🧪 测试

### 运行测试

```bash
# 安装测试依赖
pip install pytest httpx

# 运行测试
pytest tests/
```

### 测试文件

在 `sample_data/` 目录中提供示例文件：
- `sample.fit`: FIT 格式示例
- `sample.gpx`: GPX 格式示例
- `sample.csv`: CSV 格式示例

## 🔄 开发说明

### 添加新的文件格式支持

1. 在 `parser.py` 中添加新的解析函数
2. 在 `parse_activity_file` 函数中添加格式识别
3. 更新 `requirements.txt` 添加必要的依赖库

### 添加新的分析指标

1. 在 `analysis.py` 的 `calculate_basic_metrics` 函数中添加计算逻辑
2. 更新响应数据结构
3. 在前端组件中显示新指标

## 🐛 故障排除

### 常见问题

1. **fitparse 安装失败**
   - 确保 Python 版本 >= 3.8
   - 尝试: `pip install --upgrade pip setuptools wheel`

2. **文件解析失败**
   - 检查文件格式是否正确
   - 确保文件未损坏
   - 查看服务器日志获取详细错误信息

3. **内存使用过高**
   - 大文件可能导致内存溢出
   - 考虑实现流式解析
   - 增加服务器内存或限制文件大小

### 查看日志

```bash
# 启用详细日志
python main.py --log-level debug
```

## 📈 性能优化

- 使用 pandas 进行向量化计算
- 对大型文件进行采样处理
- 实现数据缓存机制
- 使用异步处理大文件上传

## 🔒 安全性

- 限制文件上传大小
- 验证文件格式和内容
- 使用临时文件处理，完成后清理
- 实现 CORS 保护

## 📄 许可证

MIT License - 详见项目根目录 LICENSE 文件。
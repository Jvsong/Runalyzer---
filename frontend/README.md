# Runalyzer 前端

基于 React 的跑步训练数据分析前端界面。

## 🚀 快速开始

### 安装依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

### 运行开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
```

构建文件将生成在 `build/` 目录中。

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── index.html         # HTML 模板
│   └── manifest.json      # PWA 清单
├── src/                   # 源代码
│   ├── components/        # React 组件
│   │   ├── FileUpload.js  # 文件上传组件
│   │   ├── MetricsDisplay.js # 指标显示组件
│   │   ├── ChartsDisplay.js  # 图表显示组件
│   │   ├── HrZonesDisplay.js # 心率区间组件
│   │   └── SuggestionsDisplay.js # 建议组件
│   ├── services/          # API 服务
│   │   └── api.js         # API 接口定义
│   ├── styles/            # 样式文件
│   │   ├── App.css        # 应用样式
│   │   └── index.css      # 全局样式
│   ├── App.js             # 主应用组件
│   └── index.js           # 应用入口
├── package.json           # 项目配置和依赖
└── README.md              # 说明文档
```

## 🎨 组件说明

### 1. FileUpload - 文件上传组件
- 支持拖放上传
- 支持点击选择文件
- 文件格式验证
- 上传进度显示

### 2. MetricsDisplay - 指标显示组件
- 显示关键指标卡片
- 分组显示（心率、配速、距离等）
- 图标和颜色编码
- 响应式布局

### 3. ChartsDisplay - 图表显示组件
- 交互式图表（心率、配速、距离、海拔）
- 图表标签切换
- 工具提示和缩放
- 响应式设计

### 4. HrZonesDisplay - 心率区间组件
- 心率区间饼图
- 各区时间统计
- 进度条显示
- 训练建议

### 5. SuggestionsDisplay - 建议组件
- 个性化训练建议
- 建议分类和图标
- 训练原则说明
- 下一步训练计划

## 🔌 API 服务

### api.js - API 接口服务

主要 API 函数：

#### `analyzeActivity(file)`
- **功能**: 上传和分析跑步数据文件
- **参数**: `file` - 文件对象
- **返回**: Promise，解析为分析结果

#### `getSampleData()`
- **功能**: 获取示例数据
- **返回**: Promise，解析为示例数据

#### `getHealthStatus()`
- **功能**: 检查 API 健康状态
- **返回**: Promise，解析为健康状态

### 错误处理

API 服务包含完整的错误处理：
- 网络错误处理
- 服务器错误处理
- 用户友好的错误消息
- 超时设置

## 🎯 功能特性

### 用户界面
- ✅ 响应式设计，支持移动端
- ✅ 现代化卡片式布局
- ✅ 平滑的过渡动画
- ✅ 加载状态指示器

### 数据可视化
- ✅ 交互式折线图
- ✅ 心率区间饼图
- ✅ 动态图表切换
- ✅ 工具提示和缩放

### 用户体验
- ✅ 拖放文件上传
- ✅ 实时进度反馈
- ✅ 错误处理和提示
- ✅ 示例数据演示

## 📱 响应式设计

### 断点设置
- **移动端**: < 768px
- **平板**: 768px - 1024px
- **桌面端**: > 1024px

### 布局调整
- 移动端: 单列布局
- 平板: 双列布局
- 桌面端: 多列布局

## 🎨 样式体系

### 颜色方案
- **主色调**: `#667eea` - `#764ba2` (渐变)
- **成功色**: `#4CAF50`
- **警告色**: `#ffc107`
- **错误色**: `#f44336`
- **心率区间色**: Z1-Z5 不同颜色

### 字体
- 主字体: 系统字体栈
- 代码字体: monospace
- 图标: Bootstrap Icons

### 间距和尺寸
- 使用 Bootstrap 的间距工具类
- 卡片圆角: 15px
- 阴影: 多层阴影系统

## 🔧 开发说明

### 添加新组件

1. 在 `src/components/` 中创建新组件文件
2. 导入必要的依赖
3. 实现组件逻辑和样式
4. 在主应用中导入和使用

### 添加新图表类型

1. 在 `ChartsDisplay.js` 中添加新的图表渲染函数
2. 在 `chartComponents` 对象中注册
3. 在 `chartTabs` 数组中添加标签
4. 更新数据处理逻辑

### 样式定制

1. 修改 `App.css` 中的全局样式
2. 在组件中添加内联样式或 CSS 模块
3. 使用 Bootstrap 工具类进行快速布局

## 🧪 测试

### 运行测试

```bash
npm test
```

### 测试覆盖
- 组件渲染测试
- 用户交互测试
- API 调用测试
- 错误处理测试

## 📦 构建和部署

### 构建配置

```bash
# 开发构建
npm start

# 生产构建
npm run build

# 分析构建文件大小
npm run analyze
```

### 环境变量

```bash
# .env.development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0

# .env.production
REACT_APP_API_URL=https://api.runalyzer.com
REACT_APP_VERSION=1.0.0
```

### 部署到静态服务器

```bash
# 构建生产版本
npm run build

# 部署到服务器
# 将 build/ 目录内容复制到服务器
```

## 🔄 与后端集成

### 开发环境
- 前端: http://localhost:3000
- 后端: http://localhost:8000
- 代理配置: 在 `package.json` 中设置 `"proxy": "http://localhost:8000"`

### 生产环境
- 配置 `REACT_APP_API_URL` 环境变量
- 确保 CORS 配置正确
- 使用 HTTPS 连接

## 🐛 故障排除

### 常见问题

1. **API 连接失败**
   - 检查后端服务是否运行
   - 检查网络连接
   - 查看浏览器控制台错误

2. **图表不显示**
   - 检查数据格式是否正确
   - 检查 Recharts 版本兼容性
   - 查看控制台警告信息

3. **文件上传失败**
   - 检查文件格式支持
   - 检查文件大小限制
   - 查看服务器错误响应

### 调试工具

- React Developer Tools 浏览器扩展
- 浏览器开发者工具
- 网络请求监控
- 控制台日志

## 📈 性能优化

### 代码分割
- React.lazy() 动态导入
- 路由级别的代码分割

### 资源优化
- 图片压缩
- 字体子集化
- 代码压缩和混淆

### 缓存策略
- 服务工作者缓存
- 浏览器缓存头
- CDN 缓存

## 🔒 安全性

- 输入验证和清理
- XSS 防护
- CSRF 保护
- HTTPS 强制

## 📄 许可证

MIT License - 详见项目根目录 LICENSE 文件。
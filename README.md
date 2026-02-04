# 411吉他工作室维修预约系统

一个基于 HTML/CSS/JavaScript + Supabase 构建的吉他维修预约管理系统。

## 功能特性

### 客户端功能

- 在线提交维修预约单
- 选择吉他类型（木吉他、古典吉他、电吉他、贝斯、尤克里里、其他）
- 填写吉他品牌和型号
- 详细描述问题
- 多文件上传（支持 JPG、PNG、WEBP、MP4，最大 10MB，最多 5 个文件）
- 实时查看日期闲忙状态
  - 空闲（绿色）：≤3 单/天
  - 一般（黄色）：4-6 单/天
  - 繁忙（红色）：>6 单/天
- 选择预约时间段（上午 10:00-12:00，下午 13:00-18:00）
- 设置期望完成日期
- 表单实时验证
- 服务条款模态框展示

### 管理后台功能

#### 认证与安全
- Supabase Auth 管理员认证登录
- 会话管理与自动登出

#### 订单管理（维修单管理标签页）
- 查看所有维修订单（卡片视图）
- 实时统计数据（待排期、进行中、已完成、总订单数）
- 数据可视化图表
  - 订单状态分布（饼图）
  - 近7天订单趋势（折线图）
- 多维度筛选
  - 按状态筛选（待排期、已确认、进行中、延期中、已完成、已取消）
  - 按日期筛选
  - 按电话号码搜索
- 查看订单详情（包括客户信息、吉他信息、图片/视频等）
- **快速状态修改**：点击状态徽章即可快速切换订单状态
- 更改订单详细信息
  - 分配维修人员（木木、达三、老谢、其他）
  - 修改预约日期和时间
  - 添加管理员备注
- 删除已取消的订单

#### 维修工单（表格视图）
- 表格形式展示所有工单
- 按状态、日期、电话筛选
- 快速查看订单ID、客户电话、吉他信息、问题描述
- 显示预约时间和排班人员
- 点击状态徽章快速修改状态
- 查看详情和更改订单信息

#### 日历视图
- 月度日历展示预约分布
- 日期闲忙状态可视化
  - 空闲（绿色）：≤3 单/天
  - 一般（黄色）：4-6 单/天
  - 繁忙（红色）：>6 单/天
- 周末标识
- 点击日期查看时间段详情
  - 显示每个时间段的预约数量
  - 时间段状态（空闲/一般/繁忙）
  - 查看该时间段的所有订单
  - 显示管理员备注
- 月份切换（上月/下月）

#### 快捷操作
- **导出订单数据**
  - 按状态筛选导出
  - 按日期范围导出
  - CSV 格式下载
- **批量更改状态**
  - 选择当前状态
  - 批量更改为新状态
  - 按日期筛选批量操作

### 首页功能

- 工作室介绍与服务展示
- 实时闲忙日历展示
- 路线指引与地址导航
- 微信二维码扫码添加
- 社交媒体链接

## 设计特色

### UI/UX 设计
- **清爽天蓝色主题**：专业且易于长时间使用，避免视觉疲劳
- **现代卡片式布局**：清晰的信息层级和视觉分组
- **无衬线字体**：使用 Noto Sans SC，清晰易读
- **柔和阴影效果**：营造层次感而不过度
- **响应式设计**：适配桌面、平板、手机等多种设备
- **流畅动画**：250ms 过渡效果，提升交互体验
- **语义化颜色**：
  - 主色调：天蓝色 (#0ea5e9)
  - 成功：绿色 (#10b981)
  - 警告：橙色 (#f59e0b)
  - 错误：红色 (#ef4444)

### 交互优化
- **快速状态修改**：点击状态徽章即可弹出下拉菜单，无需打开完整表单
- **乐观更新**：状态修改立即反映在UI上，提升响应速度
- **智能边界检测**：下拉菜单自动调整位置，避免超出屏幕
- **键盘支持**：ESC 键关闭下拉菜单
- **悬停反馈**：所有可交互元素都有明确的悬停状态

## 技术栈

### 前端

- **HTML5**: 语义化标签，支持无障碍访问 (ARIA)
- **CSS3**:
  - BEM 命名规范
  - CSS 变量（主题系统）
  - Flexbox 和 Grid 布局
  - 响应式设计
  - 清爽天蓝色主题
- **JavaScript ES6+**:
  - ES Modules 模块化开发
  - async/await 异步处理
  - 事件委托
  - 乐观更新模式

### 数据可视化

- **Chart.js 4.4.1**:
  - 饼图（订单状态分布）
  - 折线图（订单趋势）
  - 响应式图表
  - 自定义配色

### 后端 (BaaS)

- **Supabase**:
  - PostgreSQL 数据库
  - Supabase Auth（管理员认证）
  - Supabase Storage（图片/视频存储）
  - Row Level Security (RLS)
  - 实时订阅（可选）

### 开发工具

- **ESLint**: JavaScript 代码检查
- **Stylelint**: CSS 代码检查
- **Prettier**: 代码格式化
- **live-server**: 本地开发服务器
- **clean-css-cli**: CSS 压缩
- **terser**: JavaScript 压缩

## 项目结构

```
activity/
├── index.html                  # 首页 - 工作室介绍、服务展示、闲忙日历
├── booking.html                # 维修预约页面
├── admin.html                  # 管理员登录页面
├── admin-dashboard.html        # 管理后台 - 订单管理、日历视图、数据可视化
├── about.html                  # 关于我们页面
├── activities.html             # 活动页面
├── activity-detail.html        # 活动详情页面
├── user-profile.html           # 用户资料页面
├── diagnostic.html             # 诊断页面
├── test-supabase.html          # Supabase 测试页面
├── CNAME                       # GitHub Pages 自定义域名配置
├── package.json                # 项目配置与依赖
├── .env.example                # 环境变量示例
├── .htaccess                   # Apache 服务器配置
│
├── css/
│   ├── layout-new.css          # 新版主布局样式（暖色木纹主题）
│   ├── layout.css              # 旧版布局样式
│   ├── responsive-new.css      # 新版响应式样式
│   ├── responsive.css          # 旧版响应式样式
│   ├── animations-new.css      # 新版动画效果
│   ├── animations.css          # 旧版动画效果
│   └── booking.css             # 预约页面专用样式
│
├── js/
│   ├── supabase-client.js      # Supabase 客户端与 API
│   ├── main.js                 # 核心功能与初始化
│   ├── form-handler.js         # 表单验证与提交处理
│   ├── admin-dashboard.js      # 管理后台功能（含快速状态修改）
│   ├── admin.js                # 管理员登录功能
│   ├── repair-calendar.js      # 时间段管理与选择
│   ├── image-upload.js         # 图片/视频上传
│   ├── calendar.js             # 日历组件
│   └── gallery.js              # 图库功能
│
├── docs/
│   ├── database-schema.md      # 数据库设计文档
│   ├── guitar-repairs-schema.md # 维修订单表结构
│   ├── supabase-setup-guide.md # Supabase 配置指南
│   ├── admin-guide.md          # 管理员使用指南
│   └── tiaokuan.txt            # 服务条款
│
├── images/
│   └── background/             # 背景图片与素材
│       ├── logo.png            # 工作室 Logo
│       ├── qrcode.png          # 微信二维码
│       └── address.jpg         # 地址导航图
│
└── README.md                   # 项目说明
```

## 快速开始

### 1. 配置 Supabase

请按照 `docs/supabase-setup-guide.md` 中的说明配置 Supabase：

1. 创建 `guitar_repairs` 数据库表
2. 配置 Row Level Security (RLS) 策略
3. 创建 `guitar-images` Storage Bucket
4. 配置 Storage 策略
5. 设置管理员账号（Supabase Auth）

### 2. 配置项目

1. 克隆项目到本地
2. 复制 `.env.example` 为 `.env`
3. 打开 `js/supabase-client.js`
4. 替换 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 为你的 Supabase 项目凭证

```javascript
const SUPABASE_URL = 'your_supabase_project_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

### 3. 安装依赖

```bash
npm install
```

### 4. 运行项目

```bash
# 使用 npm（推荐）
npm run dev

# 或使用 Python
python -m http.server 8000

# 或使用 PHP
php -S localhost:8000
```

然后在浏览器中访问 `http://localhost:8000`

## 使用说明

### 客户预约流程

1. 访问首页，点击"立即预约"或直接访问 `booking.html`
2. 填写客户电话（必填）
3. 选择吉他类型，填写品牌和型号（可选）
4. 详细描述吉他问题
5. 上传吉他图片或视频（可选，最多 5 个文件）
6. 查看日历闲忙状态，选择合适的预约日期
7. 选择预约时间段
8. 设置期望完成日期
9. 同意服务条款，提交维修单

### 管理员操作流程

#### 登录
1. 访问 `admin.html` 进入管理员登录页面
2. 使用 Supabase Auth 账号登录
3. 进入 `admin-dashboard.html` 管理后台

#### 查看订单（维修单管理）
1. 查看统计数据和可视化图表
2. 使用筛选器按状态、日期或电话筛选订单
3. 点击订单卡片查看详情
4. **快速修改状态**：点击状态徽章，从下拉菜单选择新状态
5. 点击"更改订单状态"按钮修改详细信息（排班人员、预约时间、备注）

#### 查看工单（维修工单）
1. 切换到"维修工单"标签页
2. 在表格中查看所有订单
3. 使用筛选器快速定位订单
4. 点击状态徽章快速修改状态
5. 点击"查看"按钮查看详情

#### 日历视图
1. 切换到"日历视图"标签页
2. 查看月度预约分布和闲忙状态
3. 点击日期查看该日所有时间段的预约情况
4. 点击有备注的时间段查看订单详情和备注
5. 使用"上月"/"下月"按钮切换月份

#### 快捷操作
1. 切换到"快捷操作"标签页
2. **导出订单**：选择状态和日期范围，点击"导出 CSV"
3. **批量更改状态**：选择当前状态、新状态和日期，点击"批量更新"

## 数据库设计

### guitar_repairs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 订单 ID（主键）|
| customer_name | varchar(100) | 客户姓名/电话 |
| customer_email | varchar(255) | 客户邮箱 |
| customer_phone | varchar(20) | 客户电话 |
| guitar_type | varchar(50) | 吉他类型 |
| guitar_brand | varchar(100) | 吉他品牌 |
| guitar_model | varchar(100) | 吉他型号 |
| problem_description | text | 问题描述 |
| image_urls | varchar[] | 图片/视频 URL 数组 |
| appointment_date | date | 预约日期 |
| appointment_time | varchar(20) | 预约时间段 |
| expected_completion_date | date | 期望完成日期 |
| customer_notes | text | 客户备注 |
| status | varchar(20) | 订单状态 |
| assigned_to | varchar(50) | 排班人员 |
| admin_notes | text | 管理员备注 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

详细的数据库设计请参考 `docs/guitar-repairs-schema.md`

## 营业时间配置

- **营业日**: 周一至周日（全周营业）
- **上午时段**: 10:00 - 12:00
- **下午时段**: 13:00 - 18:00
- **时间段单位**: 1 小时
- **可预约范围**: 未来 30 天

## 日期闲忙状态

- **空闲**（绿色）: 该日期预约数 ≤ 3
- **一般**（黄色）: 该日期预约数 4-6
- **繁忙**（红色）: 该日期预约数 > 6

## 订单状态

| 状态 | 说明 | 颜色 |
|------|------|------|
| `pending` | 待排期 | 黄色 |
| `confirmed` | 已确认 | 蓝色 |
| `in_progress` | 进行中 | 紫色 |
| `delayed` | 延期中 | 红色 |
| `completed` | 已完成 | 绿色 |
| `cancelled` | 已取消 | 灰色 |

## 维修人员

- 木木
- 达三
- 老谢
- 其他

## 开发说明

### 代码规范

- **CSS**: 使用 BEM 命名规范
- **JavaScript**: ES6+ 模块化开发
- **代码检查**: ESLint + Stylelint
- **代码格式化**: Prettier

### 可用脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本（压缩 CSS/JS）
npm run build

# JavaScript 代码检查
npm run lint:js

# CSS 代码检查
npm run lint:css

# 代码格式化
npm run format
```

## 部署

项目通过 GitHub Pages 部署，自定义域名配置在 `CNAME` 文件中。

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 性能优化

- **乐观更新**：状态修改立即反映在UI上，后台异步更新数据库
- **图表缓存**：避免重复渲染图表
- **懒加载**：按需加载图片和视频
- **CSS 变量**：统一主题管理，易于维护
- **事件委托**：减少事件监听器数量

## 安全性

- 使用 Supabase Row Level Security (RLS) 保护数据
- Supabase Auth 管理员认证
- 表单输入验证（前端 + 后端）
- 文件上传大小限制（10MB）
- 文件类型限制（JPG、PNG、WEBP、MP4）
- XSS 防护（输入转义）
- CSRF 防护（Supabase 内置）

## 已完成功能

- [x] 客户在线预约系统
- [x] 管理员认证登录
- [x] 订单管理（卡片视图）
- [x] 维修工单（表格视图）
- [x] 日历视图
- [x] 快速状态修改
- [x] 数据可视化图表
- [x] 批量操作
- [x] 导出 CSV
- [x] 多文件上传
- [x] 响应式设计
- [x] 清爽天蓝色主题

## 未来改进

- [ ] 邮件通知功能（预约确认、状态更新）
- [ ] 短信通知功能
- [ ] 客户查询订单功能（通过电话）
- [ ] 多语言支持
- [ ] 移动端 App
- [ ] 支付集成
- [ ] 评价系统
- [ ] 实时通知（WebSocket）
- [ ] 订单打印功能
- [ ] 数据分析报表

## 许可证

MIT License

## 联系方式

- **工作室**: 411吉他工作室
- **联系人**: 木木
- **电话**: 13355788990
- **地址**: 深圳市福田区八卦岭工业区618栋3楼320
- **社交媒体**:
  - 小红书: 411吉他工作室
  - 哔哩哔哩: 411吉他工作室
  - 微信: 扫码添加

---

**注意**: 这是一个生产项目，用于 411 吉他工作室的实际业务运营。

## 更新日志

### v2.0.0 (2026-02-05)
- 全新管理后台设计（清爽天蓝色主题）
- 新增快速状态修改功能
- 新增数据可视化图表
- 新增维修工单表格视图
- 新增日历视图时间段详情
- 新增批量操作功能
- 优化响应式设计
- 改进交互体验

### v1.0.0 (2025-12-01)
- 初始版本发布
- 客户预约系统
- 管理后台基础功能
- 订单管理
- 日历视图

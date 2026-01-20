# 吉他维修预约系统

一个基于 HTML/CSS/JavaScript + Supabase 构建的吉他维修预约管理系统。

## 功能特性

### 客户端功能
- ✅ 在线提交维修预约单
- ✅ 选择吉他类型（木吉他、古典吉他、电吉他、贝斯、其他）
- ✅ 填写吉他品牌和型号
- ✅ 详细描述问题
- ✅ 上传吉他图片（支持 JPG、PNG、WEBP，最大 5MB）
- ✅ 实时查看时间段闲忙状态
  - 空闲：≤1 个预约
  - 一般：2-3 个预约
  - 繁忙：>3 个预约
- ✅ 选择预约时间段（工作日 9:00-18:00，每小时一个时间段）
- ✅ 设置期望完成日期
- ✅ 表单实时验证

### 管理后台功能
- ✅ 查看所有维修订单
- ✅ 按状态筛选订单（待确认、已确认、维修中、已完成、已取消）
- ✅ 按日期筛选订单
- ✅ 查看订单详情（包括客户信息、吉他信息、图片等）
- ✅ 更改订单状态
- ✅ 添加管理员备注
- ✅ 删除已取消的订单
- ✅ 实时统计数据（待确认、进行中、已完成、总订单数）

## 技术栈

### 前端
- **HTML5**: 语义化标签，支持无障碍访问
- **CSS3**: BEM 命名规范，CSS 变量，响应式设计
- **JavaScript ES6+**: 模块化开发，异步处理

### 后端
- **Supabase**:
  - PostgreSQL 数据库
  - Supabase Storage（图片存储）
  - Row Level Security (RLS)

## 项目结构

```
D:\activity\activity\
├── index.html              # 首页
├── booking.html            # 维修预约页面
├── admin.html              # 管理后台
├── about.html              # 关于我们
├── css/
│   ├── layout.css          # 基础布局和组件样式
│   ├── responsive.css      # 响应式设计
│   └── animations.css      # 动画效果
├── js/
│   ├── supabase-client.js  # Supabase 客户端和 API
│   ├── main.js             # 核心功能
│   ├── form-handler.js     # 表单处理
│   ├── repair-calendar.js  # 时间段管理
│   ├── image-upload.js     # 图片上传
│   └── admin.js            # 管理后台功能
├── docs/
│   ├── guitar-repairs-schema.md      # 数据库设计文档
│   └── supabase-setup-guide.md       # Supabase 配置指南
└── README.md               # 项目说明
```

## 快速开始

### 1. 配置 Supabase

请按照 `docs/supabase-setup-guide.md` 中的说明配置 Supabase：

1. 创建 `guitar_repairs` 数据库表
2. 配置 Row Level Security (RLS) 策略
3. 创建 `guitar-images` Storage Bucket
4. 配置 Storage 策略

### 2. 配置项目

1. 克隆项目到本地
2. 打开 `js/supabase-client.js`
3. 替换 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 为你的 Supabase 项目凭证

```javascript
const SUPABASE_URL = 'your_supabase_project_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

### 3. 运行项目

使用本地开发服务器运行项目：

```bash
# 使用 npm
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
2. 填写客户信息（姓名、邮箱、电话）
3. 选择吉他类型，填写品牌和型号（可选）
4. 详细描述吉他问题
5. 上传吉他图片（可选）
6. 选择预约日期（只能选择工作日，未来 30 天内）
7. 查看时间段闲忙状态，选择合适的时间段
8. 设置期望完成日期
9. 同意服务条款，提交维修单

### 管理员操作流程

1. 访问 `admin.html` 进入管理后台
2. 查看所有订单列表和统计数据
3. 使用筛选器按状态或日期筛选订单
4. 点击"查看详情"查看订单完整信息
5. 点击"更改状态"更新订单状态并添加备注
6. 对于已取消的订单，可以点击"删除"永久删除

## 数据库设计

### guitar_repairs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 订单 ID（主键）|
| customer_name | varchar(100) | 客户姓名 |
| customer_email | varchar(255) | 客户邮箱 |
| customer_phone | varchar(20) | 客户电话 |
| guitar_type | varchar(50) | 吉他类型 |
| guitar_brand | varchar(100) | 吉他品牌 |
| guitar_model | varchar(100) | 吉他型号 |
| problem_description | text | 问题描述 |
| image_url | varchar(500) | 吉他图片 URL |
| appointment_date | date | 预约日期 |
| appointment_time | varchar(20) | 预约时间段 |
| expected_completion_date | date | 期望完成日期 |
| status | varchar(20) | 订单状态 |
| admin_notes | text | 管理员备注 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

详细的数据库设计请参考 `docs/guitar-repairs-schema.md`

## 营业时间配置

- **工作日**: 周一至周五
- **营业时间**: 9:00 - 18:00
- **时间段单位**: 1 小时
- **可预约范围**: 未来 30 天

## 时间段闲忙状态

- **空闲**（绿色）: 该时间段预约数 ≤ 1
- **一般**（黄色）: 该时间段预约数 = 2-3
- **繁忙**（红色）: 该时间段预约数 > 3

## 订单状态

- `pending`: 待确认
- `confirmed`: 已确认
- `in_progress`: 维修中
- `completed`: 已完成
- `cancelled`: 已取消

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

# 构建生产版本
npm run build

# 代码检查
npm run lint:js
npm run lint:css

# 代码格式化
npm run format
```

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 安全性

- 使用 Supabase Row Level Security (RLS) 保护数据
- 表单输入验证（前端 + 后端）
- 图片上传大小限制（5MB）
- 图片类型限制（JPG、PNG、WEBP）

## 未来改进

- [ ] 邮件通知功能（预约确认、状态更新）
- [ ] 短信通知功能
- [ ] 客户查询订单功能（通过邮箱）
- [ ] 多语言支持
- [ ] 移动端 App
- [ ] 支付集成
- [ ] 评价系统

## 许可证

MIT License

## 联系方式

- 邮箱: repair@guitarservice.com
- 电话: 123-456-7890
- 营业时间: 周一至周五 9:00-18:00

---

**注意**: 这是一个演示项目，请根据实际需求进行调整和完善。

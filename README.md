# 音乐活动预约平台

一个简单、便捷的音乐活动预约网站，专注于吉他课程、音乐会和工作坊的预约服务。

## 特点

- 响应式设计，支持移动端和桌面端
- 无障碍访问支持（ARIA标签、键盘导航）
- 使用Supabase作为无服务器后端
- 语义化HTML5和BEM CSS命名规范

## 技术栈

**前端**: HTML5, CSS3, JavaScript ES6+, Supabase JS Client
**后端**: Supabase (PostgreSQL + Auth)
**工具**: ESLint, Stylelint, Prettier, Live Server

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 更新 `public/js/supabase-client.js` 中的配置：
   ```javascript
   const SUPABASE_URL = 'your_project_url';
   const SUPABASE_ANON_KEY = 'your_anon_key';
   ```
3. 在Supabase SQL编辑器中执行 `docs/database-schema.md` 中的SQL语句创建数据表

### 3. 启动项目

```bash
npm run dev
```

访问 http://localhost:8080

## 常用命令

```bash
npm run dev        # 启动开发服务器
npm run format     # 代码格式化
npm run lint:js    # JavaScript代码检查
npm run lint:css   # CSS代码检查
npm run build      # 构建生产版本
```

## 项目结构

```
public/
├── index.html              # 首页
├── activities.html         # 活动列表
├── activity-detail.html    # 活动详情
├── booking.html            # 预约页面
├── about.html              # 关于我们
├── user-profile.html       # 个人中心
├── css/                    # 样式文件
│   ├── layout.css
│   ├── responsive.css
│   └── animations.css
└── js/                     # JavaScript模块
    ├── main.js
    ├── supabase-client.js
    ├── gallery.js
    ├── form-handler.js
    └── calendar.js
```

## 核心功能

- 用户注册和登录
- 浏览和搜索活动
- 活动详情查看
- 在线预约
- 个人预约管理

## 文档

- 详细开发文档：`.CLAUDE.md`
- 数据库设计：`docs/database-schema.md`

## 浏览器支持

Chrome, Firefox, Safari, Edge (最新版本)

## 许可证

MIT License

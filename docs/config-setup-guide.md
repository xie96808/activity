# Supabase 配置指南

## 重要安全提示

**请勿将 `js/config.js` 提交到版本控制系统！**

`js/config.js` 包含你的 Supabase 凭证，属于敏感信息。该文件已在 `.gitignore` 中，不会被 Git 跟踪。

## 配置步骤

### 1. 获取 Supabase 凭证

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** -> **API**
4. 复制以下信息：
   - **Project URL**: 类似 `https://your-project-id.supabase.co`
   - **anon public**: 一个以 `eyJ` 开头的长字符串

### 2. 创建配置文件

项目根目录下的 `js/config.js` 文件应该包含以下内容：

```javascript
/**
 * Supabase Configuration
 *
 * 重要：此文件包含敏感信息，请勿分享或提交到版本控制系统
 * IMPORTANT: This file contains sensitive information. Do not share or commit to version control.
 */

window.SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',  // 替换为你的 Project URL
  anonKey: 'your-anon-key-here'  // 替换为你的 anon key
};
```

### 3. 配置文件说明

- **`js/config.js`**: 实际的配置文件（包含真实凭证，已在 `.gitignore` 中）
- **`js/config.example.js`**: 配置模板文件（包含占位符，可以提交到 Git）

## 开发环境设置

### 首次设置

1. 复制配置模板：
   ```bash
   cp js/config.example.js js/config.js
   ```

2. 编辑 `js/config.js`，填入你的 Supabase 凭证

3. 确保 `js/config.js` 在 `.gitignore` 中（默认已添加）

### 验证配置

启动开发服务器后，打开浏览器控制台。如果配置正确，你不应该看到任何错误信息。

如果看到类似以下的错误：
```
Supabase configuration is missing!
```

请检查：
1. `js/config.js` 文件是否存在
2. 文件中的 `url` 和 `anonKey` 是否正确填写
3. HTML 中是否正确引入了 `config.js`（在 `supabase-client.js` 之前）

## 生产环境部署

### 部署到静态托管平台（如 Netlify、Vercel）

**方案 1：使用环境变量 + 构建时替换**

1. 在部署平台设置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. 使用构建工具（如 Vite）在构建时注入环境变量

3. 添加 `.env` 文件到本地开发：
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

**方案 2：在部署时创建 config.js**

1. 将 `js/config.js` 添加到部署配置中
2. 在构建过程中，使用环境变量创建该文件

### 部署到传统服务器

1. 确保服务器上有 `js/config.js` 文件
2. 文件内容与本地开发环境相同
3. 设置正确的文件权限（建议 644）

## 安全最佳实践

### 1. 永远不要提交 config.js

确保 `.gitignore` 包含以下内容：
```
# Configuration files with sensitive data
js/config.js
```

### 2. 定期轮换密钥

建议定期更换 Supabase 的 `anon` key：
1. 在 Supabase Dashboard 中生成新的 anon key
2. 更新 `js/config.js`
3. 重新部署应用

### 3. 使用环境特定配置

为不同环境使用不同的 Supabase 项目：
- 开发环境：使用单独的 Supabase 项目
- 生产环境：使用独立的 Supabase 项目

### 4. 启用 RLS（Row Level Security）

在 Supabase 中启用 RLS 策略，确保用户只能访问他们有权访问的数据。

### 5. 监控异常活动

定期检查 Supabase Dashboard 的使用情况和日志，确保没有异常访问。

## 常见问题

### Q: 为什么不使用 .env 文件？

A: 纯前端项目无法直接访问 `.env` 文件。我们使用 `config.js` 作为替代方案，这样可以：

- 在浏览器中直接使用
- 保持配置在 JavaScript 生态系统中
- 便于不同环境配置

### Q: 我应该将 config.example.js 提交到 Git 吗？

A: 是的！`config.example.js` 只包含占位符，不包含真实凭证，可以安全提交。

### Q: 如何在其他开发者机器上设置？

A: 其他开发者只需：
1. 从 Git 仓库克隆项目
2. 复制 `js/config.example.js` 为 `js/config.js`
3. 填入他们自己的 Supabase 凭证（或使用共享的开发环境凭证）

### Q: 我不小心提交了 config.js 怎么办？

A: 立即执行以下步骤：
1. 从 Git 历史中移除该文件：
   ```bash
   git rm --cached js/config.js
   git commit -m "Remove sensitive config file"
   ```
2. 在 Supabase Dashboard 中轮换所有密钥
3. 强制推送到远程仓库（如果已推送）

### Q: 生产环境如何保护这些凭证？

A: 虽然 `anon` key 是设计为公开的，但你应该：
1. 启用 Supabase RLS 策略
2. 限制 API 调用频率
3. 监控使用情况
4. 定期轮换密钥

## 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase 安全最佳实践](https://supabase.com/docs/guides/platform/security)
- [项目设置指南](./docs/supabase-setup-guide.md)

## 联系支持

如有问题，请查看：
- 项目 GitHub Issues
- Supabase 官方论坛
- Supabase Discord 社区

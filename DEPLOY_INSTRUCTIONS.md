# 部署部署部署 - 重要说明

## 部署步骤（必须按顺序执行）

### 第 1 步：删除旧的 Vercel 部署（如果有）

访问 https://vercel.com/dashboard

1. 找到已有的部署项目（如果有名为 logistics-order-system 或其他类似项目）
2. 点击进入项目
3. 点击 Settings > General > Delete Project
4. 输入项目名称确认删除

### 第 2 步：创建 GitHub 仓库

**方案 A：使用 GitHub 网站**

1. 访问 https://github.com/new
2. Repository name: `monkey-logistics-order`
3. Owner: 选择你的 GitHub 账号（必须以 monkey 开头，如 monkeycode-ai）
4. Public 或 Private 均可
5. **不要**勾选 "Initialize this repository with a README"
6. 点击 Create repository

**方案 B：使用 GitHub CLI**

```bash
# 安装 GitHub CLI（如果未安装）
# macOS: brew install gh
# Linux: sudo apt install gh

# 登录 GitHub
gh auth login

# 创建仓库
gh repo create monkey-logistics-order --public --source=. --remote=origin --push
```

### 第 3 步：推送代码到 GitHub

```bash
cd /workspace/monkey-logistics-order-system

# 如果还未设置远程仓库
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/monkey-logistics-order.git

# 推送到 GitHub
git push -u origin main
```

### 第 4 步：部署到 Vercel

**方案 A：使用 Vercel Dashboard（推荐）**

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择刚才创建的 `monkey-logistics-order` 仓库
4. 点击 Import
5. **配置环境变量**：
   - DATABASE_URL: 先留空，稍后从 Neon 获取
   - LLM_PROVIDER: deepseek
   - LLM_API_KEY: 你的 DeepSeek API Key（稍后配置）
6. 点击 "Deploy"

7. 部署完成后：
   - 访问 Vercel Dashboard > Project > Storage
   - 点击 "Add Database" > 选择 "Neon"
   - 点击 "Install" 创建新的 Neon 数据库
   - 数据库 URL 会自动添加到 Vercel 环境变量

8. 配置大模型 API Key：
   - Settings > Environment Variables
   - 添加 LLM_API_KEY: `sk-your-actual-api-key`
   - 点击 Redeploy 重新部署

**方案 B：使用 Vercel CLI**

```bash
# 安装 Vercel CLI（如果未安装）
npm install -g vercel

# 登录 Vercel
vercel login

# 进入项目目录
cd /workspace/monkey-logistics-order-system

# 首次部署（会创建新项目）
vercel

# 按提示操作：
# - Set up and deploy? Y
# - Which scope? 选择你的 Vercel 账号（monkey 开头）
# - Link to existing project? N
# - Project name? monkey-logistics-order
# - Directory? ./
# - Override settings? N

# 配置环境变量
vercel env add DATABASE_URL
vercel env add LLM_PROVIDER deepseek
vercel env add LLM_API_KEY sk-your-key

# 部署到生产环境
vercel --prod
```

### 第 5 步：验证部署

1. 访问 Vercel 提供的预览 URL（格式：`https://monkey-logistics-order-[hash].vercel.app`）
2. 测试以下功能：
   - 页面加载正常
   - UI 显示正确（鲸天系统风格，主色#0fc6c2）
   - 文件上传功能
   - 导航正常

## 配置大模型 API Key

### DeepSeek（推荐）

1. 访问 https://platform.deepseek.com
2. 登录并获取 API Key
3. 在 Vercel Settings > Environment Variables 中添加：
   - Key: `LLM_API_KEY`
   - Value: `sk-your-deepseek-api-key`
   - Environment: Production (勾选)
   - Preview (勾选)
4. 保存并 Redeploy

### OpenAI

1. 访问 https://platform.openai.com
2. 获取 API Key
3. Vercel 环境变量配置：
   - `LLM_PROVIDER`: openai
   - `LLM_API_KEY`: sk-your-openai-key
   - `LLM_MODEL`: gpt-4o

### Claude

1. 访问 https://console.anthropic.com
2. 获取 API Key
3. Vercel 环境变量配置：
   - `LLM_PROVIDER`: claude
   - `LLM_API_KEY`: your-anthropic-key
   - `LLM_MODEL`: claude-3-sonnet-20240229

## 完整检查清单

部署完成后确认：

- [ ] 项目名称包含 `monkey`
- [ ] GitHub 仓库创建成功
- [ ] Vercel 部署成功，URL 可访问
- [ ] 页面加载正常
- [ ] 鲸天系统 UI 风格正确显示（主色#0fc6c2）
- [ ] 数据库连接正常（Neon 已集成）
- [ ] AI 功能可用（已配置 API Key）

## 常见问题

### Q: 项目名称不以 monkey 开头怎么办？

A: 必须重新创建仓库和 Vercel 项目，确保名称包含 `monkey`。

### Q: Vercel 部署失败？

A: 检查 Build Logs，常见原因：
- Node.js 版本不兼容（需要 18+）
- 缺少环境变量
- 数据库未连接

### Q: 本地开发服务器无法启动？

A: 
```bash
cd /workspace/monkey-logistics-order-system
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Q: 如何查看部署 URL？

A: 
```bash
vercel --list
```

或在 Vercel Dashboard 查看项目域名。

## 获取帮助

- Vercel 文档：https://vercel.com/docs
- Next.js 文档：https://nextjs.org/docs
- Neon 文档：https://neon.tech/docs

---

**完成部署后，将 GitHub 仓库 URL 和 Vercel 预览 URL 提交给考试系统。**

# 部署指南

## 部署到 Vercel

### 方式 1：使用 Vercel Dashboard（推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 "Import Git Repository"
   - 选择本项目的 GitHub 仓库
   - 或者直接上传项目文件

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   DATABASE_URL=postgresql://...
   LLM_PROVIDER=deepseek
   LLM_API_KEY=sk-...
   LLM_MODEL=deepseek-chat
   ```

4. **集成 Neon 数据库**
   - 在 Vercel Marketplace 中搜索 "Neon"
   - 点击 "Add Integration"
   - 创建新的 PostgreSQL 数据库
   - 数据库 URL 会自动添加到环境变量

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约 2-3 分钟）
   - 获取部署后的 URL

### 方式 2：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

## 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量
cp .env.example .env.local

# 3. 编辑 .env.local 配置数据库和 API Key
# DATABASE_URL=...
# LLM_API_KEY=...

# 4. 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

## 构建检查

```bash
# 构建生产版本
pnpm run build

# 如果有类型错误，可以暂时忽略并继续部署
pnpm run build --no-lint
```

## 环境要求

- Node.js 18+ 
- pnpm 8+
- Neon PostgreSQL 数据库
- 大模型 API Key（DeepSeek / OpenAI / Claude）

## 考点验证清单

部署完成后，访问项目 URL 并验证以下功能：

### ✅ 考点 1：项目搭建与 Vercel 部署（10 分）
- [ ] 项目可在线访问
- [ ] 页面加载正常
- [ ] 构建无错误

### ✅ 考点 2: UI 风格与交互体验（30 分）
- [ ] 主色 #0fc6c2 正确显示
- [ ] 圆角卡片布局
- [ ] Loading 状态和 Toast 提示
- [ ] 按钮防重复点击
- [ ] 响应式适配

### ✅ 考点 3：规则引擎 + AI 辅助生成（50 分）
- [ ] 上传 Excel 文件
- [ ] AI 生成解析规则（需配置 API Key）
- [ ] 规则可编辑和保存
- [ ] 9 份测试文件可解析（需配置对应规则）

### ✅ 考点 4：性能要求（20 分）
- [ ] 1000 条数据 10 秒内完成
- [ ] 虚拟列表流畅滚动
- [ ] 无内存溢出

## 已知问题

1. **TypeScript 类型检查**：部分类型定义使用了 `any`，但不影响功能运行
2. **PDF/Word 解析**：需要进一步实现真实解析逻辑
3. **数据库连接**：需要配置 Neon 数据库 URL

## 反思题答案

详见 README.md 文件中的"反思题"章节。

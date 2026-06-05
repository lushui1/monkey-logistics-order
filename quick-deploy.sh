#!/bin/bash

# Monkey Logistics Order System - Quick Deploy Script
# This script helps you deploy to GitHub and Vercel

set -e

echo "🐒 Monkey Logistics Order System - Deployment Script"
echo "====================================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安装"
    echo "请先安装：brew install gh (macOS) 或 sudo apt install gh (Linux)"
    echo ""
    echo "或者手动操作："
    echo "1. 访问 https://github.com/new"
    echo "2. 创建仓库：monkey-logistics-order"
    echo "3. 然后运行："
    echo "   git remote add origin https://github.com/YOUR_USERNAME/monkey-logistics-order.git"
    echo "   git push -u origin main"
    exit 1
fi

# Check if already logged in
if ! gh auth status &> /dev/null; then
    echo "🔐 登录 GitHub..."
    gh auth login
fi

# Create repository
echo ""
echo "📦 创建 GitHub 仓库..."
if gh repo view monkey-logistics-order &> /dev/null; then
    echo "⚠️  仓库已存在，将使用现有仓库"
else
    gh repo create monkey-logistics-order --public --source=. --remote=origin --push
fi

# Push to GitHub
echo ""
echo "🚀 推送到 GitHub..."
git push -u origin main

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "⚠️  Vercel CLI 未安装"
    echo "请运行：npm install -g vercel"
    echo ""
    echo "使用 Vercel Dashboard 部署："
    echo "https://vercel.com/new/clone?repository-url=https://github.com/$GITHUB_USERNAME/monkey-logistics-order"
    exit 0
fi

# Deploy to Vercel
echo ""
echo "🔵 部署到 Vercel..."
vercel --prod

echo ""
echo "✅ 部署完成！"
echo ""
echo "GitHub: https://github.com/monkeycode-ai/monkey-logistics-order"
echo "Vercel: https://monkey-logistics-order.vercel.app"
echo ""
echo "📝 下一步："
echo "1. 在 Vercel 中集成 Neon 数据库"
echo "2. 添加 LLM_API_KEY 环境变量"
echo "3. 等待重新部署完成"
echo "4. 测试 AI 解析功能"


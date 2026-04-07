# 🎯 WantAi Research Platform

一个统一的品牌研究与数据收集平台，集成品牌社交媒体分析和多渠道数据爬虫工具。

## 📦 项目结构

```
wantai-research-platform/
├── index.html                 # 主页 - 品牌选择界面
├── {brand}.html              # 品牌详情页 (toyota, byd, ford)
├── login.html                # 登录页
├── brand-page.{css,js}       # 页面样式和逻辑
├── auth.js                   # 认证系统
├── data/                     # 品牌数据 (按品牌拆分的JSON)
│   ├── toyota.json
│   ├── byd.json
│   └── ford.json
├── tools/
│   └── data-scraper/         # 数据收集工具集
│       ├── apify_*.js        # Apify爬虫脚本
│       ├── *_scraper.py      # Python爬虫脚本
│       ├── *.md              # 文档和使用指南
│       └── social media data final/  # 汇总数据
├── vercel.json              # Vercel部署配置
├── package.json             # 项目依赖和脚本
└── .gitignore              # Git忽略规则
```

## 🚀 快速开始

### Web界面（品牌分析）

```bash
# 启动本地开发服务器
npm run dev
# 或
npm start

# 访问 http://localhost:3000
```

### 数据收集工具

```bash
# BYD Auto Brasil 爬虫
npm run scraper:bydauto

# 完整爬虫
npm run scraper:complete

# TikTok爬虫
npm run scraper:tiktok

# Statista下载
npm run scraper:statista
```

## 📊 已部署的子域名

| 服务 | URL | 说明 |
|-----|-----|-----|
| 品牌研究 | https://research.wantai.ai/ | 品牌社交媒体分析平台 |

## 🔧 配置

### 环境变量

创建 `.env.local` 文件（如需要）：

```bash
# Apify Token（爬虫任务）
APIFY_TOKEN=your_token_here

# 其他配置
```

## 📝 主要功能

### 品牌研究平台
- 🎬 多平台社交媒体数据分析 (TikTok, Instagram, Facebook, etc.)
- 📊 品牌内容统计和发布趋势
- 👤 账号矩阵可视化
- 🔐 登录认证系统（品牌详情页）

### 数据收集工具
- 🔍 Apify集成爬虫
- 📥 TikTok/Instagram/Facebook数据采集
- 📈 数据处理和转换
- 📋 Excel导出支持

## 📚 文档

更多文档和使用指南，请参考：
- `tools/data-scraper/` - 数据工具详细文档
- 各个 `.md` 文件

## 🔄 版本历史

**v2.0.0** (2026-04-07)
- ✨ 整合两个项目为统一平台
- 📦 清理无用文件，优化目录结构
- 🔧 统一配置和依赖管理
- 📝 完善文档

**v1.0.0** - 初始版本
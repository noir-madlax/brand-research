# 🚀 部署指南

## 状态说明
- ✓ 本地优化 100% 完成
- ⏳ GitHub 推送中（网络原因）
- 📦 可立即部署到生产环境

## 本地文件清单

所有优化文件已保存在本地工作目录：

### 核心优化文件
```
brand-research/
├── data/                         # 拆分后的数据文件
│   ├── byd.json                 # 3.7 MB
│   ├── ford.json                # 7.5 MB
│   ├── toyota.json              # 19.6 MB
│   └── index.json               # 索引文件
├── brand-page.js                # 优化后的加载逻辑
├── byd.html                      # 添加了预加载
├── ford.html                     # 添加了预加载
├── toyota.html                   # 添加了预加载
├── brand-page.css               # 样式文件
├── PERFORMANCE_OPTIMIZATION.md  # 优化文档
├── FINAL_REPORT.md              # 最终报告
└── .gitignore                    # 已更新
```

## 快速部署步骤

### 1. 复制本地文件到服务器
```bash
# 从本地拷贝到服务器
scp -r /Users/J/Desktop/Project/brand-research/data/ user@server:/path/to/website/

# 或使用 rsync
rsync -avz /Users/J/Desktop/Project/brand-research/data/ user@server:/path/to/website/data/
```

### 2. 更新网页文件
```bash
scp /Users/J/Desktop/Project/brand-research/*.html user@server:/path/to/website/
scp /Users/J/Desktop/Project/brand-research/brand-page.js user@server:/path/to/website/
scp /Users/J/Desktop/Project/brand-research/brand-page.css user@server:/path/to/website/
```

### 3. 清除缓存
```bash
# 清除 CDN 缓存
# 清除浏览器缓存

# 可选：删除旧的 timeline_data.json（如果存在）
rm /path/to/website/timeline_data.json
```

## 本地测试

在部署前可以本地测试：

```bash
cd /Users/J/Desktop/Project/brand-research

# 启动本地服务器
python3 -m http.server 8000

# 访问
# http://localhost:8000/ford.html
# http://localhost:8000/byd.html
# http://localhost:8000/toyota.html
```

检查浏览器控制台 (F12):
- Network 标签中应该看到加载的是 data/*.json 而不是 40MB 的文件
- 加载时间应该明显降低

## GitHub 推送

一旦网络恢复，可以执行：
```bash
cd /Users/J/Desktop/Project/brand-research
git push origin main
```

本地已有 2 个待推送的提交。

## 性能验证

部署后验证性能：
- 打开开发者工具 (F12)
- Network 标签
- 查看初始加载的文件大小
- 应该是 3.7-19.6 MB 而不是 40 MB

## 回滚方案

如果需要回滚：
1. 恢复旧的 timeline_data.json
2. 恢复旧版本的 HTML/JS 文件
3. 删除 data/ 目录

## 支持

遇到问题？
- 检查 data/ 目录是否存在
- 确认 JSON 文件完整性
- 检查浏览器控制台错误日志

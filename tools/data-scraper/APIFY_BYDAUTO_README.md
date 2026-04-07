# Apify TikTok 爬虫 - BYD AUTO BRASIL

已为你配置完整的 TikTok 爬虫脚本，用于爬取 **@bydauto.brasil** 账号的所有数据。

## 📋 爬取数据内容

### 账号信息
- ✅ 账号名称、粉丝数、关注数、点赞数、视频数、简介

### 视频数据
- ✅ 视频标题/描述
- ✅ 发布时间
- ✅ 点赞数、评论数、分享数
- ✅ 视频 URL
- ✅ **每个视频的前 30 条评论**（包含评论内容、评论人、评论点赞数）

### 导出格式
- 📄 JSON 格式（完整数据）
- 📊 CSV 格式（简化版，便于在 Excel 中查看）

---

## 🚀 使用方法

### 方法 1：使用专用脚本（推荐）

```bash
cd '/Users/J/Desktop/Project/data searcher'
node --env-file=.env apify_bydauto_scraper.js
```

**这个脚本会：**
1. 获取 @bydauto.brasil 的账号信息
2. 爬取最多 50 个视频
3. 提取每个视频的最多 30 条评论
4. 自动保存为 JSON 和 CSV 文件

### 方法 2：使用主示例脚本

```bash
node --env-file=.env apify_scraper_example.js
```

---

## 📁 输出文件

脚本运行完成后，在 `tiktok_apify_data/` 目录下会生成：

```
tiktok_apify_data/
├── account_info.json      # 账号信息
├── videos_full.json       # 完整的视频和评论数据（最详细）
└── videos.csv            # CSV 格式（易于在 Excel 中查看）
```

---

## ⚠️ 重要注意事项

### 1. Apify 积分消耗
- 每次爬取会消耗你的 Apify 积分
- 当前配置爬取 50 个视频 + 30 条评论，预计消耗：**200-500 积分左右**
- 在 https://console.apify.com/account/usage 查看你的配额使用情况

### 2. 速度
- 首次爬取可能需要 **5-15 分钟**（取决于网络和服务器响应）
- 请耐心等待，不要中断脚本运行

### 3. 数据完整性
- Apify 会尽力爬取数据，但不保证 100% 完全性
- 如果某些视频无法访问或被删除，会自动跳过

---

## 🔧 自定义配置

如果你想修改爬取参数，编辑脚本中的这些参数：

```javascript
const videoRun = await client.actor('clockworks/tiktok-scraper').call({
  urls: [`https://www.tiktok.com/@${username}`],
  resultsLimit: 50,      // 改变要爬取的视频数量
  commentsLimit: 30,     // 改变每个视频的评论数量
  downloadVideos: false, // 改为 true 会下载视频文件（需要更多积分和存储）
});
```

---

## 📊 CSV 数据格式

生成的 CSV 文件包含以下列：

| 列名 | 说明 |
|------|------|
| 视频标题 | 视频描述文本 |
| 发布时间 | ISO 8601 格式时间戳 |
| 点赞数 | 视频总点赞数 |
| 评论数 | 视频总评论数 |
| 分享数 | 视频分享次数 |
| 视频URL | 可直接打开的视频链接 |
| 评论文本 | 单条评论内容 |
| 评论人 | 评论者用户名 |
| 评论点赞数 | 该评论被点赞的次数 |

---

## ❓ 常见问题

### Q: 脚本运行了很久还没完成？
**A:** 这是正常的。爬取 50 个视频 + 评论可能需要 10-15 分钟。请让脚本继续运行。

### Q: 是否可以同时运行多个爬虫？
**A:** 可以，但建议逐个运行，避免 API 限流和积分过度消耗。

### Q: 如何恢复已爬取的数据？
**A:** 所有数据都自动保存在 `tiktok_apify_data/` 目录，你可以随时查看。

### Q: 是否可以爬取更多视频/评论？
**A:** 可以，修改 `resultsLimit` 和 `commentsLimit` 参数即可，但会消耗更多积分。

---

## 🔗 相关资源

- Apify 控制面板: https://console.apify.com/
- TikTok Scraper Actor: https://console.apify.com/actors/clockworks~tiktok-scraper
- 使用配额查看: https://console.apify.com/account/usage

---

## 💡 提示

如果你经常需要爬取 TikTok 数据，可以：
1. 购买 Apify 的月度方案（更优惠）
2. 使用免费爬虫配合定时任务
3. 将此脚本集成到你的自动化流程中

祝你爬取愉快！🚀


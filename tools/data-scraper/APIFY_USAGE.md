# Apify Ultimate Scraper 使用指南

## 安装完成 ✓

已成功配置 Apify 环境：
- ✓ `.env` 文件已创建（包含 APIFY_TOKEN）
- ✓ Node.js v20.17.0 已安装（满足 20.6+ 要求）
- ✓ `package.json` 已配置

## 核心 Actor 列表

### Instagram (12 个 Actor)
- `apify/instagram-profile-scraper` - 账号信息、粉丝数、简介
- `apify/instagram-post-scraper` - 个别帖子数据、互动指标
- `apify/instagram-comment-scraper` - 评论提取、情感分析
- `apify/instagram-hashtag-scraper` - 主题标签内容、热门话题

### TikTok (14 个 Actor)
- `clockworks/tiktok-scraper` - 综合 TikTok 数据
- `clockworks/tiktok-profile-scraper` - 账号信息
- `clockworks/tiktok-video-scraper` - 视频详情和指标
- `clockworks/tiktok-comments-scraper` - 评论提取
- `clockworks/tiktok-trends-scraper` - 热门内容

### YouTube (5 个 Actor)
- `streamers/youtube-scraper` - 视频数据和指标
- `streamers/youtube-channel-scraper` - 频道信息
- `streamers/youtube-comments-scraper` - 评论提取

### Google Maps (4 个 Actor)
- `compass/crawler-google-places` - 商业列表、评分、联系信息
- `poidata/google-maps-email-extractor` - 邮箱发现

## 使用示例

### 1. 爬取 Instagram 账号
```bash
node --env-file=.env apify_scraper_example.js
```
然后取消注释相应的函数调用。

### 2. 直接使用 Apify Client (Node.js)

```javascript
import Apify from 'apify-client';

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

// 爬取 Instagram 账号
const run = await client.actor('apify/instagram-profile-scraper').call({
  usernames: ['instagram'],
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

### 3. 爬取特定平台的多个账号

```javascript
// TikTok 账号爬取
const tiktokRun = await client.actor('clockworks/tiktok-scraper').call({
  urls: [
    'https://www.tiktok.com/@bydauto.brasil',
    'https://www.tiktok.com/@username2',
  ],
  resultsLimit: 100, // 每个账号最多 100 条视频
});
```

## 常见使用场景

| 场景 | 推荐 Actor | 说明 |
|------|-----------|------|
| **线索生成** | compass/crawler-google-places | 找到商业地址和联系信息 |
| **影响者发现** | apify/instagram-profile-scraper, clockworks/tiktok-profile-scraper | 查找和分析社交媒体影响者 |
| **品牌监控** | apify/instagram-tagged-scraper, apify/instagram-hashtag-scraper | 监控品牌提及和相关话题 |
| **竞争对手分析** | apify/facebook-pages-scraper, apify/instagram-profile-scraper | 分析竞争对手的社交媒体 |
| **内容分析** | apify/instagram-post-scraper, clockworks/tiktok-scraper | 分析内容性能 |
| **趋势研究** | apify/google-trends-scraper, clockworks/tiktok-trends-scraper | 研究市场趋势 |

## 成本管理

⚠️ **重要**: 每次爬取都会消耗 Apify 积分

**降低成本的方法：**
1. 设置 `resultsLimit` 限制结果数量（默认 100）
2. 只爬取必要的字段
3. 使用免费 Actor 优先（如 `clockworks/free-tiktok-scraper`）
4. 监控账户使用情况：https://console.apify.com/account/usage

## 导出数据

爬取完成后，自动保存为 JSON/CSV：

```bash
# 查看爬取结果
ls -la actor_output/
```

## 多 Actor 工作流

### 示例：线索丰富工作流
```
1. compass/crawler-google-places (获取商业地址)
   ↓
2. vdrmota/contact-info-scraper (获取联系信息)
```

### 示例：影响者审查工作流
```
1. apify/instagram-profile-scraper (获取账号信息)
   ↓
2. apify/instagram-comment-scraper (分析受众评论)
   ↓
3. apify/instagram-post-scraper (分析帖子性能)
```

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| Token 无效 | 检查 `.env` 文件中的 APIFY_TOKEN 是否正确 |
| 权限被拒绝 | 确保 Token 有足够的权限（Account > API Token） |
| 爬取失败 | 查看 Apify 控制台日志：https://console.apify.com/runs |
| 超时 | 减少 `resultsLimit` 或增加 `--timeout` |

## 下一步

现在你可以：

1. **修改 `apify_scraper_example.js`** - 取消注释想要运行的示例
2. **创建自定义爬虫脚本** - 根据需求调整 Actor 参数
3. **集成到现有脚本** - 在 Python 脚本中调用 Node.js 爬虫
4. **监控成本** - 在 https://console.apify.com 查看使用情况

## 更多资源

- Apify Actor 市场: https://console.apify.com/actors
- API 文档: https://docs.apify.com/api
- SDK 文档: https://docs.apify.com/sdk/python


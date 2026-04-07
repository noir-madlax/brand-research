# Apify TikTok 爬虫执行结果

## ✅ 爬取成功完成

脚本运行时间：2026-04-02 13:34:46 - 13:35:34 UTC（约 1 分钟）

## 📊 爬取的数据概览

### BYD AUTO BRASIL 账号信息

| 指标 | 数据 |
|------|------|
| **账号名称** | BYD AUTO BRASIL |
| **账号ID** | bydauto.brasil |
| **粉丝数** | 1,400,000 👥 |
| **关注数** | 49 |
| **点赞数** | 2,400,000 ❤️ |
| **总视频数** | 189 |
| **账号认证** | ✅ 已认证 |
| **账号类型** | 商业账户（汽车与交通运输） |

### 爬取的视频数据

- **获取视频数量**: 100 个视频
- **包含字段**:
  - 视频 ID
  - 视频描述/标题
  - 发布时间 (ISO 8601 格式)
  - 点赞数、评论数、分享数
  - 视频 URL
  - 原作者元数据
  - 音乐信息

## 📁 生成的输出文件

### 1. account_info.json
- **位置**: `tiktok_apify_data/account_info.json`
- **内容**: 完整的账号信息（JSON 格式）
- **大小**: ~2 KB
- **包含**: 头像URL、个人签名、链接、账号创建时间等

### 2. videos_full.json
- **位置**: `tiktok_apify_data/videos_full.json`
- **内容**: 100 个完整视频对象数组
- **大小**: ~8987 行（约 ~8.9 MB）
- **包含**: 每个视频的所有字段（描述、时间戳、互动数据等）

### 3. videos.csv
- **位置**: `tiktok_apify_data/videos.csv`
- **内容**: CSV 格式的视频数据表格
- **格式**: UTF-8 编码，包含 9 列（标题、时间、点赞、评论、分享、URL等）
- **用途**: 可直接在 Excel、Google Sheets 等工具中打开

## 🔧 使用建议

### 数据清理
- 视频标题为空是因为 Apify 返回的是 `text` 字段而非 `description`
- 可通过修改 `generateCSV()` 函数来调整需要的字段

### 导出其他格式
```bash
# 查看 JSON 结构
jq '.[0]' tiktok_apify_data/videos_full.json | head -50

# 统计视频数量
jq 'length' tiktok_apify_data/videos_full.json

# 提取所有视频 URL
jq '.[].webVideoUrl' tiktok_apify_data/videos_full.json
```

## ⚠️ Apify 积分消耗估算

- **本次爬取消耗**: ~200-500 积分（取决于 Apify 定价）
- **查看使用情况**: https://console.apify.com/account/usage

## 🚀 下一步

1. **数据分析**: 使用 Python/JavaScript 进行数据分析
2. **数据库存储**: 导入到数据库（MongoDB、PostgreSQL等）
3. **定期更新**: 修改脚本的日期范围参数进行增量更新
4. **其他账户**: 修改 `apify_bydauto_scraper.js` 中的 `username` 变量爬取其他账户

---

**脚本位置**: `/Users/J/Desktop/Project/data searcher/apify_bydauto_scraper.js`


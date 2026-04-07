#!/usr/bin/env node

/**
 * Apify 完整 TikTok 爬虫 - BYD AUTO BRASIL
 * 爬取全部189条视频 + 前10条高赞评论
 * 
 * 使用方法:
 *   node --env-file=.env apify_complete_scraper.js
 */

import Apify from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function scrapeAllVideos() {
  const username = 'bydauto.brasil';
  const profileUrl = `https://www.tiktok.com/@${username}`;

  console.log('\n' + '='.repeat(70));
  console.log('Apify 完整 TikTok 爬虫: BYD AUTO BRASIL');
  console.log('='.repeat(70));

  try {
    if (!process.env.APIFY_TOKEN) {
      throw new Error('未找到 APIFY_TOKEN，请检查 .env 文件');
    }

    console.log(`\n[✓] Token 已配置`);
    console.log(`[*] 开始爬取账号: @${username}`);
    console.log(`[⚠️ ] 爬取数据会消耗 Apify 积分\n`);

    // 第一步：使用通用 tiktok-scraper 爬取全部视频
    console.log(`[1/3] 爬取所有视频数据...`);
    console.log(`    - 目标: 爬取全部189个视频`);
    console.log(`    - 使用: clockworks/tiktok-scraper（更强大）`);

    const videosRun = await client.actor('clockworks/tiktok-scraper').call({
      urls: [profileUrl],
      resultsLimit: 200,  // 尝试获取更多
      commentsLimit: 0,   // 先不爬评论，后续单独处理
      downloadVideos: false,
    });

    const videosData = await client.dataset(videosRun.defaultDatasetId).listItems();
    const videos = videosData.items.filter(item => item.text && item.createTime);

    console.log(`[✓] 第一步完成: 获取 ${videos.length} 个视频`);

    // 第二步：获取账号信息
    console.log(`\n[2/3] 获取账号信息...`);
    const profileInfo = videosData.items.find(item => item.authorMeta && !item.text) || 
                        videos[0]?.authorMeta || {};
    console.log(`[✓] 账号: ${profileInfo.nickName}`);
    console.log(`    粉丝: ${profileInfo.fans?.toLocaleString() || '获取中'}`);
    console.log(`    总视频数: ${profileInfo.video || '获取中'}`);

    // 保存视频数据
    const outputDir = path.join(__dirname, 'tiktok_apify_data');
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      path.join(outputDir, 'account_info.json'),
      JSON.stringify(profileInfo, null, 2),
      'utf-8'
    );

    await fs.writeFile(
      path.join(outputDir, 'videos_full.json'),
      JSON.stringify(videos, null, 2),
      'utf-8'
    );

    // 第三步：爬取高赞评论
    console.log(`\n[3/3] 爬取评论数据...`);
    console.log(`    - 准备爬取 ${videos.length} 个视频的前10条高赞评论`);
    console.log(`    - 这会消耗大量积分，请耐心等待...`);

    const allComments = [];
    let processedCount = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoUrl = video.webVideoUrl || `https://www.tiktok.com/@${username}/video/${video.id}`;
      
      try {
        console.log(`    [${i + 1}/${videos.length}] 爬取视频评论...`);
        
        const commentsRun = await client.actor('codescraper/tiktok-comments-scraper').call({
          videoUrls: [videoUrl],
          maxComments: 10,  // 只爬前10条
          sortBy: 'likes',  // 按赞数排序
        });

        const commentsData = await client.dataset(commentsRun.defaultDatasetId).listItems();
        
        if (commentsData.items.length > 0) {
          allComments.push({
            videoId: video.id,
            videoText: video.text?.substring(0, 100),
            comments: commentsData.items,
          });
          processedCount++;
        }

        // 避免请求过快
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.log(`    [!] 视频 ${i + 1} 评论爬取失败: ${err.message}`);
      }
    }

    await fs.writeFile(
      path.join(outputDir, 'top_comments.json'),
      JSON.stringify(allComments, null, 2),
      'utf-8'
    );

    console.log('\n' + '='.repeat(70));
    console.log('✓ 爬取完成！');
    console.log('='.repeat(70));
    console.log(`\n数据保存位置: ${outputDir}/`);
    console.log(`  1. account_info.json - 账号信息`);
    console.log(`  2. videos_full.json - ${videos.length} 个视频的完整数据`);
    console.log(`  3. top_comments.json - ${processedCount} 个视频的高赞评论`);

  } catch (error) {
    console.error('\n[❌ 错误]', error.message);
    process.exit(1);
  }
}

scrapeAllVideos().catch(console.error);


#!/usr/bin/env node

/**
 * TikTok 评论爬虫
 * 从 videos_all.json 中提取视频URL，爬取每个视频的前10条高赞评论
 */

import Apify from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function scrapeComments() {
  console.log('\n' + '='.repeat(70));
  console.log('TikTok 评论爬虫 - 免费版本');
  console.log('='.repeat(70));

  try {
    if (!process.env.APIFY_TOKEN) {
      throw new Error('未找到 APIFY_TOKEN');
    }

    // 读取视频列表
    const videosPath = path.join(__dirname, 'tiktok_apify_data/videos_all.json');
    const videoData = await fs.readFile(videosPath, 'utf-8');
    const videos = JSON.parse(videoData);

    console.log(`\n[✓] 使用评论爬虫: automation-lab/tiktok-comments-scraper`);
    console.log(`[*] 找到 ${videos.length} 个视频`);
    console.log(`[*] 将爬取每个视频的前10条评论`);
    console.log(`[*] 使用 Apify 的 pay-per-event 定价模式\n`);

    const allComments = [];
    let successCount = 0;
    let failCount = 0;

    // 逐个爬取评论（一个视频一个请求）
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoUrl = video.webVideoUrl || video.videoUrl;

      if (!videoUrl) {
        console.log(`[${i + 1}/${videos.length}] ⚠️ 视频缺少URL，跳过`);
        failCount++;
        continue;
      }

      try {
        console.log(`[${i + 1}/${videos.length}] 爬取评论: ${video.text?.substring(0, 30)}...`);

        // 使用 automation-lab 的评论爬虫
        const run = await client.actor('automation-lab/tiktok-comments-scraper').call({
          videoUrl: videoUrl,
          maxComments: 10,   // 获取前10条
        });

        const data = await client.dataset(run.defaultDatasetId).listItems();

        // 保存此视频的评论
        if (data.items && data.items.length > 0) {
          for (const comment of data.items) {
            allComments.push({
              videoId: video.id,
              videoText: video.text?.substring(0, 100),
              commentId: comment.id || comment.comment_id,
              text: comment.text || comment.comment,
              likes: comment.likes || comment.likeCount || 0,
              replies: comment.replies || comment.replyCount || 0,
              author: comment.username || comment.author || comment.authorName,
              authorId: comment.author_id || comment.authorId,
              createTime: comment.create_time || comment.createTime,
            });
          }
          successCount++;
          console.log(`    ✓ ${data.items.length} 条评论`);
        } else {
          console.log(`    - 无评论`);
          successCount++;
        }

        // 延迟以避免速率限制
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.log(`    ✗ 失败: ${err.message}`);
        failCount++;
      }
    }

    // 保存评论数据
    const outputDir = path.join(__dirname, 'tiktok_apify_data');
    await fs.writeFile(
      path.join(outputDir, 'top_comments.json'),
      JSON.stringify(allComments, null, 2),
      'utf-8'
    );

    console.log(`\n[✓] 爬取完成!`);
    console.log(`    - 成功: ${successCount} 个视频`);
    console.log(`    - 失败: ${failCount} 个视频`);
    console.log(`    - 总评论数: ${allComments.length} 条`);
    console.log(`    - 数据已保存: ${outputDir}/top_comments.json`);

  } catch (error) {
    console.error('\n[❌ 错误]', error.message);
    process.exit(1);
  }
}

scrapeComments().catch(console.error);


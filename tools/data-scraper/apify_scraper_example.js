#!/usr/bin/env node

/**
 * Apify Ultimate Scraper Example
 * Usage: node --env-file=.env apify_scraper_example.js
 * 
 * This demonstrates how to use the Apify Ultimate Scraper skill
 */

import Apify from 'apify-client';

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

/**
 * Example 1: Scrape Instagram Profile
 */
async function scrapeInstagramProfile(username) {
  console.log(`\n[*] 正在爬取 Instagram 账号: @${username}`);
  
  try {
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
      resultsLimit: 1,
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items.length > 0) {
      const profile = items[0];
      console.log('[✓] 账号信息:');
      console.log(`  - 名称: ${profile.name}`);
      console.log(`  - 粉丝数: ${profile.followersCount}`);
      console.log(`  - 关注数: ${profile.followsCount}`);
      console.log(`  - 帖子数: ${profile.postsCount}`);
      console.log(`  - 简介: ${profile.biography}`);
    }
  } catch (error) {
    console.error('[错误]', error.message);
  }
}

/**
 * Example 2: Scrape TikTok Profile with Videos and Comments
 */
async function scrapeTikTokProfile(username) {
  console.log(`\n[*] 正在爬取 TikTok 账号: @${username}`);

  try {
    // 第一步：获取账号信息
    console.log('[*] 第一步：获取账号信息...');
    const profileRun = await client.actor('clockworks/tiktok-profile-scraper').call({
      username: username,
    });

    const profileData = await client.dataset(profileRun.defaultDatasetId).listItems();

    if (profileData.items.length > 0) {
      const profile = profileData.items[0];
      console.log('[✓] 账号信息:');
      console.log(`  - 名称: ${profile.nickname}`);
      console.log(`  - 粉丝数: ${profile.followerCount}`);
      console.log(`  - 关注数: ${profile.followingCount}`);
      console.log(`  - 点赞数: ${profile.heartCount}`);
      console.log(`  - 视频数: ${profile.videoCount}`);
      console.log(`  - 简介: ${profile.signature}`);
    }

    // 第二步：爬取视频及评论
    console.log(`\n[*] 第二步：爬取视频数据和评论...`);
    const videoRun = await client.actor('clockworks/tiktok-scraper').call({
      urls: [`https://www.tiktok.com/@${username}`],
      resultsLimit: 50,  // 爬取最多 50 个视频
      commentsLimit: 30, // 每个视频爬取最多 30 条评论
      downloadVideos: false, // 不下载视频文件，只获取元数据
    });

    const videoData = await client.dataset(videoRun.defaultDatasetId).listItems();

    console.log(`[✓] 获取视频数据: ${videoData.items.length} 个视频`);

    if (videoData.items.length > 0) {
      console.log('\n[数据示例] 前 3 个视频:');
      videoData.items.slice(0, 3).forEach((video, idx) => {
        console.log(`\n  视频 ${idx + 1}:`);
        console.log(`    - 标题: ${video.description?.substring(0, 50)}...`);
        console.log(`    - 点赞: ${video.hearts}`);
        console.log(`    - 评论数: ${video.comments}`);
        console.log(`    - 分享: ${video.shares}`);
        console.log(`    - URL: ${video.webVideoUrl}`);
        if (video.comments_data && video.comments_data.length > 0) {
          console.log(`    - 评论数据: ${video.comments_data.length} 条`);
          video.comments_data.slice(0, 2).forEach((comment, cIdx) => {
            console.log(`      评论 ${cIdx + 1}: ${comment.text?.substring(0, 40)}...`);
          });
        }
      });
    }

    // 保存完整数据到本地
    console.log(`\n[*] 保存数据到 CSV...`);
    const fs = await import('fs/promises');
    const path = await import('path');

    const outputDir = './tiktok_apify_data';
    await fs.mkdir(outputDir, { recursive: true });

    // 保存账号信息
    const accountInfoPath = path.join(outputDir, 'account_info.json');
    await fs.writeFile(accountInfoPath, JSON.stringify(profileData.items, null, 2), 'utf-8');
    console.log(`  ✓ 账号信息: ${accountInfoPath}`);

    // 保存视频数据
    const videosPath = path.join(outputDir, 'videos.json');
    await fs.writeFile(videosPath, JSON.stringify(videoData.items, null, 2), 'utf-8');
    console.log(`  ✓ 视频数据: ${videosPath}`);

    // 导出为 CSV
    const csv = generateCSV(videoData.items);
    const csvPath = path.join(outputDir, 'videos.csv');
    await fs.writeFile(csvPath, csv, 'utf-8');
    console.log(`  ✓ CSV 格式: ${csvPath}`);

    console.log(`\n[✓] 完成！数据已保存到 ${outputDir}/`);

  } catch (error) {
    console.error('[错误]', error.message);
  }
}

/**
 * Helper: Convert video data to CSV format
 */
function generateCSV(videos) {
  const headers = [
    '视频标题', '发布时间', '点赞数', '评论数', '分享数', '视频URL',
    '评论文本', '评论人', '评论点赞数'
  ];

  let csv = headers.join(',') + '\n';

  videos.forEach(video => {
    const title = (video.description || '').replace(/,/g, '；').substring(0, 100);
    const createTime = new Date(video.createTime * 1000).toISOString();
    const hearts = video.hearts || 0;
    const comments = video.comments || 0;
    const shares = video.shares || 0;
    const url = video.webVideoUrl || '';

    if (video.comments_data && video.comments_data.length > 0) {
      video.comments_data.forEach(comment => {
        const commentText = (comment.text || '').replace(/,/g, '；');
        const commentAuthor = (comment.authorName || '').replace(/,/g, '；');
        const commentLikes = comment.likes || 0;

        csv += `"${title}","${createTime}",${hearts},${comments},${shares},"${url}","${commentText}","${commentAuthor}",${commentLikes}\n`;
      });
    } else {
      csv += `"${title}","${createTime}",${hearts},${comments},${shares},"${url}","","",0\n`;
    }
  });

  return csv;
}

/**
 * Example 3: Search Google Places (Lead Generation)
 */
async function searchGooglePlaces(query, location) {
  console.log(`\n[*] 正在搜索: "${query}" 在 "${location}"`);
  
  try {
    const run = await client.actor('compass/crawler-google-places').call({
      searchStringsArray: [query],
      locations: [location],
      maxCrawledPlaces: 50,
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[✓] 找到 ${items.length} 个结果:`);
    items.slice(0, 5).forEach((place, i) => {
      console.log(`  ${i + 1}. ${place.name}`);
      console.log(`     评分: ${place.avgRating}/5 (${place.reviewsCount} 评价)`);
      console.log(`     地址: ${place.address}`);
    });
  } catch (error) {
    console.error('[错误]', error.message);
  }
}

/**
 * Main
 */
async function main() {
  console.log('='.repeat(60));
  console.log('TikTok BYD AUTO BRASIL 数据爬取');
  console.log('='.repeat(60));

  // 检查 token
  if (!process.env.APIFY_TOKEN) {
    console.error('[错误] 未找到 APIFY_TOKEN，请设置 .env 文件');
    process.exit(1);
  }

  console.log('[✓] APIFY_TOKEN 已配置');
  console.log('[⚠️ ] 警告: 爬取数据会消耗 Apify 积分，请确认后继续');
  console.log('[*] 将爬取账号信息、视频数据和评论');

  // 爬取 BYD AUTO BRASIL 的数据
  await scrapeTikTokProfile('bydauto.brasil');

  console.log('\n[✓] 所有任务完成！');
}

main().catch(console.error);


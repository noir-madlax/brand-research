#!/usr/bin/env node

/**
 * Apify TikTok Scraper - BYD AUTO BRASIL
 * 爬取 TikTok 账号 @bydauto.brasil 的完整数据
 * 
 * 使用方法:
 *   npm install apify-client  # 如果还未安装
 *   node --env-file=.env apify_bydauto_scraper.js
 */

import Apify from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function scrapeBYDAuto() {
  const username = 'bydauto.brasil';

  console.log('\n' + '='.repeat(70));
  console.log('TikTok 爬虫: BYD AUTO BRASIL');
  console.log('='.repeat(70));

  try {
    // 验证 token
    if (!process.env.APIFY_TOKEN) {
      throw new Error('未找到 APIFY_TOKEN，请检查 .env 文件');
    }

    console.log(`\n[✓] Token 已配置`);
    console.log(`[*] 开始爬取账号: @${username}`);
    console.log(`[⚠️ ] 爬取数据会消耗 Apify 积分\n`);

    // 使用单个爬虫获取账号和视频数据
    console.log(`[1/2] 爬取账号信息和视频数据...`);
    console.log(`    - 最多爬取 200 个视频`);
    console.log(`    - 每个视频最多 30 条评论`);

    const runData = await client.actor('clockworks/tiktok-profile-scraper').call({
      profiles: [username],
      resultsLimit: 200,
      commentsLimit: 30,
    });

    const allData = await client.dataset(runData.defaultDatasetId).listItems();

    if (allData.items.length === 0) {
      throw new Error('未能获取数据');
    }

    // 分离账号信息和视频数据
    const profileInfo = allData.items.find(item => item.authorMeta && !item.text) ||
                        allData.items[0]?.authorMeta ||
                        (allData.items[0]?.authorMeta ? { profile: allData.items[0].authorMeta } : {});

    const videos = allData.items.filter(item => item.text && item.createTime);

    console.log(`[✓] 爬取完成:`);
    if (profileInfo.nickName) {
      console.log(`    - 账号名称: ${profileInfo.nickName}`);
      console.log(`    - 粉丝数: ${profileInfo.fans?.toLocaleString()}`);
      console.log(`    - 关注数: ${profileInfo.following}`);
      console.log(`    - 点赞数: ${profileInfo.heart?.toLocaleString()}`);
      console.log(`    - 视频数: ${profileInfo.video}`);
    }
    console.log(`    - 获取视频数据: ${videos.length} 个视频`);

    // 第二步：保存数据
    console.log(`\n[2/2] 保存数据到本地...`);

    const outputDir = path.join(__dirname, 'tiktok_apify_data');
    await fs.mkdir(outputDir, { recursive: true });

    // 保存账号信息
    const accountPath = path.join(outputDir, 'account_info.json');
    await fs.writeFile(accountPath, JSON.stringify(profileInfo, null, 2), 'utf-8');
    console.log(`    ✓ 账号信息: ${accountPath}`);

    // 保存完整视频数据
    const videosPath = path.join(outputDir, 'videos_full.json');
    await fs.writeFile(videosPath, JSON.stringify(videos, null, 2), 'utf-8');
    console.log(`    ✓ 完整数据: ${videosPath}`);

    // 导出 CSV
    const csv = generateCSV(videos);
    const csvPath = path.join(outputDir, 'videos.csv');
    await fs.writeFile(csvPath, csv, 'utf-8');
    console.log(`    ✓ CSV 文件: ${csvPath}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✓ 爬取完成！');
    console.log('='.repeat(70));
    console.log(`\n数据已保存到: ${outputDir}/`);
    console.log(`包含文件:`);
    console.log(`  1. account_info.json - 账号信息`);
    console.log(`  2. videos_full.json - 完整视频和评论数据`);
    console.log(`  3. videos.csv - 简化版 CSV 格式`);
    
  } catch (error) {
    console.error('\n[❌ 错误]', error.message);
    process.exit(1);
  }
}

function generateCSV(videos) {
  const headers = [
    '视频标题', '发布时间', '点赞数', '评论数', '分享数', '视频URL',
    '评论文本', '评论人', '评论点赞数'
  ];
  
  let csv = headers.map(h => `"${h}"`).join(',') + '\n';
  
  videos.forEach(video => {
    const title = (video.description || '').replace(/"/g, '""').substring(0, 100);
    const createTime = video.createTime ? new Date(video.createTime * 1000).toISOString() : '';
    const hearts = video.hearts || 0;
    const comments = video.comments || 0;
    const shares = video.shares || 0;
    const url = video.webVideoUrl || '';
    
    if (video.comments_data && video.comments_data.length > 0) {
      video.comments_data.forEach(comment => {
        const commentText = (comment.text || '').replace(/"/g, '""');
        const commentAuthor = (comment.authorName || '').replace(/"/g, '""');
        const commentLikes = comment.likes || 0;
        
        csv += `"${title}","${createTime}",${hearts},${comments},${shares},"${url}","${commentText}","${commentAuthor}",${commentLikes}\n`;
      });
    } else {
      csv += `"${title}","${createTime}",${hearts},${comments},${shares},"${url}","","",0\n`;
    }
  });
  
  return csv;
}

// 运行脚本
scrapeBYDAuto().catch(error => {
  console.error('\n[❌ 致命错误]', error);
  process.exit(1);
});


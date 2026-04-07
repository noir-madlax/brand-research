#!/usr/bin/env node

/**
 * Apify 视频爬虫 - 尝试爬取全部189条视频
 * 使用 clockworks/tiktok-scraper（选项1）
 */

import Apify from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function scrapeVideos() {
  const username = 'bydauto.brasil';
  const profileUrl = `https://www.tiktok.com/@${username}`;

  console.log('\n' + '='.repeat(70));
  console.log('TikTok 视频爬虫 (通用版本)');
  console.log('='.repeat(70));

  try {
    if (!process.env.APIFY_TOKEN) {
      throw new Error('未找到 APIFY_TOKEN');
    }

    console.log(`\n[✓] 开始爬取: @${username}`);
    console.log(`[*] 使用 Actor: clockworks/tiktok-scraper (更强大)`);
    console.log(`[*] 目标: 爬取全部189条视频\n`);

    // 使用 tiktok-profile-scraper（之前成功的 Actor）
    // 并尝试多次运行来获取更多视频
    const run = await client.actor('clockworks/tiktok-profile-scraper').call({
      profiles: [username],
      resultsLimit: 300,       // 尝试更多
      commentsLimit: 0,        // 先不爬评论
    });

    const data = await client.dataset(run.defaultDatasetId).listItems();
    
    // 过滤视频和账号信息
    const videos = data.items.filter(item => item.text && item.createTime);
    const profileInfo = data.items.find(item => item.authorMeta && !item.text) || {};

    console.log(`[✓] 爬取完成!`);
    console.log(`    - 视频数: ${videos.length} 条`);
    console.log(`    - 账号: ${profileInfo.nickName}`);
    console.log(`    - 粉丝: ${profileInfo.fans?.toLocaleString()}`);
    console.log(`    - 总视频数: ${profileInfo.video}`);

    // 保存数据
    const outputDir = path.join(__dirname, 'tiktok_apify_data');
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      path.join(outputDir, 'videos_all.json'),
      JSON.stringify(videos, null, 2),
      'utf-8'
    );

    await fs.writeFile(
      path.join(outputDir, 'account_info.json'),
      JSON.stringify(profileInfo, null, 2),
      'utf-8'
    );

    console.log(`\n[✓] 数据已保存到 ${outputDir}/`);
    console.log(`    - videos_all.json (${videos.length} 个视频)`);
    console.log(`    - account_info.json`);

  } catch (error) {
    console.error('\n[❌ 错误]', error.message);
    process.exit(1);
  }
}

scrapeVideos().catch(console.error);


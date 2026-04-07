#!/usr/bin/env node

import fs from 'fs';
import XLSX from 'xlsx';

const jsonData = JSON.parse(
  fs.readFileSync('tiktok_apify_data/videos_full.json', 'utf-8')
);

const data = jsonData.map(video => ({
  '视频ID': video.id || '',
  '发布时间': video.createTimeISO || '',
  '视频标题': (video.text || '').substring(0, 100),
  '点赞数': video.diggCount || video.hearts || 0,
  '评论数': video.commentCount || video.comments || 0,
  '分享数': video.shareCount || video.shares || 0,
  '播放次数': video.playCount || 0,
  '视频URL': video.webVideoUrl || '',
  '音乐': (video.musicMeta?.musicName || ''),
  '语言': video.textLanguage || '',
  '是否广告': video.isAd ? 'Yes' : 'No',
}));

data.sort((a, b) => new Date(b['发布时间']) - new Date(a['发布时间']));

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '视频数据');

ws['!cols'] = [
  { wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 10 },
  { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 40 },
  { wch: 20 }, { wch: 8 }, { wch: 8 },
];

const excelPath = 'tiktok_apify_data/BYD_AUTO_BRASIL_Videos.xlsx';
XLSX.writeFile(wb, excelPath);

console.log(`✅ Excel 文件已生成: ${excelPath}`);
console.log(`📊 数据统计: ${data.length} 个视频`);


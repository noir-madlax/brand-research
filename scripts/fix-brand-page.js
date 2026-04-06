// This script patches brand-page.js to fix two account filtering bugs:
// 1. Cross-platform handle collision (TikTok @ford vs Instagram @ford both getting highlighted)
// 2. Count mismatch (sidebar showing cross-platform total, filter applying single-platform)
// Fix: use composite "platform:handle" key for acctCount and "platform:@handle" for selectedAccount

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'brand-page.js');

let src = readFileSync(filePath, 'utf8');

// ── Patch 1: extract handleFromUrl as a top-level shared function ─────────────
// Add after PLAT_INFO declaration
const platInfoEnd = "};  // end PLAT_INFO";
if (!src.includes('function handleFromUrl')) {
  const insertAfter = "  twitter:   { label: 'X / Twitter', cls: 'tw', svg: '<svg viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M12.6 2h2.1L9.9 7.2 15.5 14h-4.2L8 9.8 4.3 14H2.2l5.2-5.6L2 2h4.3l2.9 4 3.4-4zm-.7 10.8h1.1L4.3 3.2H3.1l8.8 9.6z\"/></svg>' },\n};";
  const sharedFn = `\n\n/* ══════════════════════════════════════════\n   Shared URL -> handle extractor\n══════════════════════════════════════════ */\nfunction handleFromUrl(url) {\n  if (!url) return null;\n  const atMatch = url.match(/@([\\w.]+)/);\n  if (atMatch) return atMatch[1];\n  const fbMatch = url.match(/facebook\\.com\\/([\\w.]+)\\/(posts|videos|photos|reels)/);\n  if (fbMatch) return fbMatch[1];\n  return null;\n}`;
  src = src.replace(insertAfter, insertAfter + sharedFn);
}

// ── Patch 2: fix acctCount to use composite key "platform:handle" ────────────
src = src.replace(
  `  // Count posts per account handle
  const acctCount = {};
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => {
      const h = p.account || p.handle || handleFromUrl(p.url);
      if (h) acctCount[h] = (acctCount[h] || 0) + 1;
    });
  }`,
  `  // Count posts per composite key "platform:handle" to avoid cross-platform handle collision
  const acctCount = {};
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => {
      const h = p.account || p.handle || handleFromUrl(p.url);
      if (h && p.platform) {
        const key = p.platform + ':' + h;
        acctCount[key] = (acctCount[key] || 0) + 1;
      }
    });
  }`
);

// ── Patch 3: fix account row to use composite selKey and look up correct acctCount ──
src = src.replace(
  `    accounts.forEach(acc => {
      const rawHandle = (acc.handle || '').replace(/^@/, '');
      const isAccActive = selectedAccount === '@' + rawHandle;
      const accCnt = acctCount[rawHandle] || 0;
      html += \`<div class="sp-item sp-account \${isAccActive ? 'active' : ''}" data-handle="\${rawHandle}" onclick="selectAccount('@\${rawHandle}')">
        <span class="sp-label-row sp-account-label">
          <span class="sp-indent"></span>
          \${acc.handle}
        </span>
        <span class="sp-num sp-acct-num" id="sp-num-acct-\${rawHandle}">\${accCnt.toLocaleString()}</span>
      </div>\`;
    });`,
  `    accounts.forEach(acc => {
      const rawHandle = (acc.handle || '').replace(/^@/, '');
      // Composite key: "platform:@handle" — unique even when handles collide across platforms
      const selKey = plat + ':@' + rawHandle;
      const isAccActive = selectedAccount === selKey;
      const accCnt = acctCount[plat + ':' + rawHandle] || 0;
      html += \`<div class="sp-item sp-account \${isAccActive ? 'active' : ''}" onclick="selectAccount('\${selKey}')">
        <span class="sp-label-row sp-account-label">
          <span class="sp-indent"></span>
          \${acc.handle}
        </span>
        <span class="sp-num sp-acct-num">\${accCnt.toLocaleString()}</span>
      </div>\`;
    });`
);

// ── Patch 4: fix selectAccount to parse new composite key format ──────────────
src = src.replace(
  `function selectAccount(val) {
  selectedAccount = val;
  // Sync platform filter set with the selection
  if (!val) {
    filters.platforms = new Set(['tiktok', 'instagram', 'facebook']);
  } else if (!val.startsWith('@')) {
    // platform-level: only this platform
    filters.platforms = new Set([val]);
  } else {
    // account-level: enable only that platform
    // platform is derived from BRAND_CONFIG.accounts
    const rawHandle = val.slice(1);
    const acc = BRAND_CONFIG.accounts && BRAND_CONFIG.accounts.find(a => (a.handle || '').replace(/^@/,'') === rawHandle);
    if (acc) filters.platforms = new Set([acc.platform.toLowerCase()]);
  }
  applyFilters();
  buildSidebarPlatform();
}`,
  `// val: null | 'platform' | 'platform:@handle'
function selectAccount(val) {
  selectedAccount = val;
  if (!val) {
    filters.platforms = new Set(['tiktok', 'instagram', 'facebook']);
  } else if (!val.includes(':')) {
    // Platform-level (e.g. 'tiktok')
    filters.platforms = new Set([val]);
  } else {
    // Account-level: extract platform from composite key (e.g. 'tiktok:@ford' -> 'tiktok')
    const plat = val.split(':')[0];
    filters.platforms = new Set([plat]);
  }
  applyFilters();
  buildSidebarPlatform();
}`
);

// ── Patch 5: fix applyFilters account-level check ────────────────────────────
src = src.replace(
  `    // account-level filter
    if (selectedAccount && selectedAccount.startsWith('@')) {
      const rawHandle = selectedAccount.slice(1);
      const postHandle = p.account || p.handle || handleFromUrl(p.url);
      if (postHandle !== rawHandle) return false;
    }`,
  `    // Account-level filter: selectedAccount is 'platform:@handle'
    if (selectedAccount && selectedAccount.includes(':@')) {
      const colonAt = selectedAccount.indexOf(':@');
      const selPlat   = selectedAccount.slice(0, colonAt);   // e.g. 'tiktok'
      const selHandle = selectedAccount.slice(colonAt + 2);  // e.g. 'ford'
      if (p.platform !== selPlat) return false;
      const postHandle = p.account || p.handle || handleFromUrl(p.url);
      if (postHandle !== selHandle) return false;
    }`
);

writeFileSync(filePath, src, 'utf8');
console.log('[fix-brand-page] Patched successfully. Changes applied:');
console.log('  1. Added shared handleFromUrl() function');
console.log('  2. acctCount now uses composite "platform:handle" key');
console.log('  3. Account rows use "platform:@handle" as selection key');
console.log('  4. selectAccount() parses new composite key format');
console.log('  5. applyFilters() account check uses composite key');

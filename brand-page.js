/**
 * brand-page.js
 * Shared logic for individual brand pages (toyota.html, byd.html, ford.html).
 * Each page defines a global `BRAND_CONFIG` before loading this script.
 *
 * BRAND_CONFIG shape:
 * {
 *   brand:    'Toyota' | 'BYD' | 'Ford',
 *   cssClass: 'toyota' | 'byd' | 'ford',
 *   colorVar: '--toyota' | '--byd' | '--ford',
 *   accounts: [{ platform, handle, url, followers, description }]
 * }
 */

/* ══════════════════════════════════════════
   State
══════════════════════════════════════════ */
let allData = null;
let filteredPosts = [];
let currentPage = 1;
let perPage = 20;
let selectedDay = null;
let heatmapPanelCollapsed = false;
let matrixPanelCollapsed = false;

// selectedAccount: null = all, 'tiktok' = platform-level, '@handle' = specific account
let selectedAccount = null;

const filters = {
  models:    new Set(['all']),
  platforms: new Set(['tiktok', 'instagram', 'facebook']),
  dateFrom:  null,
  dateTo:    null,
  sortBy:    'date',
  sortOrder: 'desc',
};

/* ══════════════════════════════════════════
   Boot
══════════════════════════════════════════ */
fetch('timeline_data.json')
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(data => {
    // Filter to only this brand's posts
    allData = {
      all_posts: data.all_posts.filter(p => p.brand === BRAND_CONFIG.brand)
    };
    initUI();
    buildSidebarPlatform();
    applyFilters();
    document.getElementById('loading-overlay').style.display = 'none';
  })
  .catch(err => {
    document.getElementById('loading-overlay').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#dc2626">加载失败</div>
        <div style="color:var(--text-sub);font-size:12px;margin-bottom:14px">${err.message}</div>
        <button onclick="location.reload()" style="padding:7px 18px;background:var(--blue);border:none;border-radius:6px;color:#fff;font-size:13px;cursor:pointer">重试</button>
      </div>`;
  });

/* ══════════════════════════════════════════
   Shared platform icon map
══════════════════════════════════════════ */
const PLAT_INFO = {
  tiktok:    { label: 'TikTok',      cls: 'tt', svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9 2h2c.5 2 1.8 2.8 3 3v2c-1.2 0-2.3-.4-3-1v5a4 4 0 11-4-4V9a2 2 0 102 2V2z"/></svg>' },
  instagram: { label: 'Instagram',   cls: 'ig', svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="3"/><circle cx="8" cy="8" r="2.5"/><circle cx="11.5" cy="4.5" r=".5" fill="currentColor"/></svg>' },
  facebook:  { label: 'Facebook',    cls: 'fb', svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 8H8v4H6V9H5V7h1V6a2 2 0 012-2h2v2H9a.5.5 0 00-.5.5V7H11l-.5 2H8.5z"/></svg>' },
  youtube:   { label: 'YouTube',     cls: 'yt', svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 4.5s-.2-1.3-.7-1.8c-.7-.7-1.5-.7-1.9-.8C10.2 2 8 2 8 2s-2.2 0-3.9.2c-.4 0-1.2.1-1.9.8-.5.5-.7 1.8-.7 1.8S1.5 6 1.5 7.5v1.3c0 1.5.2 3 .2 3s.2 1.3.7 1.8c.7.7 1.6.7 2 .8 1.5.1 6.3.2 6.3.2s2.2 0 3.9-.3c.4 0 1.2-.1 1.9-.8.5-.5.7-1.8.7-1.8s.2-1.5.2-3V7.5c0-1.5-.2-3-.2-3zM6.5 10V6l4 2-4 2z"/></svg>' },
  twitter:   { label: 'X / Twitter', cls: 'tw', svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.6 2h2.1L9.9 7.2 15.5 14h-4.2L8 9.8 4.3 14H2.2l5.2-5.6L2 2h4.3l2.9 4 3.4-4zm-.7 10.8h1.1L4.3 3.2H3.1l8.8 9.6z"/></svg>' },
};

/* ══════════════════════════════════════════
   Account Matrix (collapsible panel in main)
══════════════════════════════════════════ */
function renderAccountMatrix() {
  const wrap = document.getElementById('account-matrix-grid');
  if (!wrap || !BRAND_CONFIG.accounts || !BRAND_CONFIG.accounts.length) {
    if (wrap) wrap.innerHTML = '<div style="color:var(--text-dim);font-size:12px;padding:12px 0">暂无账号数据</div>';
    return;
  }

  const grouped = {};
  BRAND_CONFIG.accounts.forEach(acc => {
    const p = acc.platform.toLowerCase();
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(acc);
  });

  const platOrder = ['tiktok', 'instagram', 'facebook', 'youtube', 'twitter'];
  const rows = platOrder.filter(p => grouped[p]);

  wrap.innerHTML = rows.map(plat => {
    const info = PLAT_INFO[plat] || { label: plat, cls: 'tt', svg: '' };
    const accounts = grouped[plat];

    return `<div class="matrix-platform-row">
      <div class="matrix-platform-label">
        <div class="matrix-plat-icon ${info.cls}">${info.svg}</div>
        <span>${info.label}</span>
        <span class="matrix-plat-count">${accounts.length} 个账号</span>
      </div>
      <div class="matrix-accounts-wrap">
        ${accounts.map(acc => {
          const fmtFollowers = acc.followers >= 1000000
            ? (acc.followers / 1000000).toFixed(1) + 'M'
            : acc.followers >= 1000
            ? Math.round(acc.followers / 1000) + 'K'
            : (acc.followers || '—');

          const handleHtml = acc.url
            ? `<a href="${acc.url}" target="_blank" class="matrix-handle">${acc.handle}</a>`
            : `<span class="matrix-handle">${acc.handle}</span>`;

          return `<div class="matrix-account-card">
            <div class="matrix-account-top">
              <div class="matrix-plat-icon-sm ${info.cls}">${info.svg}</div>
              ${handleHtml}
            </div>
            ${acc.followers ? `<div class="matrix-followers">${fmtFollowers} <span>粉丝</span></div>` : ''}
            ${acc.description ? `<div class="matrix-account-desc">${acc.description}</div>` : ''}
            ${acc.region ? `<div class="matrix-account-region">${acc.region}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function toggleMatrixPanel() {
  matrixPanelCollapsed = !matrixPanelCollapsed;
  document.getElementById('matrix-panel').classList.toggle('collapsed', matrixPanelCollapsed);
  document.getElementById('matrix-panel-toggle').classList.toggle('collapsed', matrixPanelCollapsed);
}

/* ══════════════════════════════════════════
   Sidebar platform tree (replaces old platform chips + sidebar-counts)
══════════════════════════════════════════ */
function buildSidebarPlatform() {
  renderAccountMatrix();
  const wrap = document.getElementById('sidebar-platform-tree');
  if (!wrap) return;

  // Collect platforms from data
  const platSet = new Set();
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => { if (p.platform) platSet.add(p.platform.toLowerCase()); });
  }
  const platOrder = ['tiktok', 'instagram', 'facebook', 'youtube', 'twitter'];
  const platforms = platOrder.filter(p => platSet.has(p));

  // Group accounts by platform from BRAND_CONFIG
  const grouped = {};
  if (BRAND_CONFIG.accounts) {
    BRAND_CONFIG.accounts.forEach(acc => {
      const p = acc.platform.toLowerCase();
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(acc);
    });
  }

  // Helper: extract handle from url
  const handleFromUrl = url => {
    if (!url) return null;
    const m = url.match(/@([\w.]+)/);
    return m ? m[1] : null;
  };

  // Count posts per platform
  const platCount = {};
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => {
      if (p.platform) platCount[p.platform] = (platCount[p.platform] || 0) + 1;
    });
  }

  // Count posts per account handle
  const acctCount = {};
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => {
      const h = p.account || p.handle || handleFromUrl(p.url);
      if (h) acctCount[h] = (acctCount[h] || 0) + 1;
    });
  }

  const totalAll = allData ? allData.all_posts.length : 0;

  let html = `<div class="sp-item sp-all ${!selectedAccount ? 'active' : ''}" onclick="selectAccount(null)">
    <span class="sp-label-row">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 11l4-6 3 4 2-3 3 5"/></svg>
      全部内容
    </span>
    <span class="sp-num" id="sp-all-num">${totalAll.toLocaleString()}</span>
  </div>`;

  platforms.forEach(plat => {
    const info = PLAT_INFO[plat] || { label: plat, cls: 'tt', svg: '' };
    const accounts = grouped[plat] || [];
    const isActive = selectedAccount === plat;
    const cnt = platCount[plat] || 0;

    html += `<div class="sp-item sp-platform ${isActive ? 'active' : ''}" data-plat="${plat}" onclick="selectAccount('${plat}')">
      <span class="sp-label-row">
        <span class="matrix-plat-icon-sm ${info.cls}">${info.svg}</span>
        ${info.label}
      </span>
      <span class="sp-num sp-plat-num" id="sp-num-${plat}">${cnt.toLocaleString()}</span>
    </div>`;

    accounts.forEach(acc => {
      const rawHandle = (acc.handle || '').replace(/^@/, '');
      const isAccActive = selectedAccount === '@' + rawHandle;
      const accCnt = acctCount[rawHandle] || 0;
      html += `<div class="sp-item sp-account ${isAccActive ? 'active' : ''}" data-handle="${rawHandle}" onclick="selectAccount('@${rawHandle}')">
        <span class="sp-label-row sp-account-label">
          <span class="sp-indent"></span>
          ${acc.handle}
        </span>
        <span class="sp-num sp-acct-num" id="sp-num-acct-${rawHandle}">${accCnt.toLocaleString()}</span>
      </div>`;
    });
  });

  wrap.innerHTML = html;
}

function selectAccount(val) {
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
}

/* ══════════════════════════════════════════
   Heatmap panel collapse
══════════════════════════════════════════ */
function toggleHeatmapPanel() {
  heatmapPanelCollapsed = !heatmapPanelCollapsed;
  document.getElementById('heatmap-panel').classList.toggle('collapsed', heatmapPanelCollapsed);
  document.getElementById('heatmap-panel-toggle').classList.toggle('collapsed', heatmapPanelCollapsed);
}

/* ══════════════════════════════════════════
   Per-page
══════════════════════════════════════════ */
function setPerPage(n) {
  perPage = n;
  document.querySelectorAll('.per-page-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.pp) === n);
  });
  currentPage = 1;
  renderPostList();
}

/* ══════════════════════════════════════════
   Date preset
══════════════════════════════════════════ */
function selectPreset(preset) {
  const today = new Date();
  let from = null, to = null;
  if (preset === '7d')   { from = daysAgo(7);   to = fmtDate(today); }
  if (preset === '30d')  { from = daysAgo(30);  to = fmtDate(today); }
  if (preset === '90d')  { from = daysAgo(90);  to = fmtDate(today); }
  if (preset === '180d') { from = daysAgo(180); to = fmtDate(today); }
  if (preset === '1y')   { from = daysAgo(365); to = fmtDate(today); }

  if (preset !== 'all') {
    document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
  }

  filters.dateFrom = from;
  filters.dateTo   = to;
  document.getElementById('date-from').value = from || '';
  document.getElementById('date-to').value   = to   || '';
  document.querySelectorAll('.sf-quick-item').forEach(el => {
    el.classList.toggle('active', el.dataset.preset === preset);
  });
  applyFilters();
}

function applyCustomDate() {
  filters.dateFrom = document.getElementById('date-from').value || null;
  filters.dateTo   = document.getElementById('date-to').value   || null;
  document.querySelectorAll('.sf-quick-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
  applyFilters();
}

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return fmtDate(d);
}
function fmtDate(d) {
  return d.toISOString().slice(0,10);
}

/* ══════════════════════════════════════════
   Year chips (multi-select)
══════════════════════════════════════════ */
let selectedYears = new Set();

function buildYearChips() {
  if (!allData) return;
  const years = new Set();
  allData.all_posts.forEach(p => { if (p.date) years.add(p.date.slice(0,4)); });
  const sorted = Array.from(years).sort().reverse();
  const wrap = document.getElementById('year-chips');
  wrap.innerHTML = sorted.map(y =>
    `<button class="chip year-chip" data-year="${y}" onclick="toggleYear('${y}')">${y}</button>`
  ).join('');
}

function toggleYear(y) {
  if (selectedYears.has(y)) {
    selectedYears.delete(y);
  } else {
    selectedYears.add(y);
  }
  document.querySelectorAll('.year-chip').forEach(c => {
    c.classList.toggle('active', selectedYears.has(c.dataset.year));
  });
  document.querySelectorAll('.sf-quick-item').forEach(el => el.classList.remove('active'));

  if (selectedYears.size === 0) {
    filters.dateFrom = null;
    filters.dateTo   = null;
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value   = '';
    document.querySelectorAll('.sf-quick-item[data-preset="all"]').forEach(el => el.classList.add('active'));
  } else {
    const sortedY = Array.from(selectedYears).sort();
    filters.dateFrom = `${sortedY[0]}-01-01`;
    filters.dateTo   = `${sortedY[sortedY.length-1]}-12-31`;
    document.getElementById('date-from').value = filters.dateFrom;
    document.getElementById('date-to').value   = filters.dateTo;
  }
  applyFilters();
}

/* ══════════════════════════════════════════
   initUI
══════════════════════════════════════════ */
function initUI() {
  buildYearChips();
  updateModelOptions();

  document.getElementById('model-filter-buttons').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter="model"]');
    if (!btn) return;
    const val = btn.dataset.value;
    if (val === 'all') {
      filters.models.clear(); filters.models.add('all');
    } else {
      filters.models.delete('all');
      filters.models.has(val) ? filters.models.delete(val) : filters.models.add(val);
      if (!filters.models.size) filters.models.add('all');
    }
    updateModelChips();
    applyFilters();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.sortBy    = btn.dataset.sort;
      filters.sortOrder = btn.dataset.order;
      currentPage = 1;
      applyFilters();
    });
  });
}

/* ══════════════════════════════════════════
   Chip update helpers
══════════════════════════════════════════ */
function updatePlatformChips() {
  document.querySelectorAll('[data-filter="platform"]').forEach(btn => {
    const v = btn.dataset.value;
    btn.classList.toggle('active', v === 'all' ? filters.platforms.size === 3 : filters.platforms.has(v));
  });
}
function updateModelChips() {
  document.querySelectorAll('[data-filter="model"]').forEach(btn => {
    const v = btn.dataset.value;
    btn.classList.toggle('active', v === 'all' ? filters.models.has('all') : filters.models.has(v));
  });
}
function updateModelOptions() {
  const available = new Set();
  if (allData && allData.all_posts) {
    allData.all_posts.forEach(p => {
      if (p.models) p.models.forEach(m => available.add(m));
    });
  }
  const wrap = document.getElementById('model-filter-buttons');
  wrap.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'chip active'; allBtn.dataset.filter = 'model'; allBtn.dataset.value = 'all';
  allBtn.textContent = '全部'; wrap.appendChild(allBtn);
  Array.from(available).sort().forEach(m => {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.filter = 'model'; b.dataset.value = m;
    b.textContent = m; wrap.appendChild(b);
  });
  updateModelChips();
}

/* ══════════════════════════════════════════
   Filter tags
══════════════════════════════════════════ */
function renderFilterTags() {
  const tags = [];
  if (!filters.models.has('all'))    Array.from(filters.models).forEach(v => tags.push({type:'model',value:v,label:v}));
  if (selectedAccount) {
    const acctLabel = selectedAccount.startsWith('@') ? selectedAccount : ({tiktok:'TikTok',instagram:'Instagram',facebook:'Facebook',youtube:'YouTube',twitter:'X/Twitter'}[selectedAccount] || selectedAccount);
    tags.push({type:'account', value: selectedAccount, label: acctLabel});
  }
  if (filters.dateFrom || filters.dateTo) tags.push({type:'date',value:'date',label:`${filters.dateFrom||'—'} ~ ${filters.dateTo||'—'}`});
  if (selectedDay) tags.push({type:'day',value:selectedDay,label:`逐月: ${selectedDay}`});

  const wrap = document.getElementById('active-filter-tags');
  if (!tags.length) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');
  wrap.innerHTML = tags.map(t => `
    <div class="filter-tag">
      ${t.label}
      <button onclick="removeTag('${t.type}','${t.value}')">×</button>
    </div>`).join('');
}

function removeTag(type, value) {
  if (type === 'model')   { filters.models.delete(value); if (!filters.models.size) filters.models.add('all'); updateModelChips(); }
  if (type === 'account') { selectAccount(null); return; }
  if (type === 'date')    { selectPreset('all'); return; }
  if (type === 'day')     { clearDayFilter(); return; }
  applyFilters();
}

/* ══════════════════════════════════════════
   applyFilters
══════════════════════════════════════════ */
function applyFilters() {
  if (!allData) return;

  const handleFromUrl = url => {
    if (!url) return null;
    const m = url.match(/@([\w.]+)/);
    return m ? m[1] : null;
  };

  filteredPosts = allData.all_posts.filter(p => {
    if (!filters.models.has('all')) {
      if (!p.models || !Array.from(filters.models).some(m => p.models.includes(m))) return false;
    }
    if (!filters.platforms.has(p.platform)) return false;
    if (filters.dateFrom && p.date < filters.dateFrom) return false;
    if (filters.dateTo   && p.date > filters.dateTo)   return false;
    if (selectedDay && p.date !== selectedDay) return false;
    // account-level filter
    if (selectedAccount && selectedAccount.startsWith('@')) {
      const rawHandle = selectedAccount.slice(1);
      const postHandle = p.account || p.handle || handleFromUrl(p.url);
      if (postHandle !== rawHandle) return false;
    }
    return true;
  });

  filteredPosts.sort((a,b) => {
    let av=0, bv=0;
    if (filters.sortBy==='date')    { av=new Date(a.date).getTime(); bv=new Date(b.date).getTime(); }
    else if (filters.sortBy==='like')    { av=a.like||0;    bv=b.like||0; }
    else if (filters.sortBy==='comment') { av=a.comment||0; bv=b.comment||0; }
    else if (filters.sortBy==='share')   { av=a.share||0;   bv=b.share||0; }
    return filters.sortOrder==='desc' ? bv-av : av-bv;
  });

  currentPage = 1;
  renderStats();
  renderTimeline();
  renderPostList();
  renderFilterTags();
  renderSalesProcess();
  updateSidebarCounts();
}

/* ══════════════════════════════════════════
   Stats
══════════════════════════════════════════ */
function renderStats() {
  const wrap = document.getElementById('stats-row');
  const platCounts = {
    all:       filteredPosts.length,
    tiktok:    filteredPosts.filter(p=>p.platform==='tiktok').length,
    instagram: filteredPosts.filter(p=>p.platform==='instagram').length,
    facebook:  filteredPosts.filter(p=>p.platform==='facebook').length,
  };
  const labels = {all:'全部内容',tiktok:'TikTok',instagram:'Instagram',facebook:'Facebook'};
  wrap.innerHTML = ['all','tiktok','instagram','facebook'].map(k => {
    const isActive = k==='all' ? filters.platforms.size===3 : filters.platforms.has(k);
    return `<div class="stat-card ${isActive?'active':''} platform-${k}" onclick="togglePlatform('${k}')">
      <div class="stat-card-label">${labels[k]}</div>
      <div class="stat-card-value">${platCounts[k].toLocaleString()}</div>
    </div>`;
  }).join('');
}

function togglePlatform(plat) {
  if (plat === 'all') {
    selectedAccount = null;
    filters.platforms = new Set(['tiktok','instagram','facebook']);
  } else {
    selectedAccount = plat;
    filters.platforms = new Set([plat]);
  }
  buildSidebarPlatform();
  applyFilters();
}

function updateSidebarCounts() {
  // Counts are now rendered inline by buildSidebarPlatform; nothing to do here.
}

/* ══════════════════════════════════════════
   Timeline heatmap
══════════════════════════════════════════ */
function renderTimeline() {
  const table = document.getElementById('timeline-table');

  const basePosts = allData.all_posts.filter(p => {
    if (!filters.models.has('all')) {
      if (!p.models || !Array.from(filters.models).some(m => p.models.includes(m))) return false;
    }
    if (!filters.platforms.has(p.platform)) return false;
    if (filters.dateFrom && p.date < filters.dateFrom) return false;
    if (filters.dateTo   && p.date > filters.dateTo)   return false;
    return true;
  });

  const dayData = {};
  basePosts.forEach(p => { dayData[p.date] = (dayData[p.date]||0) + 1; });

  const days = Object.keys(dayData).sort();
  if (!days.length) { table.innerHTML = ''; return; }

  const maxVal = Math.max(...Object.values(dayData));
  const monthSet = new Set(days.map(d => d.slice(0,7)));
  const yms = Array.from(monthSet).sort();
  const minY = parseInt(yms[0].split('-')[0]);
  const maxY = parseInt(yms[yms.length-1].split('-')[0]);

  document.getElementById('timeline-range-label').textContent = `${yms[0]} — ${yms[yms.length-1]}`;

  const hint = document.getElementById('heatmap-day-hint');
  if (selectedDay) {
    hint.classList.remove('hidden');
    document.getElementById('heatmap-day-hint-text').textContent = `${selectedDay}（${dayData[selectedDay]||0} 条）`;
  } else {
    hint.classList.add('hidden');
  }

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  let html = `<tr><th>年</th>${months.map(m=>`<th>${m}</th>`).join('')}</tr>`;

  for (let y=minY; y<=maxY; y++) {
    html += `<tr><th style="font-weight:700;color:var(--text-sub)">${y}</th>`;
    for (let m=1; m<=12; m++) {
      const ym = `${y}-${String(m).padStart(2,'0')}`;
      const monthDays = Object.entries(dayData).filter(([d]) => d.startsWith(ym));
      const cnt = monthDays.reduce((s,[,v]) => s+v, 0);
      const isSelectedMonth = selectedDay && selectedDay.startsWith(ym);
      if (cnt) {
        const heat = Math.ceil((cnt/maxVal)*5);
        const classes = ['has-data', `heat-${heat}`];
        if (selectedDay) {
          if (isSelectedMonth) classes.push('day-selected');
          else classes.push('day-dimmed');
        }
        html += `<td class="${classes.join(' ')}" onclick="filterByMonth('${ym}')" title="${ym}: ${cnt} 条">${cnt}</td>`;
      } else {
        html += `<td></td>`;
      }
    }
    html += '</tr>';
  }
  table.innerHTML = html;
}

function filterByMonth(ym) {
  if (selectedDay && selectedDay.startsWith(ym)) {
    clearDayFilter();
    return;
  }
  const [y, mo] = ym.split('-').map(Number);
  const first = ym + '-01';
  const last  = ym + '-' + String(new Date(y, mo, 0).getDate()).padStart(2,'0');
  selectedDay = ym;
  filters.dateFrom = first;
  filters.dateTo   = last;
  document.getElementById('date-from').value = first;
  document.getElementById('date-to').value   = last;
  document.querySelectorAll('.sf-quick-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
  applyFilters();
}

function clearDayFilter() {
  selectedDay = null;
  selectPreset('all');
}

/* ══════════════════════════════════════════
   Post list
══════════════════════════════════════════ */
const CT_CLASS = {
  'Product':'ct-Product','Campaign':'ct-Campaign','Tech & Safety':'ct-TechSafety',
  'Brand':'ct-Brand','Owner & UGC':'ct-OwnerUGC','Lifestyle & Scenario':'ct-Lifestyle',
  'Guide':'ct-Guide','Milestone':'ct-Milestone','Service':'ct-Service',
  'Creative & Hot Topic':'ct-Creative',
};
const CT_LABEL = {
  'Product':'产品','Campaign':'营销活动','Tech & Safety':'技术安全',
  'Brand':'品牌','Owner & UGC':'UGC','Lifestyle & Scenario':'生活方式',
  'Guide':'导购','Milestone':'里程碑','Service':'服务',
  'Creative & Hot Topic':'创意热点',
};
const PLAT_ICON = {
  tiktok:   `<div class="platform-icon tt">T</div>`,
  instagram:`<div class="platform-icon ig">IG</div>`,
  facebook: `<div class="platform-icon fb">f</div>`,
};

function renderPostList() {
  const list  = document.getElementById('post-list');
  const badge = document.getElementById('content-count-badge');
  badge.textContent = filteredPosts.length.toLocaleString();

  const start = (currentPage - 1) * perPage;
  const slice = filteredPosts.slice(start, start + perPage);

  if (!slice.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-dim);font-size:12px">暂无内容</div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  list.innerHTML = slice.map(p => renderPostCard(p, true)).join('');
  renderPagination();
}

function renderPostCard(p, showStats) {
  const ctClass = CT_CLASS[p.content_type]||'ct-Other';
  const ctLabel = CT_LABEL[p.content_type]||'其他';
  const clickAttr  = p.url ? `onclick="window.open('${p.url.replace(/'/g,"\\'")}','_blank')"` : '';

  let stats = '';
  if (showStats) {
    if (p.platform==='tiktok') {
      if (p.play>=0)    stats += statChip('▶', p.play);
      if (p.like>=0)    stats += statChip('♥', p.like);
      if (p.comment>=0) stats += statChip('✦', p.comment);
      if (p.share>=0)   stats += statChip('↗', p.share);
    } else {
      if (p.like>=0)    stats += statChip('♥', p.like);
      if (p.comment>=0) stats += statChip('✦', p.comment);
      if (p.share>=0)   stats += statChip('↗', p.share);
    }
  }

  const modelTags = p.models && p.models.length
    ? p.models.map(m=>`<span class="model-tag">${m}</span>`).join('')
    : '';

  return `<div class="post-card" ${clickAttr}>
    <div class="post-card-left">${PLAT_ICON[p.platform]||''}</div>
    <div class="post-card-body">
      <div class="post-meta">
        <span class="post-date">${p.date}</span>
        <span class="ct-tag ${ctClass}">${ctLabel}</span>
        ${modelTags}
      </div>
      <div class="post-title">${p.text||''}</div>
    </div>
    <div class="post-card-right">${stats}</div>
  </div>`;
}

function statChip(icon, val) {
  return `<div class="post-stat"><span class="ico">${icon}</span><span class="val">${(val||0).toLocaleString()}</span></div>`;
}

function renderPagination() {
  const total = Math.ceil(filteredPosts.length / perPage);
  let html = '';
  if (total <= 1) { document.getElementById('pagination').innerHTML=''; return; }

  html += `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>&#8249;</button>`;
  const range = [];
  for (let i=1; i<=total; i++) {
    if (i===1 || i===total || Math.abs(i-currentPage)<=2) range.push(i);
    else if (range[range.length-1]!=='…') range.push('…');
  }
  range.forEach(p => {
    if (p==='…') html += `<button class="page-btn" disabled>…</button>`;
    else html += `<button class="page-btn ${p===currentPage?'active':''}" onclick="goPage(${p})">${p}</button>`;
  });
  html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===total?'disabled':''}>&#8250;</button>`;
  document.getElementById('pagination').innerHTML = html;
}

function goPage(n) {
  const total = Math.ceil(filteredPosts.length / perPage);
  if (n<1||n>total) return;
  currentPage = n;
  renderPostList();
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ══════════════════════════════════════════
   Sales Process
══════════════════════════════════════════ */
const CN_PLATFORMS = new Set(['weibo','douyin','xiaohongshu','wechat','bilibili','微博','抖音','小红书','微信','哔哩哔哩']);
const STAGE_ORDER_BASE = [
  '项目战略官宣','概念/设计图首发','工信部申报曝光','实车/路测首曝',
  '核心技术/配置发布','预售开启','正式上市','销量公布','车型常规宣传'
];
let activeStage = null;

function renderSalesProcess() {
  const tabsEl   = document.getElementById('stage-tabs');
  const panelsEl = document.getElementById('stage-panels');

  const hasCnPlatform = filteredPosts.some(p => CN_PLATFORMS.has(p.platform));
  const STAGE_ORDER = hasCnPlatform
    ? STAGE_ORDER_BASE
    : STAGE_ORDER_BASE.filter(s => s !== '工信部申报曝光');

  const staged = {};
  STAGE_ORDER.forEach(s => staged[s] = []);

  const launchDates = {};
  allData.all_posts.forEach(p => {
    if (p.launch_stage === '正式上市') {
      if (!launchDates[p.brand] || p.date < launchDates[p.brand]) launchDates[p.brand] = p.date;
    }
  });

  filteredPosts.forEach(p => {
    let s = p.launch_stage;
    const launchDate = launchDates[p.brand];
    if (p.model_sales_stage === '车型设计亮点')    s = launchDate && p.date < launchDate ? '核心技术/配置发布' : '车型体验/测评';
    else if (p.model_sales_stage === '车型体验/测评') s = launchDate && p.date < launchDate ? '实车/路测首曝' : '车型体验/测评';
    else if (p.model_sales_stage === '车型正式上市') s = '正式上市';
    else if (p.model_sales_stage === '车型销量成绩') s = '销量公布';
    else if (p.model_sales_stage === 'UNCLASSIFIED') s = (launchDate && p.date < launchDate) ? '核心技术/配置发布' : '车型常规宣传';
    if (s && staged[s]) staged[s].push(p);
  });

  if (!activeStage || !STAGE_ORDER.includes(activeStage) || !staged[activeStage]) {
    activeStage = STAGE_ORDER.find(s => staged[s].length > 0) || STAGE_ORDER[0];
  }

  tabsEl.innerHTML = STAGE_ORDER.map(stage => {
    const cnt = (staged[stage]||[]).length;
    return `<button class="stage-tab-btn ${stage===activeStage?'active':''}" onclick="switchStage('${stage}')">
      ${stage}
      <span class="stage-count">${cnt}</span>
    </button>`;
  }).join('');

  panelsEl.innerHTML = STAGE_ORDER.map(stage => {
    const sp = (staged[stage]||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const cnt = sp.length;
    const totalLikes    = sp.reduce((s,p)=>(p.like||0)+s, 0);
    const totalComments = sp.reduce((s,p)=>(p.comment||0)+s, 0);
    const totalShares   = sp.reduce((s,p)=>(p.share||0)+s, 0);
    const dateRange = cnt ? `${sp[sp.length-1].date} — ${sp[0].date}` : '';

    const summaryHtml = cnt ? `
      <div class="stage-tab-summary">
        <span>♥ <span class="sum-val">${totalLikes.toLocaleString()}</span></span>
        <span>✦ <span class="sum-val">${totalComments.toLocaleString()}</span></span>
        <span>↗ <span class="sum-val">${totalShares.toLocaleString()}</span></span>
        <span style="margin-left:4px;color:var(--text-dim)">${dateRange}</span>
      </div>` : `<div style="font-size:11px;color:var(--text-dim)">该阶段暂无内容</div>`;

    const postsHtml = cnt
      ? sp.map(p => renderPostCard(p, true)).join('')
      : `<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:12px">暂无内容</div>`;

    return `<div class="stage-panel ${stage===activeStage?'active':''}" data-stage="${stage}">
      <div class="stage-panel-header">${summaryHtml}</div>
      <div class="stage-posts-scroll">${postsHtml}</div>
    </div>`;
  }).join('');
}

function switchStage(stage) {
  activeStage = stage;
  document.querySelectorAll('.stage-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().startsWith(stage));
  });
  document.querySelectorAll('.stage-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.stage === stage);
  });
}

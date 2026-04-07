#!/usr/bin/env python3
"""
Statista 报告自动下载工具
搜索社交媒体和市场营销相关报告并下载到本地
"""

import os
import time
import subprocess
import shutil
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException


# ========== 配置 ==========
DOWNLOAD_DIR = Path(__file__).parent / 'downloads'
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Statista 搜索关键词 (社交媒体 + 市场营销)
SEARCH_TERMS = [
    'social media',
    'social media marketing',
    'digital marketing',
    'marketing strategy',
]

BASE_URL = 'https://www.statista.com'
HOMEPAGE_URL = 'https://www.statista.com/homepage'
MAX_PAGES_PER_TERM = 5   # 每个关键词最多抓取页数
DELAY = 0.8              # 页面间延迟(秒) - 加快速度
# ==========================


def quit_chrome():
    """关闭已运行的 Chrome，并清理 profile 锁文件，避免冲突"""
    print("[*] 正在关闭已有的 Chrome 窗口...")
    subprocess.run(
        ['osascript', '-e', 'tell application "Google Chrome" to quit'],
        capture_output=True
    )
    time.sleep(3)
    # 强制终止残留进程
    subprocess.run(['pkill', '-f', 'Google Chrome'], capture_output=True)
    time.sleep(2)
    # 删除 profile 锁文件，防止 chromedriver 无法获取 profile
    chrome_base = Path.home() / 'Library' / 'Application Support' / 'Google' / 'Chrome'
    for lock_file in ['SingletonLock', 'SingletonCookie', 'SingletonSocket']:
        for profile_dir in [chrome_base / 'Default', chrome_base]:
            lock_path = profile_dir / lock_file
            if lock_path.exists() or lock_path.is_symlink():
                try:
                    lock_path.unlink()
                    print(f"  [清理] 已删除: {lock_path}")
                except Exception:
                    pass


def setup_driver():
    """启动 WebDriver，使用临时目录（避免 profile 锁问题）"""
    import tempfile

    # 创建临时 profile 目录，避免默认 profile 被锁定
    temp_profile = tempfile.mkdtemp(prefix='chrome_profile_')

    prefs = {
        'download.default_directory': str(DOWNLOAD_DIR),
        'download.prompt_for_download': False,
        'download.directory_upgrade': True,
        'plugins.always_open_pdf_externally': True,
        'safebrowsing.enabled': False,
    }

    opts = Options()
    opts.add_argument(f'--user-data-dir={temp_profile}')
    opts.add_argument('--no-first-run')
    opts.add_argument('--no-default-browser-check')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument('--disable-web-resources')
    opts.add_argument('--disable-extensions')
    opts.add_experimental_option('prefs', prefs)
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    opts.add_experimental_option('useAutomationExtension', False)

    # 使用项目目录下的本地 chromedriver（Selenium 4 API）
    driver_path = str(Path(__file__).parent / 'chromedriver')
    service = Service(executable_path=driver_path)
    driver = webdriver.Chrome(service=service, options=opts)
    driver.implicitly_wait(5)  # 降低隐式等待时间以加快速度
    return driver


def wait_for_downloads(timeout=60):
    """等待所有 .crdownload 临时文件消失（下载完成）"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        crdownloads = list(DOWNLOAD_DIR.glob('*.crdownload'))
        if not crdownloads:
            return True
        time.sleep(2)
    return False


def collect_report_links(driver, keyword, max_pages=MAX_PAGES_PER_TERM):
    """搜索 Statista，收集报告页面的 URL 列表（仅 /study/ 类型）"""
    links = set()
    for page in range(1, max_pages + 1):
        # contentTypes=study 过滤只看报告/研究
        url = (
            f"{BASE_URL}/search/?q={keyword.replace(' ', '+')}"
            f"&p={page}&Search%5BcontentTypes%5D%5B%5D=study"
        )
        print(f"  [搜索] 关键词='{keyword}' 第{page}页: {url}")
        driver.get(url)
        time.sleep(DELAY)

        # 收集结果中的报告链接 - 只要 /study/ 路径的（必须包含 /study/）
        anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/study/"]')
        new_links = set()
        for a in anchors:
            href = a.get_attribute('href')
            if href and '/study/' in href and '/outlook/' not in href:
                new_links.add(href)
        if not new_links:
            print(f"  [!] 第{page}页无新结果，停止翻页")
            break
        links.update(new_links)
        print(f"  [+] 本页找到 {len(new_links)} 条，累计 {len(links)} 条")
    return links


def download_report(driver, report_url, downloaded_set):
    """打开报告页面并点击下载按钮"""
    if report_url in downloaded_set:
        return False

    try:
        driver.get(report_url)
        time.sleep(DELAY)

        title = driver.title[:60].replace('/', '-').replace('\\', '-')

        # 尝试找下载菜单按钮，然后点击下载链接
        # 首先查找下载菜单按钮
        try:
            menu_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR,
                'button[data-testid="StudyShareToolbar.DownloadButton"], button[aria-label*="Download"], .downloadBtn, [class*="download"][class*="btn"]'))
            )
            # 使用 JavaScript 滚动到元素可见
            driver.execute_script("arguments[0].scrollIntoView(true);", menu_btn)
            time.sleep(0.5)
            # 点击菜单按钮
            driver.execute_script("arguments[0].click();", menu_btn)
            time.sleep(1)
        except TimeoutException:
            pass

        # 查找实际的下载链接（PDF 或其他格式）
        download_link = None
        try:
            # 优先找 PDF 或可下载的链接
            download_link = driver.find_element(By.CSS_SELECTOR, 'a[href*="/download/"]')
        except NoSuchElementException:
            try:
                # 备选：找任何下载相关的链接
                download_link = driver.find_element(By.CSS_SELECTOR, 'a[data-gtm*="download"]')
            except NoSuchElementException:
                pass

        if not download_link:
            print(f"  [-] 未找到下载链接: {report_url}")
            return False

        print(f"  [↓] 下载: {title}")
        # 使用 JavaScript 点击，避免被拦截
        driver.execute_script("arguments[0].click();", download_link)
        time.sleep(1.5)
        wait_for_downloads()
        downloaded_set.add(report_url)
        return True

    except Exception as e:
        print(f"  [错误] {report_url}: {str(e)[:80]}")
        return False


def main():
    print("=" * 60)
    print("Statista 报告下载工具")
    print(f"下载目录: {DOWNLOAD_DIR}")
    print("=" * 60)

    quit_chrome()

    print("[*] 启动 Chrome（加载您的登录状态）...")
    driver = setup_driver()

    try:
        # 访问主页检查登录状态
        print(f"[*] 访问: {HOMEPAGE_URL}")
        driver.get(HOMEPAGE_URL)
        time.sleep(2)
        current = driver.current_url.lower()
        if 'login' in current or current.startswith('data:'):
            print("[!] 检测到未登录，请在弹出的浏览器中手动登录 Statista...")
            print("[!] 登录后按 Enter 继续...")
            input()
            time.sleep(1)

        all_links = set()
        for term in SEARCH_TERMS:
            print(f"\n[搜索关键词]: {term}")
            links = collect_report_links(driver, term)
            all_links.update(links)

        print(f"\n[*] 共找到 {len(all_links)} 个报告链接，开始下载...\n")

        downloaded = set()
        success = 0
        for i, link in enumerate(sorted(all_links), 1):
            print(f"[{i}/{len(all_links)}] {link}")
            if download_report(driver, link, downloaded):
                success += 1

        print(f"\n{'=' * 60}")
        print(f"[完成] 成功下载 {success} 个报告，保存至: {DOWNLOAD_DIR}")
        print("=" * 60)

    finally:
        driver.quit()


if __name__ == '__main__':
    main()


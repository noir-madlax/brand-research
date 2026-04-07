#!/usr/bin/env python3
"""
恢复 Statista 下载 - 继续未完成的下载
添加详细日志记录和错误诊断
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuration
DOWNLOAD_DIR = Path(__file__).parent / 'downloads'
LOG_FILE = Path(__file__).parent / 'statista_resume.log'
DOWNLOAD_DIR.mkdir(exist_ok=True)

def log_message(msg, level="INFO"):
    """Log messages to file and console"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[{timestamp}] [{level}] {msg}"
    print(log_msg)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_msg + '\n')

def get_downloaded_reports():
    """Get set of already downloaded files"""
    return {f for f in os.listdir(DOWNLOAD_DIR) if f.endswith(('.pdf', '.pptx'))}

def setup_driver():
    """Setup WebDriver"""
    import tempfile
    temp_profile = tempfile.mkdtemp(prefix='chrome_resume_')
    
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
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_experimental_option('prefs', prefs)
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    
    driver_path = str(Path(__file__).parent / 'chromedriver')
    service = Service(executable_path=driver_path)
    driver = webdriver.Chrome(service=service, options=opts)
    driver.implicitly_wait(5)
    return driver

def main():
    log_message("=" * 60)
    log_message("Statista 恢复下载工具启动")
    log_message(f"下载目录: {DOWNLOAD_DIR}")
    
    downloaded = get_downloaded_reports()
    log_message(f"已存在的报告数: {len(downloaded)}")
    
    try:
        driver = setup_driver()
        log_message("WebDriver 启动成功")
        
        driver.get("https://www.statista.com/homepage")
        log_message("已访问 Statista 主页")
        time.sleep(2)
        
        current = driver.current_url.lower()
        if 'login' in current:
            log_message("需要登录，请在浏览器中完成登录...", "WARNING")
            input("按 Enter 继续...")
        
        log_message("驱动程序正常运行中，等待进一步指示", "INFO")
        time.sleep(10)
        
    except Exception as e:
        log_message(f"错误: {str(e)}", "ERROR")
        import traceback
        log_message(traceback.format_exc(), "ERROR")
    finally:
        try:
            driver.quit()
            log_message("WebDriver 已关闭")
        except:
            pass

if __name__ == '__main__':
    main()


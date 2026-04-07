#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok scraper - improved version using better selectors and scrolling
"""
import os
import time
import json
import csv
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import tempfile

TIKTOK_URL = "https://www.tiktok.com/@bydauto.brasil"
OUTPUT_DIR = Path(__file__).parent / 'tiktok_data'
OUTPUT_DIR.mkdir(exist_ok=True)

VIDEOS_CSV = OUTPUT_DIR / 'videos.csv'
COMMENTS_CSV = OUTPUT_DIR / 'comments.csv'
ACCOUNT_JSON = OUTPUT_DIR / 'account_info.json'

def setup_driver():
    """Setup Chrome driver"""
    temp_profile = tempfile.mkdtemp(prefix='chrome_tiktok_')
    
    opts = Options()
    opts.add_argument(f'--user-data-dir={temp_profile}')
    opts.add_argument('--no-first-run')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    opts.add_experimental_option('useAutomationExtension', False)

    driver_path = str(Path(__file__).parent / 'chromedriver')
    service = Service(executable_path=driver_path)
    driver = webdriver.Chrome(service=service, options=opts)
    driver.implicitly_wait(10)
    return driver

def get_account_info(driver):
    """Get account basic info"""
    print("[*] Getting account info...")
    try:
        time.sleep(3)
        
        account_info = {
            'account_name': '',
            'followers': '',
            'following': '',
            'video_count': '',
            'bio': '',
            'avatar_url': '',
            'profile_url': TIKTOK_URL
        }
        
        # Try multiple selectors for account name
        name_selectors = [
            ('h1.tiktok-x6y88p-StrongText', 'text'),
            ('h1', 'text'),
            ('span[data-testid="UserDetailsModalHeaderUserInfo.follower"]', 'text'),
            ('[class*="UserTitle"]', 'text'),
        ]
        
        for sel, attr in name_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, sel)
                if attr == 'text':
                    account_info['account_name'] = elem.text.split()[0] if elem.text else ''
                if account_info['account_name']:
                    break
            except:
                pass
        
        # Try to get stats (followers, following, video count)
        try:
            stats_elem = driver.find_elements(By.CSS_SELECTOR, 'strong')
            if len(stats_elem) >= 3:
                account_info['followers'] = stats_elem[0].text
                account_info['following'] = stats_elem[1].text
                account_info['video_count'] = stats_elem[2].text
        except:
            pass
        
        # Get bio
        try:
            bio_elem = driver.find_element(By.CSS_SELECTOR, 'h2')
            account_info['bio'] = bio_elem.text
        except:
            pass
        
        # Get avatar
        try:
            avatar_elem = driver.find_element(By.CSS_SELECTOR, 'img[alt*="avatar"]')
            account_info['avatar_url'] = avatar_elem.get_attribute('src')
        except:
            pass
        
        print(f"[+] Account: {account_info['account_name']}")
        print(f"[+] Followers: {account_info['followers']}")
        print(f"[+] Videos: {account_info['video_count']}")
        
        return account_info
    
    except Exception as e:
        print(f"[!] Error getting account info: {e}")
        return None

def get_videos(driver):
    """Get video list by scrolling"""
    print("[*] Starting video extraction...")
    videos = []
    
    last_height = driver.execute_script("return document.body.scrollHeight")
    scroll_count = 0
    
    while len(videos) < 50 and scroll_count < 25:
        try:
            # Find all video items
            time.sleep(1)
            
            # Look for video links with multiple selector strategies
            video_links = []
            
            # Strategy 1: Look for a/div containers with video URLs
            try:
                items = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/video/"]')
                for item in items:
                    href = item.get_attribute('href')
                    if href and '/video/' in href:
                        video_links.append(href)
            except:
                pass
            
            # Strategy 2: Look for divs with data attributes
            if not video_links:
                try:
                    items = driver.find_elements(By.CSS_SELECTOR, 'div[data-e2e="video"]')
                    for item in items:
                        link = item.find_element(By.CSS_SELECTOR, 'a')
                        if link:
                            video_links.append(link.get_attribute('href'))
                except:
                    pass
            
            # Add unique videos
            for link in video_links:
                if link and len(videos) < 50:
                    if link not in [v.get('video_url', '') for v in videos]:
                        videos.append({'video_url': link})
            
            print(f"[+] Found {len(videos)} videos")
            
            # Scroll down
            driver.execute_script("window.scrollBy(0, 800);")
            scroll_count += 1
            
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
            
        except Exception as e:
            print(f"[!] Error scrolling: {e}")
            break
    
    print(f"[OK] Total videos: {len(videos)}")
    return videos

def main():
    print("="*60)
    print("TikTok Account Scraper")
    print(f"Target: {TIKTOK_URL}")
    print(f"Output: {OUTPUT_DIR}")
    print("="*60)
    
    driver = setup_driver()
    
    try:
        print(f"[*] Opening {TIKTOK_URL}")
        driver.get(TIKTOK_URL)
        time.sleep(5)
        
        # Get account info
        account_info = get_account_info(driver)
        if account_info:
            with open(ACCOUNT_JSON, 'w', encoding='utf-8') as f:
                json.dump(account_info, f, ensure_ascii=False, indent=2)
            print(f"[OK] Account info saved")
        
        # Get videos
        videos = get_videos(driver)
        
        # Save videos
        if videos:
            with open(VIDEOS_CSV, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['video_url'])
                writer.writeheader()
                writer.writerows(videos)
            print(f"[OK] Videos saved to {VIDEOS_CSV}")
        
        print("\n[DONE] Scraping complete!")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    main()


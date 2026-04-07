#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug TikTok page structure
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import json
import tempfile
import time
import re

temp_profile = tempfile.mkdtemp(prefix='tiktok_debug_')
opts = Options()
opts.add_argument(f'--user-data-dir={temp_profile}')
opts.add_argument('--no-first-run')

driver_path = './chromedriver'
service = Service(executable_path=driver_path)
driver = webdriver.Chrome(service=service, options=opts)

try:
    print("[*] Accessing TikTok page...")
    driver.get("https://www.tiktok.com/@bydauto.brasil")
    time.sleep(5)
    
    page_source = driver.page_source
    
    # Find JSON data
    match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>({.*?})</script>', page_source, re.DOTALL)
    
    if match:
        print("[OK] Found JSON data")
        data = json.loads(match.group(1))
        
        # Analyze structure
        print("\n[*] Top-level keys:")
        print(list(data.keys()))
        
        # Save for analysis
        with open('/tmp/tiktok_page_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("\n[OK] Full data saved to /tmp/tiktok_page_data.json")
        
        # Look for user and video data
        for key in data.keys():
            if 'user' in key.lower():
                print(f"\nFound user key: {key}")
                sub = data[key]
                if isinstance(sub, dict):
                    print(f"  Sub-keys: {list(sub.keys())[:5]}")
    else:
        print("[!] JSON not found")
        scripts = re.findall(r'<script[^>]*id="([^"]*)"', page_source)
        print(f"[*] Script IDs in page: {scripts[:10]}")

finally:
    driver.quit()


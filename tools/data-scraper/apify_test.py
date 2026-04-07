#!/usr/bin/env python3
"""
Apify Token 验证脚本
检查 APIFY_TOKEN 是否有效
"""

import os
import requests
import json
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

APIFY_TOKEN = os.getenv('APIFY_TOKEN')

print("=" * 60)
print("Apify Token 验证")
print("=" * 60)

if not APIFY_TOKEN:
    print("❌ 错误: 未找到 APIFY_TOKEN")
    print("   请检查 .env 文件或设置环境变量")
    exit(1)

print(f"✓ 找到 token: {APIFY_TOKEN[:20]}...")

# 验证 token 有效性
print("\n[*] 正在验证 token...")

try:
    # Apify API 使用 token 作为查询参数或 URL 中的一部分
    # 获取账户信息 - 使用正确的 API 端点
    response = requests.get(
        f'https://api.apify.com/v2/accounts/me?token={APIFY_TOKEN}',
        timeout=10
    )
    
    if response.status_code == 200:
        user_data = response.json()
        print("✓ Token 有效!")
        print(f"\n账户信息:")
        print(f"  - 用户: {user_data.get('username', 'N/A')}")
        print(f"  - 邮箱: {user_data.get('email', 'N/A')}")
        print(f"  - 账户等级: {user_data.get('plan', 'N/A')}")
        
        # 获取余额/配额信息
        credits_resp = requests.get(
            f'https://api.apify.com/v2/accounts/me?token={APIFY_TOKEN}',
            timeout=10
        )
        if credits_resp.status_code == 200:
            account_data = credits_resp.json()
            print(f"  - 配额: {account_data.get('monthlyRequestCredits', 'N/A')} 请求")
            if 'usedRequestCredits' in account_data:
                used = account_data.get('usedRequestCredits', 0)
                total = account_data.get('monthlyRequestCredits', 0)
                print(f"  - 已使用: {used}/{total} ({(used/total*100):.1f}%)" if total > 0 else f"  - 已使用: {used}")
        
        print("\n✓ Apify 配置成功!")
        print("\n[提示] 现在你可以运行:")
        print("  1. node --env-file=.env apify_scraper_example.js")
        print("  2. 或修改脚本中的示例函数开始爬取数据")
        
    elif response.status_code == 401:
        print("❌ Token 无效或已过期")
        print("   请检查 .env 文件中的 APIFY_TOKEN")
    else:
        print(f"❌ 错误 (状态码 {response.status_code}): {response.text}")
        
except requests.exceptions.Timeout:
    print("❌ 连接超时，无法验证 token")
    print("   请检查网络连接")
except requests.exceptions.RequestException as e:
    print(f"❌ 网络错误: {e}")
except Exception as e:
    print(f"❌ 错误: {e}")

print("=" * 60)


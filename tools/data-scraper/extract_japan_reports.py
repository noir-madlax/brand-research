#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取日本市场报告数据的脚本
"""

import os
import subprocess
import sys
import json

def check_and_install_packages():
    """检查并安装必要的包"""
    packages = ['pdfplumber', 'python-pptx']
    for pkg in packages:
        try:
            __import__(pkg.replace('-', '_'))
        except ImportError:
            print(f"正在安装 {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

def extract_pdf_text(pdf_path):
    """提取 PDF 文本"""
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            text_content = ""
            tables_data = []
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                text_content += f"\n--- 第 {i+1} 页 ---\n{text}"
                
                tables = page.extract_tables()
                if tables:
                    tables_data.append({
                        'page': i+1,
                        'tables': tables
                    })
            return text_content, tables_data
    except Exception as e:
        print(f"提取 PDF 失败: {e}")
        return None, None

def main():
    """主函数"""
    downloads_dir = './downloads'
    
    japan_reports = {
        'social_commerce': 'study_id144333_social-commerce-in-japan-the-role-of-social-media-in-shopping.pdf',
        'digitalization': 'study_id82878_digitalization-in-japan.pdf',
        'digital_ads': 'study_id117636_digital-advertising-in-japan.pptx',
        'influencer': 'study_id101135_influencer-marketing-in-japan.pptx',
    }
    
    print("=" * 70)
    print("日本市场社交媒体报告数据提取")
    print("=" * 70)
    
    check_and_install_packages()
    
    for name, filename in japan_reports.items():
        filepath = os.path.join(downloads_dir, filename)
        if os.path.exists(filepath):
            print(f"\n✓ 处理: {name} ({filename})")
            if filename.endswith('.pdf'):
                text, tables = extract_pdf_text(filepath)
                if text:
                    print(f"  - 提取成功，大小: {len(text)} 字符")
                if tables:
                    print(f"  - 找到 {len(tables)} 页包含表格")
        else:
            print(f"\n✗ 未找到: {filename}")

if __name__ == '__main__':
    main()

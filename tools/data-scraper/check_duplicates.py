#!/usr/bin/env python3
import os
from collections import defaultdict
import hashlib

def get_file_hash(filepath):
    """计算文件的MD5哈希值"""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

# 扫描所有文件
downloads_dir = './downloads'
hash_map = defaultdict(list)

for filename in os.listdir(downloads_dir):
    filepath = os.path.join(downloads_dir, filename)
    if os.path.isfile(filepath):
        try:
            file_hash = get_file_hash(filepath)
            hash_map[file_hash].append(filename)
        except Exception as e:
            print(f"错误: {filename} - {str(e)}")

# 找出重复的文件
duplicates = {k: v for k, v in hash_map.items() if len(v) > 1}

if duplicates:
    print(f"✗ 发现 {len(duplicates)} 组重复文件：\n")
    for hash_val, files in duplicates.items():
        print(f"哈希值: {hash_val}")
        for f in files:
            print(f"  - {f}")
        print()
else:
    print("✓ 没有发现重复的文件！")

print(f"\n总文件数: {len(hash_map)}")


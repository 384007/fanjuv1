"""
删除 seo-ready 文章中的重复尾部段落。
只做删除，不替换任何内容。

目标段落A（671篇）：
  ## 在当地通过饭局连接更多同频伙伴
  ## 在本地通过饭局建立真实连接
  ## 在当地的饭局社交体验

目标段落B（649篇）：
  ## 在当地通过饭局app寻找饭搭子
"""

import glob
import os
import re
import sys

DRY_RUN = "--dry-run" in sys.argv
LIMIT = None
for arg in sys.argv:
    if arg.startswith("--limit="):
        LIMIT = int(arg.split("=")[1])

# 段落A：三个连续重复H2，从第一个开始到文件末尾全部删除
# 标志：文章末尾出现这些 H2 的任意一个
MARKERS_A = [
    "## 在当地通过饭局连接更多同频伙伴",
    "## 在本地通过饭局建立真实连接",
    "## 在当地的饭局社交体验",
]

# 段落B：单独出现的重复H2
MARKER_B = "## 在当地通过饭局app寻找饭搭子"


def find_earliest_marker(content, markers):
    """找到内容中最早出现的 marker 位置"""
    earliest = -1
    for m in markers:
        idx = content.find(m)
        if idx != -1:
            if earliest == -1 or idx < earliest:
                earliest = idx
    return earliest


def clean_article(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    changed = False

    # 段落A：找最早的 marker，截掉从那里到末尾
    idx_a = find_earliest_marker(content, MARKERS_A)
    if idx_a != -1:
        content = content[:idx_a].rstrip() + "\n"
        changed = True

    # 段落B：在剩余内容中找 marker_B
    idx_b = content.find(MARKER_B)
    if idx_b != -1:
        content = content[:idx_b].rstrip() + "\n"
        changed = True

    if changed:
        if DRY_RUN:
            print(f"[DRY-RUN] Would modify: {filepath}")
            # 打印从原始内容中删除的部分
            deleted = original[len(content.rstrip()) + 1:]
            print(f"  Deleted tail ({len(deleted)} chars): {deleted[:150]!r}")
        else:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  Fixed: {os.path.basename(filepath)}")
    
    return changed


def main():
    files = sorted(glob.glob("content/seo-ready/*.md"))
    if LIMIT:
        files = files[:LIMIT]

    total = len(files)
    modified = 0

    for f in files:
        if clean_article(f):
            modified += 1

    print(f"\n{'[DRY-RUN] ' if DRY_RUN else ''}Done: {modified}/{total} files {'would be ' if DRY_RUN else ''}modified")


if __name__ == "__main__":
    main()

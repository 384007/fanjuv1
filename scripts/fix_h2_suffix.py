"""
删除 seo-ready 中文文章 H2 标题末尾的"，回到XXX饭局"重复后缀。

模式：## 标题内容，回到XXX饭局
修复：## 标题内容
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

# 匹配 H2 标题末尾的"，回到XXX饭局"后缀
PATTERN = re.compile(r"(^## .+?)，回到.{2,10}饭局$", re.MULTILINE)


def clean_article(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content, count = PATTERN.subn(r"\1", content)

    if count > 0:
        if DRY_RUN:
            print(f"[DRY-RUN] {os.path.basename(filepath)} ({count} fixes)")
            for m in PATTERN.finditer(content):
                print(f"  Before: {m.group(0)!r}")
                print(f"  After:  {m.group(1)!r}")
        else:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"  Fixed ({count}): {os.path.basename(filepath)}")

    return count


def main():
    files = sorted(glob.glob("content/seo-ready/*.md"))
    if LIMIT:
        files = files[:LIMIT]

    total = len(files)
    modified = 0
    total_fixes = 0

    for f in files:
        n = clean_article(f)
        if n > 0:
            modified += 1
            total_fixes += n

    print(f"\n{'[DRY-RUN] ' if DRY_RUN else ''}Done: {modified}/{total} files, {total_fixes} H2 suffixes {'would be ' if DRY_RUN else ''}removed")


if __name__ == "__main__":
    main()

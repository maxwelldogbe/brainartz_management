#!/usr/bin/env python3
import os
import re
import sys

EXCLUDE_DIRS = {'.git', 'brain', 'node_modules', 'venv', '__pycache__'}

emoji_re = re.compile(
    r"[\U0001F300-\U0001F5FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\u2600-\u26FF\u2700-\u27BF]",
    flags=re.UNICODE,
)


def is_text_file(path):
    try:
        with open(path, 'rb') as f:
            chunk = f.read(4096)
            if b'\0' in chunk:
                return False
        # try to decode small portion
        with open(path, 'r', encoding='utf-8') as f:
            f.read(4096)
        return True
    except Exception:
        return False


def remove_emojis_in_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return 0
    new, n = emoji_re.subn('', content)
    if n > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
    return n


def main(root):
    total_files = 0
    total_replacements = 0
    modified_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # prune excluded dirs
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            path = os.path.join(dirpath, fname)
            if not is_text_file(path):
                continue
            total_files += 1
            n = remove_emojis_in_file(path)
            if n > 0:
                modified_files.append((path, n))
                total_replacements += n

    print(f"Scanned files: {total_files}")
    print(f"Total emoji replacements: {total_replacements}")
    for p, n in modified_files:
        print(f"Modified: {p} -> {n} removals")


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    main(root)

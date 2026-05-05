#!/bin/bash

TARGET_DIR="${1:-.}"

if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ 目录不存在: $TARGET_DIR"
  exit 1
fi

echo "📁 扫描目录: $TARGET_DIR"
echo ""

COUNT=0

find "$TARGET_DIR" -name "*.md" -type f | while read file; do
  new_file="${file%.md}.mdx"
  mv "$file" "$new_file"
  echo "✅ $file  →  $new_file"
  COUNT=$((COUNT + 1))
done

echo ""
echo "🎉 完成"


# 先赋予执行权限
# chmod +x rename_md_to_mdx.sh

# 转换当前目录
# ./rename_md_to_mdx.sh

# 或指定目录
# ./rename_md_to_mdx.sh ./docs

#./scripts/rename_md_to_mdx.sh ./content/docs/web/style_lang
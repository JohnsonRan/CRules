#!/bin/bash

# 函数：生成 ADs_merged.txt (使用 Hostlistcompiler)
generate_ads_merged() {
  local output="ADs_merged.txt"
  
  echo "Compiling ad rules with Hostlistcompiler..."
  
  # 使用 Hostlistcompiler 进行下载、压缩、去重、白名单过滤
  cd scripts
  node compile-with-hostlist.js ads
  cd ..
  
  # 移动编译后的文件到根目录
  if [ -f "scripts/ADs_merged.txt" ]; then
    mv "scripts/ADs_merged.txt" "$output"
  fi
  
  # 后处理：应用额外的关键词排除
  if [ -f "scripts/exclude-keyword.txt" ]; then
    echo "Applying additional keyword exclusions..."
    grep -v -f "scripts/exclude-keyword.txt" "$output" > "${output}.tmp"
    mv "${output}.tmp" "$output"
  fi
  
  # 生成 mihomo 格式（使用 +. 前缀）
  echo "Converting to mihomo format..."
  sed 's/^DOMAIN-SUFFIX,/+./g; s/^\|\|/+./g; s/\^$//g' "$output" | grep -v '^#' > "${output}.mihomo"
  
  if command -v mihomo &> /dev/null; then
    mihomo convert-ruleset domain text "${output}.mihomo" ADs_merged.mrs 2>/dev/null || echo "Warning: mihomo conversion failed"
  else
    echo "Warning: mihomo not found, skipping .mrs conversion"
  fi
  
  rm -f "${output}.mihomo"
  
  count=$(grep -v '^#' "$output" | wc -l)
  echo "✓ Generated $output with $count domains"
}

# 函数：生成 AIs_merged.txt (使用原来的方法)
generate_ais_merged() {
  local output="AIs_merged.txt"
  local temp_output="${output}.tmp"
  
  echo "Downloading and processing AI rules..."
  
  # 一次性下载、处理、去重、格式化
  {
    curl -skL https://github.com/MetaCubeX/meta-rules-dat/raw/meta/geo/geosite/category-ai-!cn.list
    curl -skL https://ruleset.skk.moe/List/non_ip/ai.conf
    curl -skL https://github.com/DustinWin/ruleset_geodata/raw/mihomo-ruleset/ai.list
  } | \
    sed '/^#/d; /^$/d' | \
    sed 's/#.*$//g' | \
    sed -E 's/^(DOMAIN-KEYWORD,|DOMAIN-SUFFIX,|DOMAIN,|\+\.|\*\.|\.)//g; s/,reject$//gi' | \
    tr '[:upper:]' '[:lower:]' | \
    sort -u | \
    grep -v -f "scripts/exclude-keyword.txt" | \
    awk '{ print "DOMAIN-SUFFIX," $0 }' > "$temp_output"
  
  # 添加计数和时间戳
  count=$(wc -l < "$temp_output")
  current_date=$(date +"%Y-%m-%d %H:%M:%S")
  sed -i "1i# Count: $count, Updated: $current_date" "$temp_output"
  
  # 生成 mihomo 格式（使用 +. 前缀）
  sed 's/^DOMAIN-SUFFIX,/+./g' "$temp_output" | grep -v '^#' > "${output}.mihomo"
  
  if command -v mihomo &> /dev/null; then
    mihomo convert-ruleset domain text "${output}.mihomo" AIs_merged.mrs 2>/dev/null || echo "Warning: mihomo conversion failed"
  else
    echo "Warning: mihomo not found, skipping .mrs conversion"
  fi
  
  rm -f "${output}.mihomo"
  
  # 移动到最终输出
  mv "$temp_output" "$output"
  
  echo "✓ Generated $output with $count domains"
}

# 主函数
main() {
  if [ "$1" == "ads" ]; then
    generate_ads_merged
  elif [ "$1" == "ais" ]; then
    generate_ais_merged
  else
    echo "Usage: $0 [ads|ais]"
    exit 1
  fi
}

# 调用主函数
main "$@"

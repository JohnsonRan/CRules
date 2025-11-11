#!/bin/bash

# 函数：生成 ADs_merged.txt
generate_ads_merged() {
  local output="ADs_merged.txt"
  local temp_output="${output}.tmp"
  
  echo "Downloading and processing ad rules..."
  
  # 一次性下载、处理、去重、格式化
  {
    curl -skL https://adrules.top/adrules_domainset.txt
    curl -skL https://big.oisd.nl/domainswild2
    curl -skL https://github.com/Loyalsoldier/v2ray-rules-dat/raw/release/reject-list.txt
    curl -skL https://github.com/TG-Twilight/AWAvenue-Ads-Rule/raw/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list
    curl -skL https://github.com/ForestL18/rules-dat/raw/mihomo/geo/classical/pcdn.list
    curl -skL https://ruleset.skk.moe/Clash/domainset/reject.txt
  } | \
    sed '/^#/d; /^$/d' | \
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
  sed 's/^DOMAIN-SUFFIX,/+./g' "$temp_output" > "${output}.mihomo"
  mihomo convert-ruleset domain text "${output}.mihomo" ADs_merged.mrs 2>/dev/null || echo "Warning: mihomo conversion failed"
  rm -f "${output}.mihomo"
  
  # 移动到最终输出
  mv "$temp_output" "$output"
  
  echo "Generated $output with $count domains"
}

# 函数：生成 AIs_merged.txt
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
  sed 's/^DOMAIN-SUFFIX,/+./g' "$temp_output" > "${output}.mihomo"
  mihomo convert-ruleset domain text "${output}.mihomo" AIs_merged.mrs 2>/dev/null || echo "Warning: mihomo conversion failed"
  rm -f "${output}.mihomo"
  
  # 移动到最终输出
  mv "$temp_output" "$output"
  
  echo "Generated $output with $count domains"
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

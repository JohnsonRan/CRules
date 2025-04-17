#!/bin/bash

curl -skL https://adrules.top/adrules_domainset.txt >>rules.txt
curl -skL https://big.oisd.nl/domainswild2 >>rules.txt
curl -skL https://github.com/Loyalsoldier/v2ray-rules-dat/raw/release/reject-list.txt >>rules.txt
curl -skL https://github.com/TG-Twilight/AWAvenue-Ads-Rule/raw/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list | sed 's/^DOMAIN,//g' >>rules.txt
curl -skL https://github.com/limbopro/Adblock4limbo/raw/main/rule/Surge/Adblock4limbo_surge.list | sed 's/^DOMAIN,//g' | sed 's/^DOMAIN-SUFFIX,//g' | sed 's/,reject$//g' >>rules.txt
cat rules.txt | sed '/^#/d' >combined_raw.txt
sed -E 's/^[\+\*\.]+//g' combined_raw.txt | grep -v '^$' >normalized.txt
sort normalized.txt | uniq >unique_domains.txt
awk '{print "+." $0}' unique_domains.txt >ADs_merged.txt
mihomo convert-ruleset domain text ADs_merged.txt ADs_merged.mrs
# Surge compatible
sed -i 's/+./DOMAIN-SUFFIX,/g' ADs_merged.txt
# count
count=$(wc -l <ADs_merged.txt)
current_date=$(date +"%Y-%m-%d %H:%M:%S")
temp_file=$(mktemp)
echo "# Count: $count, updated: $current_date" >"$temp_file"
cat ADs_merged.txt >>"$temp_file"
mv "$temp_file" ADs_merged.txt

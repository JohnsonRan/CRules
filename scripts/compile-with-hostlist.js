#!/usr/bin/env node

const compile = require('@adguard/hostlist-compiler');
const { writeFileSync } = require('fs');

// Configuration for ad rules compilation
const adsConfig = {
  name: "AdRules Merged List",
  description: "Compiled ad-blocking rules with compression and deduplication",
  homepage: "https://github.com/yourusername/yourrepo",
  license: "MIT",
  sources: [
    {
      name: "AdRules Domain Set",
      source: "https://adrules.top/adrules_domainset.txt",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "OISD Big List",
      source: "https://big.oisd.nl/domainswild2",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "Loyalsoldier Reject List",
      source: "https://github.com/Loyalsoldier/v2ray-rules-dat/raw/release/reject-list.txt",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "AWAvenue Ads Rule",
      source: "https://github.com/TG-Twilight/AWAvenue-Ads-Rule/raw/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "PCDN List",
      source: "https://github.com/ForestL18/rules-dat/raw/mihomo/geo/classical/pcdn.list",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "Sukka Reject",
      source: "https://ruleset.skk.moe/Clash/domainset/reject.txt",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    }
  ],
  transformations: ["Deduplicate", "Compress", "RemoveEmptyLines", "TrimLines"],
  exclusions_sources: [
    "https://raw.githubusercontent.com/AdguardTeam/AdGuardSDNSFilter/master/Filters/exclusions.txt",
    "https://raw.githubusercontent.com/Cats-Team/AdRules/refs/heads/script/script/allowlist.txt",
    "https://raw.githubusercontent.com/mawenjian/china-cdn-domain-whitelist/refs/heads/master/china-cdn-domain-whitelist.txt",
    "https://raw.githubusercontent.com/zoonderkins/blahdns/refs/heads/master/hosts/whitelist.txt"
  ]
};

// Configuration for AI rules compilation
const aisConfig = {
  name: "AI Rules Merged List",
  description: "Compiled AI service rules with compression and deduplication",
  homepage: "https://github.com/yourusername/yourrepo",
  license: "MIT",
  sources: [
    {
      name: "MetaCubeX AI Category",
      source: "https://github.com/MetaCubeX/meta-rules-dat/raw/meta/geo/geosite/category-ai-!cn.list",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "Sukka AI List",
      source: "https://ruleset.skk.moe/List/non_ip/ai.conf",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    },
    {
      name: "DustinWin AI Ruleset",
      source: "https://github.com/DustinWin/ruleset_geodata/raw/mihomo-ruleset/ai.list",
      type: "adblock",
      transformations: ["RemoveComments", "Validate"]
    }
  ],
  transformations: ["Deduplicate", "Compress", "RemoveEmptyLines", "TrimLines"],
  exclusions_sources: []
};

async function compileList(config, outputFile) {
  console.log(`\nCompiling ${config.name}...`);
  const startTime = Date.now();
  
  try {
    const result = await compile(config);
    const duration = Date.now() - startTime;
    
    console.log(`✓ Compilation completed in ${duration}ms`);
    console.log(`✓ Total rules: ${result.length}`);
    
    // 转换 AdGuard 格式到 mihomo 格式，删除注释行
    const convertedRules = result
      .filter(rule => {
        // 删除注释行和空行
        if (!rule || rule.trim() === '') return false;
        if (rule.startsWith('!') || rule.startsWith('#')) return false;
        return true;
      })
      .map(rule => {
        // 转换 ||domain.com^ 到 DOMAIN-SUFFIX,domain.com
        if (rule.startsWith('||') && rule.endsWith('^')) {
          const domain = rule.slice(2, -1);
          return `DOMAIN-SUFFIX,${domain}`;
        }
        
        // 转换 ||domain.com 到 DOMAIN-SUFFIX,domain.com
        if (rule.startsWith('||')) {
          const domain = rule.slice(2);
          return `DOMAIN-SUFFIX,${domain}`;
        }
        
        // 转换 |domain.com^ 到 DOMAIN,domain.com
        if (rule.startsWith('|') && rule.endsWith('^')) {
          const domain = rule.slice(1, -1);
          return `DOMAIN,${domain}`;
        }
        
        // 如果已经是 DOMAIN-SUFFIX 或 DOMAIN 格式，保持不变
        if (rule.startsWith('DOMAIN-SUFFIX,') || rule.startsWith('DOMAIN,')) {
          return rule;
        }
        
        // 其他格式尝试作为域名处理
        const cleanDomain = rule.replace(/^[\|\+\.\*]+/, '').replace(/[\^\$]+$/, '');
        if (cleanDomain && !cleanDomain.includes(' ')) {
          return `DOMAIN-SUFFIX,${cleanDomain}`;
        }
        
        return null;
      })
      .filter(rule => rule !== null);
    
    const validRules = convertedRules;
    
    // Add header with count and timestamp
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const ruleCount = validRules.length;
    const header = `# Count: ${ruleCount}, Updated: ${currentDate}`;
    const output = [header, ...validRules].join('\n');
    
    writeFileSync(outputFile, output);
    console.log(`✓ Saved to ${outputFile}`);
    console.log(`✓ Valid mihomo rules: ${ruleCount}`);
    
    return validRules;
  } catch (error) {
    console.error(`✗ Compilation failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  const mode = process.argv[2];
  
  if (mode === 'ads') {
    await compileList(adsConfig, 'ADs_merged.txt');
  } else if (mode === 'ais') {
    await compileList(aisConfig, 'AIs_merged.txt');
  } else {
    console.error('Usage: node compile-with-hostlist.js [ads|ais]');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

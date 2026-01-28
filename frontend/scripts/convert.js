#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 生成 ADs_merged.txt (使用 Hostlistcompiler)
async function generateAdsMerged() {
  const output = 'ADs_merged.txt';
  
  console.log('Compiling ad rules with Hostlistcompiler...');
  
  try {
    // 在当前目录运行编译
    const scriptsDir = __dirname;
    const rootDir = path.join(__dirname, '..', '..');
    
    execSync('node compile-with-hostlist.js ads', { 
      cwd: scriptsDir,
      stdio: 'inherit'
    });
    
    // 移动编译后的文件到根目录
    const sourceFile = path.join(scriptsDir, output);
    const destFile = path.join(rootDir, output);
    
    if (fs.existsSync(sourceFile)) {
      fs.renameSync(sourceFile, destFile);
    }
    
    // 后处理：应用额外的关键词排除
    const excludeKeywordFile = path.join(scriptsDir, 'exclude-keyword.txt');
    if (fs.existsSync(excludeKeywordFile)) {
      console.log('Applying additional keyword exclusions...');
      const excludeKeywords = fs.readFileSync(excludeKeywordFile, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      const content = fs.readFileSync(destFile, 'utf8');
      const lines = content.split('\n');
      const filtered = lines.filter(line => {
        if (!line.trim() || line.startsWith('#')) return true;
        return !excludeKeywords.some(keyword => line.includes(keyword));
      });
      
      fs.writeFileSync(destFile, filtered.join('\n'));
    }
    
    // 生成 mihomo 格式（使用 +. 前缀）
    console.log('Converting to mihomo format...');
    const content = fs.readFileSync(destFile, 'utf8');
    const mihomoContent = content
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .map(line => {
        if (line.startsWith('DOMAIN-SUFFIX,')) {
          return line.replace(/^DOMAIN-SUFFIX,/, '+.');
        }
        if (line.startsWith('||')) {
          return line.replace(/^\|\|/, '+.').replace(/\^$/, '');
        }
        return line;
      })
      .filter(line => line.trim())
      .join('\n');
    
    const mihomoFile = `${destFile}.mihomo`;
    fs.writeFileSync(mihomoFile, mihomoContent);
    
    // 尝试使用 mihomo 转换
    try {
      execSync(`mihomo convert-ruleset domain text "${mihomoFile}" "${output.replace('.txt', '.mrs')}"`, {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });
    } catch (error) {
      console.log('Warning: mihomo conversion failed or mihomo not found');
    }
    
    // 清理临时文件
    if (fs.existsSync(mihomoFile)) {
      fs.unlinkSync(mihomoFile);
    }
    
    const count = content.split('\n').filter(line => !line.startsWith('#') && line.trim()).length;
    console.log(`✓ Generated ${output} with ${count} domains`);
    
  } catch (error) {
    console.error('Error generating ADs_merged:', error.message);
    throw error;
  }
}

// 生成 AIs_merged.txt (使用 Hostlistcompiler)
async function generateAisMerged() {
  const output = 'AIs_merged.txt';
  
  console.log('Compiling AI rules with Hostlistcompiler...');
  
  try {
    const scriptsDir = __dirname;
    const rootDir = path.join(__dirname, '..', '..');
    
    execSync('node compile-with-hostlist.js ais', { 
      cwd: scriptsDir,
      stdio: 'inherit'
    });
    
    // 移动编译后的文件到根目录
    const sourceFile = path.join(scriptsDir, output);
    const destFile = path.join(rootDir, output);
    
    if (fs.existsSync(sourceFile)) {
      fs.renameSync(sourceFile, destFile);
    }
    
    // 后处理：应用额外的关键词排除
    const excludeKeywordFile = path.join(scriptsDir, 'exclude-keyword.txt');
    if (fs.existsSync(excludeKeywordFile)) {
      console.log('Applying additional keyword exclusions...');
      const excludeKeywords = fs.readFileSync(excludeKeywordFile, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      const content = fs.readFileSync(destFile, 'utf8');
      const lines = content.split('\n');
      const filtered = lines.filter(line => {
        if (!line.trim() || line.startsWith('#')) return true;
        return !excludeKeywords.some(keyword => line.includes(keyword));
      });
      
      fs.writeFileSync(destFile, filtered.join('\n'));
    }
    
    // 生成 mihomo 格式（使用 +. 前缀）
    console.log('Converting to mihomo format...');
    const content = fs.readFileSync(destFile, 'utf8');
    const mihomoContent = content
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .map(line => {
        if (line.startsWith('DOMAIN-SUFFIX,')) {
          return line.replace(/^DOMAIN-SUFFIX,/, '+.');
        }
        if (line.startsWith('||')) {
          return line.replace(/^\|\|/, '+.').replace(/\^$/, '');
        }
        return line;
      })
      .filter(line => line.trim())
      .join('\n');
    
    const mihomoFile = `${destFile}.mihomo`;
    fs.writeFileSync(mihomoFile, mihomoContent);
    
    // 尝试使用 mihomo 转换
    try {
      execSync(`mihomo convert-ruleset domain text "${mihomoFile}" "${output.replace('.txt', '.mrs')}"`, {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });
    } catch (error) {
      console.log('Warning: mihomo conversion failed or mihomo not found');
    }
    
    // 清理临时文件
    if (fs.existsSync(mihomoFile)) {
      fs.unlinkSync(mihomoFile);
    }
    
    const count = content.split('\n').filter(line => !line.startsWith('#') && line.trim()).length;
    console.log(`✓ Generated ${output} with ${count} domains`);
    
  } catch (error) {
    console.error('Error generating AIs_merged:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  const mode = process.argv[2];
  
  if (mode === 'ads') {
    await generateAdsMerged();
  } else if (mode === 'ais') {
    await generateAisMerged();
  } else {
    console.error('Usage: node convert.js [ads|ais]');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

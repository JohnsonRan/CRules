const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');

const configDir = path.join(__dirname, '..', '..', 'config');
const publicDir = path.join(__dirname, '..', 'public');
const resourcesDir = path.join(publicDir, 'resources');
const iconDir = path.join(resourcesDir, 'icon');
const rulesOutputDir = path.join(resourcesDir, 'rules');
const configOutputDir = path.join(resourcesDir, 'config');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });
if (!fs.existsSync(rulesOutputDir)) fs.mkdirSync(rulesOutputDir, { recursive: true });
if (!fs.existsSync(configOutputDir)) fs.mkdirSync(configOutputDir, { recursive: true });

async function downloadFile(url, outputPath) {
  try {
    console.log(`下载: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    // 检查文件内容是否为空
    if (!response.data || response.data.length === 0) {
      console.log(`⚠ 跳过空文件: ${url}`);
      return false;
    }
    
    fs.writeFileSync(outputPath, response.data);
    console.log(`✓ 保存到: ${outputPath} (${response.data.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`✗ 下载失败 ${url}:`, error.message);
    return false;
  }
}

function moveLocalFile(sourcePath, outputPath, fileName) {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠ 本地文件不存在: ${sourcePath}`);
      return false;
    }
    
    console.log(`📦 移动本地文件: ${fileName}`);
    
    // 复制文件（而不是移动，保留原文件）
    fs.copyFileSync(sourcePath, outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log(`✓ 复制到: ${outputPath} (${stats.size} bytes)`);
    return true;
  } catch (error) {
    console.error(`✗ 移动文件失败 ${sourcePath}:`, error.message);
    return false;
  }
}

function getFileName(url, name, type) {
  const urlPath = new URL(url).pathname;
  let ext = path.extname(urlPath) || '.txt';
  
  // 对于规则文件，优先使用 YAML 中定义的名字
  if (type === 'rules' && name) {
    const safeName = name.replace(/[<>:"/\\|?*]/g, '_');
    return safeName + ext;
  }
  
  // 对于图标，优先使用 URL 中的文件名
  const urlFileName = path.basename(urlPath);
  if (urlFileName && urlFileName !== '/' && path.extname(urlFileName)) {
    return urlFileName;
  }
  
  // 如果都没有，使用 name 参数
  if (name) {
    const safeName = name.replace(/[<>:"/\\|?*]/g, '_');
    return safeName + ext;
  }
  
  // 最后的备选方案
  return 'file_' + Date.now() + ext;
}



async function extractAndDownload() {
  const urls = [];
  const yamlFiles = ['AIB.yaml', 'AIO.yaml'];
  const downloadedFiles = [];
  const urlMapping = new Map();
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('=== 提取 URL ===\n');
  
  for (const file of yamlFiles) {
    const filePath = path.join(configDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`跳过不存在的文件: ${file}`);
      continue;
    }
    
    console.log(`处理: ${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);
    
    if (data['proxy-groups']) {
      for (const group of data['proxy-groups']) {
        if (group.icon) {
          urls.push({
            url: group.icon,
            type: 'icon',
            name: group.name,
            source: file
          });
        }
      }
    }
    
    if (data['rule-providers']) {
      for (const [name, provider] of Object.entries(data['rule-providers'])) {
        if (provider.url) {
          urls.push({
            url: provider.url,
            type: 'rules',
            name: name,
            source: file
          });
        }
      }
    }
  }
  
  console.log(`\n找到 ${urls.length} 个 URL\n`);
  
  // 去重 URL
  const uniqueUrls = [];
  const seenUrls = new Set();
  const duplicates = [];
  
  for (const item of urls) {
    if (seenUrls.has(item.url)) {
      duplicates.push(item);
    } else {
      seenUrls.add(item.url);
      uniqueUrls.push(item);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`⚠ 发现 ${duplicates.length} 个重复 URL，已自动去重\n`);
  }
  
  console.log(`准备下载 ${uniqueUrls.length} 个唯一 URL\n`);
  console.log('=== 开始下载 ===\n');
  
  let successCount = 0;
  let failCount = 0;
  let emptyCount = 0;
  
  for (const item of uniqueUrls) {
    const targetDir = item.type === 'icon' ? iconDir : rulesOutputDir;
    const fileName = getFileName(item.url, item.name, item.type);
    const outputPath = path.join(targetDir, fileName);
    const relativePath = path.relative(path.join(__dirname, '..'), outputPath);
    
    // 检查是否是 ADs_merged 或 ai (AIs_merged) 规则
    const isLocalAdRule = item.name === 'ADs_merged' && item.url.endsWith('.mrs');
    const isLocalAiRule = item.name === 'ai' && item.url.endsWith('.mrs');
    const isLocalRule = isLocalAdRule || isLocalAiRule;
    
    // 对于本地生成的规则文件，从根目录移动
    if (isLocalRule) {
      const rootDir = path.join(__dirname, '..', '..');
      
      // 处理 .txt 版本
      const txtFileName = fileName.replace(/\.mrs$/, '.txt');
      const txtSourcePath = path.join(rootDir, isLocalAdRule ? 'ADs_merged.txt' : 'AIs_merged.txt');
      const txtOutputPath = path.join(targetDir, txtFileName);
      const txtRelativePath = path.relative(path.join(__dirname, '..'), txtOutputPath);
      
      const txtSuccess = moveLocalFile(txtSourcePath, txtOutputPath, txtFileName);
      
      if (txtSuccess) {
        const txtStats = fs.statSync(txtOutputPath);
        if (txtStats.size > 0) {
          const txtResourcePath = `resources/${item.type}/${txtFileName}`;
          const txtApiUrl = `/api/files/${item.type}/${txtFileName}`;
          
          downloadedFiles.push({
            originalUrl: item.url.replace(/\.mrs$/, '.txt'),
            localPath: txtRelativePath.replace(/\\/g, '/'),
            fileUrl: txtApiUrl,
            resourcePath: txtResourcePath,
            type: item.type,
            name: item.name,
            source: item.source,
            fileName: txtFileName
          });
        }
      }
      
      // 处理 .mrs 版本
      const mrsSourcePath = path.join(rootDir, isLocalAdRule ? 'ADs_merged.mrs' : 'AIs_merged.mrs');
      const mrsSuccess = moveLocalFile(mrsSourcePath, outputPath, fileName);
      
      if (mrsSuccess) {
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          console.log(`⚠ 删除空文件: ${outputPath}`);
          fs.unlinkSync(outputPath);
          emptyCount++;
        } else {
          successCount++;
          const resourcePath = `resources/${item.type}/${fileName}`;
          const fullUrl = `${baseUrl}/${resourcePath}`;
          const apiUrl = `/api/files/${item.type}/${fileName}`;
          
          urlMapping.set(item.url, fullUrl);
          
          downloadedFiles.push({
            originalUrl: item.url,
            localPath: relativePath.replace(/\\/g, '/'),
            fileUrl: apiUrl,
            resourcePath: resourcePath,
            type: item.type,
            name: item.name,
            source: item.source,
            fileName: fileName
          });
        }
      } else {
        failCount++;
      }
    } else {
      // 其他文件正常下载
      const success = await downloadFile(item.url, outputPath);
      if (success) {
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          console.log(`⚠ 删除空文件: ${outputPath}`);
          fs.unlinkSync(outputPath);
          emptyCount++;
        } else {
          successCount++;
          const resourcePath = `resources/${item.type}/${fileName}`;
          const fullUrl = `${baseUrl}/${resourcePath}`;
          const apiUrl = `/api/files/${item.type}/${fileName}`;
          
          urlMapping.set(item.url, fullUrl);
          
          downloadedFiles.push({
            originalUrl: item.url,
            localPath: relativePath.replace(/\\/g, '/'),
            fileUrl: apiUrl,
            resourcePath: resourcePath,
            type: item.type,
            name: item.name,
            source: item.source,
            fileName: fileName
          });
        }
      } else {
        failCount++;
      }
    }
  }
  
  // 保存下载记录到 JSON 文件
  const manifestPath = path.join(resourcesDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(downloadedFiles, null, 2));
  console.log(`\n✓ 生成清单文件: ${manifestPath}`);
  
  // 生成替换后的配置文件
  console.log('\n=== 生成新配置文件 ===\n');
  
  if (urlMapping.size === 0) {
    console.log('⚠ 没有成功下载的文件，跳过配置文件生成');
  } else {
    for (const file of yamlFiles) {
      const filePath = path.join(configDir, file);
      
      if (!fs.existsSync(filePath)) continue;
      
      let content = fs.readFileSync(filePath, 'utf8');
      let replacedCount = 0;
      
      // 替换所有映射的URL（只替换成功下载且非空的文件）
      for (const [originalUrl, newUrl] of urlMapping.entries()) {
        const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedUrl, 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newUrl);
          replacedCount += matches.length;
        }
      }
      
      // 保存新配置文件
      const outputPath = path.join(configOutputDir, file);
      fs.writeFileSync(outputPath, content, 'utf8');
      
      console.log(`✓ ${file} -> ${outputPath}`);
      console.log(`  替换了 ${replacedCount} 处 URL（共 ${urlMapping.size} 个唯一 URL）`);
    }
  }
  
  console.log('\n=== 完成 ===');
  console.log(`总 URL: ${urls.length}`);
  console.log(`去重后: ${uniqueUrls.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  if (emptyCount > 0) {
    console.log(`空文件: ${emptyCount}`);
  }
  
  if (!process.env.BASE_URL) {
    console.log(`\n💡 提示: 设置环境变量 BASE_URL 来自定义域名`);
  }
}

extractAndDownload().catch(console.error);

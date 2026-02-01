#!/usr/bin/env node
/**
 * AgentFlow 图标生成脚本
 * 
 * 使用方法:
 *   node scripts/generate-icons.js
 * 
 * 依赖:
 *   npm install sharp png-to-ico
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了必要的依赖
async function checkDependencies() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    console.log('📦 正在安装依赖...');
    const { execSync } = require('child_process');
    execSync('npm install sharp png-to-ico --save-dev', { stdio: 'inherit' });
    return true;
  }
}

async function generateIcons() {
  await checkDependencies();
  
  const sharp = require('sharp');
  
  const iconsDir = path.join(__dirname, '../src-tauri/icons');
  const svgPath = path.join(iconsDir, 'app-icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ 找不到源图标文件:', svgPath);
    process.exit(1);
  }
  
  const svgBuffer = fs.readFileSync(svgPath);
  
  // 定义需要生成的图标尺寸
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 512 }, // 用于生成 ico/icns
  ];
  
  console.log('🎨 开始生成图标...\n');
  
  for (const { name, size } of sizes) {
    const outputPath = path.join(iconsDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${name} (${size}x${size})`);
  }
  
  // 生成 ICO 文件 (Windows)
  try {
    const pngToIco = require('png-to-ico');
    const icoSizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      icoSizes.map(size => 
        sharp(svgBuffer).resize(size, size).png().toBuffer()
      )
    );
    const icoBuffer = await pngToIco(pngBuffers);
    fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
    console.log('  ✅ icon.ico (Windows)');
  } catch (e) {
    console.log('  ⚠️  icon.ico 生成失败，请使用在线工具转换');
  }
  
  console.log('\n✨ 图标生成完成！');
  console.log('\n📝 注意: macOS 的 icon.icns 需要使用 Tauri CLI 或在线工具生成:');
  console.log('   pnpm tauri icon src-tauri/icons/app-icon.svg');
}

generateIcons().catch(console.error);

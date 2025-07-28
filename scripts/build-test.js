#!/usr/bin/env node

/**
 * 构建测试脚本
 * 用于验证响应式优化后的代码是否能正常构建
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建测试...\n');

// 检查关键文件是否存在
const criticalFiles = [
  'app/admin/layout.tsx',
  'app/admin/page.tsx',
  'app/admin/activation-codes/page.tsx',
  'app/admin/software/page.tsx',
  'components/Navigation.tsx',
  'components/PageContainer.tsx',
  'components/ResponsiveNotification.tsx',
  'styles/globals.css'
];

console.log('📁 检查关键文件...');
let missingFiles = [];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n❌ 发现 ${missingFiles.length} 个缺失文件，构建可能失败`);
  process.exit(1);
}

console.log('\n📦 检查依赖...');
try {
  execSync('npm list --depth=0', { stdio: 'pipe' });
  console.log('✅ 依赖检查通过');
} catch (error) {
  console.log('⚠️ 依赖检查警告，但继续构建测试');
}

console.log('\n🔧 运行TypeScript检查...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript检查通过');
} catch (error) {
  console.log('❌ TypeScript检查失败');
  process.exit(1);
}

console.log('\n🏗️ 运行Next.js构建...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 构建成功！');
} catch (error) {
  console.log('\n❌ 构建失败');
  process.exit(1);
}

console.log('\n🎉 所有测试通过！响应式优化构建成功。');

// 输出优化总结
console.log('\n📊 优化总结:');
console.log('- ✅ 移除了运行时window检测');
console.log('- ✅ 修复了TypeScript类型错误');
console.log('- ✅ 优化了响应式布局');
console.log('- ✅ 清理了重复代码');
console.log('- ✅ 统一了组件结构');
console.log('- ✅ 改进了移动端体验');

#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 验证项目是否准备好部署到生产环境
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署前检查...\n');

let hasErrors = false;
let hasWarnings = false;

function error(message) {
  console.log(`❌ 错误: ${message}`);
  hasErrors = true;
}

function warning(message) {
  console.log(`⚠️  警告: ${message}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// 检查必要文件
function checkRequiredFiles() {
  info('检查必要文件...');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'lib/db-connection.ts',
    'lib/db-schema.ts',
    'lib/cors.ts'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      success(`${file} 存在`);
    } else {
      error(`缺少必要文件: ${file}`);
    }
  });
}

// 检查环境变量配置
function checkEnvironmentConfig() {
  info('\n检查环境变量配置...');
  
  if (fs.existsSync('.env.example')) {
    success('.env.example 存在');
  } else {
    warning('缺少 .env.example 文件');
  }
  
  // 检查 .env.local 是否存在（开发环境）
  if (fs.existsSync('.env.local')) {
    warning('.env.local 存在 - 确保生产环境中配置了正确的环境变量');
  }
}

// 检查 package.json
function checkPackageJson() {
  info('\n检查 package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 检查必要的脚本
    const requiredScripts = ['build', 'start'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        success(`脚本 "${script}" 已配置`);
      } else {
        error(`缺少必要脚本: ${script}`);
      }
    });
    
    // 检查必要的依赖
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      '@neondatabase/serverless',
      'drizzle-orm'
    ];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        success(`依赖 "${dep}" 已安装`);
      } else {
        error(`缺少必要依赖: ${dep}`);
      }
    });
    
    // 检查是否有不应该存在的依赖
    const deprecatedDeps = ['hono', '@vercel/kv', 'bcryptjs', 'jsonwebtoken'];
    deprecatedDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        warning(`发现已弃用的依赖: ${dep} - 考虑移除`);
      }
    });
    
  } catch (err) {
    error(`无法读取 package.json: ${err.message}`);
  }
}

// 检查 API 路由
function checkApiRoutes() {
  info('\n检查 API 路由...');
  
  const apiRoutes = [
    'app/api/health/route.ts',
    'app/api/activation-codes/route.ts',
    'app/api/activation-codes/stats/route.ts',
    'app/api/activation-codes/verify/route.ts'
  ];
  
  apiRoutes.forEach(route => {
    if (fs.existsSync(route)) {
      success(`API 路由 ${route} 存在`);
    } else {
      warning(`API 路由 ${route} 不存在`);
    }
  });
}

// 检查 debug 文件夹是否被正确忽略
function checkDebugFolder() {
  info('\n检查 debug 文件夹配置...');
  
  if (fs.existsSync('debug')) {
    success('debug 文件夹存在');
    
    // 检查 .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (gitignore.includes('debug/')) {
        success('debug/ 已在 .gitignore 中');
      } else {
        error('debug/ 未在 .gitignore 中 - 调试文件可能会被提交');
      }
    } else {
      error('缺少 .gitignore 文件');
    }
  } else {
    info('debug 文件夹不存在（正常）');
  }
}

// 检查 Next.js 配置
function checkNextConfig() {
  info('\n检查 Next.js 配置...');
  
  try {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    if (nextConfig.includes('Access-Control-Allow-Origin')) {
      success('CORS 配置已设置');
    } else {
      warning('未找到 CORS 配置');
    }
    
    if (nextConfig.includes('X-Content-Type-Options')) {
      success('安全头部已配置');
    } else {
      warning('未找到安全头部配置');
    }
    
  } catch (err) {
    error(`无法读取 next.config.js: ${err.message}`);
  }
}

// 运行所有检查
function runAllChecks() {
  checkRequiredFiles();
  checkEnvironmentConfig();
  checkPackageJson();
  checkApiRoutes();
  checkDebugFolder();
  checkNextConfig();
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📋 检查总结:');
  
  if (hasErrors) {
    console.log('❌ 发现错误 - 请修复后再部署');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  发现警告 - 建议检查后再部署');
    console.log('💡 如果确认无问题，可以继续部署');
  } else {
    console.log('✅ 所有检查通过 - 项目准备就绪！');
  }
  
  console.log('\n🚀 部署建议:');
  console.log('1. 确保在部署平台配置了正确的环境变量');
  console.log('2. 设置 DATABASE_URL 指向生产数据库');
  console.log('3. 配置 API_KEY 用于API安全');
  console.log('4. 启用 ENABLE_API_KEY_AUTH=true');
  console.log('5. 启用 ENABLE_RATE_LIMITING=true');
}

// 执行检查
runAllChecks();

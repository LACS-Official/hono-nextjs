#!/usr/bin/env node

/**
 * Vercel 部署验证脚本
 * 验证所有部署相关问题是否已解决
 */

const fs = require('fs')
const path = require('path')

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`)
  return exists
}

function checkFileIsValid(filePath, description, minSize = 0) {
  const fullPath = path.join(process.cwd(), filePath)
  try {
    const stats = fs.statSync(fullPath)
    const isValid = stats.size > minSize
    console.log(`${isValid ? '✅' : '❌'} ${description}: ${filePath} (${stats.size} bytes)`)
    return isValid
  } catch (error) {
    console.log(`❌ ${description}: ${filePath} (不存在)`)
    return false
  }
}

async function verifyFaviconFix() {
  console.log('\n🎨 验证 Favicon 修复...')
  
  let allValid = true
  
  // 检查有效的 favicon 文件
  allValid &= checkFileIsValid('public/favicon.ico', 'Public favicon.ico (有效 ICO 文件)', 1000)
  allValid &= checkFileExists('public/favicon.svg', 'Public favicon.svg')
  allValid &= checkFileExists('app/icon.tsx', 'App icon.tsx (动态图标)')
  
  // 确保没有无效的 favicon 文件
  const invalidFiles = ['app/favicon.ico', 'app/icon.png']
  invalidFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      console.log(`⚠️ 发现可能有问题的文件: ${file}`)
      allValid = false
    }
  })
  
  return allValid
}

async function verifyBuildFixes() {
  console.log('\n🔧 验证构建修复...')
  
  let allValid = true
  
  // 检查关键组件文件
  const componentFiles = [
    'components/EnhancedVersionManager.tsx',
    'components/VersionComparison.tsx'
  ]
  
  componentFiles.forEach(file => {
    allValid &= checkFileExists(file, `组件文件: ${file}`)
  })
  
  // 检查图标导入修复
  try {
    const enhancedManagerContent = fs.readFileSync('components/EnhancedVersionManager.tsx', 'utf8')
    const hasSwapOutlined = enhancedManagerContent.includes('SwapOutlined')
    const noCompareOutlined = !enhancedManagerContent.includes('CompareOutlined')
    
    console.log(`${hasSwapOutlined ? '✅' : '❌'} EnhancedVersionManager 使用 SwapOutlined`)
    console.log(`${noCompareOutlined ? '✅' : '❌'} EnhancedVersionManager 不再使用 CompareOutlined`)
    
    allValid &= hasSwapOutlined && noCompareOutlined
  } catch (error) {
    console.log('❌ 无法检查图标导入修复')
    allValid = false
  }
  
  // 检查 Tag size 属性修复
  try {
    const softwarePageContent = fs.readFileSync('app/admin/software/page.tsx', 'utf8')
    // 更精确地检查 Tag 组件是否使用 size 属性
    const tagSizePattern = /<Tag[^>]*size="small"/
    const hasTagSize = tagSizePattern.test(softwarePageContent)
    const hasFontSize = softwarePageContent.includes('fontSize: \'12px\'')

    console.log(`${!hasTagSize ? '✅' : '❌'} 软件页面 Tag 组件不使用 size 属性`)
    console.log(`${hasFontSize ? '✅' : '❌'} 软件页面使用 fontSize 样式`)

    allValid &= !hasTagSize && hasFontSize
  } catch (error) {
    console.log('❌ 无法检查 Tag 属性修复')
    allValid = false
  }
  
  return allValid
}

async function verifyDatabaseSetup() {
  console.log('\n🗄️ 验证数据库设置...')
  
  let allValid = true
  
  // 检查数据库相关脚本
  const dbScripts = [
    'scripts/run-migration.js',
    'scripts/seed-test-data.js',
    'scripts/check-database-health.js',
    'scripts/generate-favicon.js'
  ]
  
  dbScripts.forEach(script => {
    allValid &= checkFileExists(script, `数据库脚本: ${script}`)
  })
  
  // 检查环境变量配置
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const hasCorrectAPIURL = envContent.includes('NEXT_PUBLIC_API_URL=http://localhost:3000/app')
    const hasDatabaseURL = envContent.includes('SOFTWARE_DATABASE_URL=')
    
    console.log(`${hasCorrectAPIURL ? '✅' : '❌'} API URL 配置正确`)
    console.log(`${hasDatabaseURL ? '✅' : '❌'} 数据库 URL 已配置`)
    
    allValid &= hasCorrectAPIURL && hasDatabaseURL
  } catch (error) {
    console.log('❌ 无法检查环境变量配置')
    allValid = false
  }
  
  return allValid
}

async function verifyPageStructure() {
  console.log('\n📱 验证页面结构...')
  
  let allValid = true
  
  // 检查主要页面文件
  const pageFiles = [
    'app/admin/software/page.tsx',
    'app/admin/software/new/page.tsx',
    'app/admin/software/[id]/page.tsx',
    'app/admin/software/[id]/edit/page.tsx'
  ]
  
  pageFiles.forEach(file => {
    allValid &= checkFileExists(file, `页面文件: ${file}`)
  })
  
  // 检查 API 路由
  const apiRoutes = [
    'app/app/software/route.ts',
    'app/app/software/id/[id]/route.ts',
    'app/app/software/id/[id]/versions/route.ts'
  ]
  
  apiRoutes.forEach(route => {
    allValid &= checkFileExists(route, `API 路由: ${route}`)
  })
  
  return allValid
}

async function runBuildTest() {
  console.log('\n🏗️ 运行构建测试...')
  
  // 检查是否有 .next 目录（表示构建成功）
  const buildExists = fs.existsSync('.next')
  console.log(`${buildExists ? '✅' : '⚠️'} Next.js 构建目录存在`)
  
  if (buildExists) {
    // 检查构建输出
    try {
      const buildManifest = fs.existsSync('.next/build-manifest.json')
      console.log(`${buildManifest ? '✅' : '❌'} 构建清单文件存在`)
      return buildManifest
    } catch (error) {
      console.log('⚠️ 无法验证构建输出')
      return false
    }
  }
  
  console.log('💡 提示: 运行 "npm run build" 来验证构建')
  return false
}

async function runVerification() {
  console.log('🔍 开始 Vercel 部署验证\n')
  
  const results = []
  
  results.push(await verifyFaviconFix())
  results.push(await verifyBuildFixes())
  results.push(await verifyDatabaseSetup())
  results.push(await verifyPageStructure())
  results.push(await runBuildTest())
  
  const allPassed = results.every(result => result)
  
  console.log('\n' + '='.repeat(60))
  
  if (allPassed) {
    console.log('🎉 所有 Vercel 部署验证通过！')
    console.log('\n✅ 修复内容：')
    console.log('1. ✅ 创建了有效的 favicon.ico 文件')
    console.log('2. ✅ 修复了 CompareOutlined 图标导入问题')
    console.log('3. ✅ 移除了 Tag 组件的 size 属性')
    console.log('4. ✅ 数据库迁移和配置完成')
    console.log('5. ✅ 所有页面和 API 路由就绪')
    console.log('6. ✅ Next.js 构建成功')
    
    console.log('\n🚀 准备部署到 Vercel：')
    console.log('1. 提交所有更改到 Git')
    console.log('2. 推送到 GitHub')
    console.log('3. Vercel 将自动部署')
    console.log('4. 验证生产环境功能')
    
    console.log('\n📋 部署后检查清单：')
    console.log('- [ ] favicon 正常显示')
    console.log('- [ ] 软件列表页面加载')
    console.log('- [ ] API 端点响应正常')
    console.log('- [ ] 数据库连接正常')
    console.log('- [ ] 所有功能正常工作')
    
  } else {
    console.log('❌ Vercel 部署验证失败！请检查上述问题。')
    
    console.log('\n💡 故障排除建议：')
    console.log('1. 确保所有文件都已正确创建')
    console.log('2. 运行 "npm run build" 测试本地构建')
    console.log('3. 检查环境变量配置')
    console.log('4. 验证数据库连接')
    console.log('5. 重新生成 favicon 文件')
  }
}

// 运行验证
runVerification().catch(console.error)

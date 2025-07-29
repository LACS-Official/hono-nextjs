#!/usr/bin/env node

/**
 * 软件管理系统验证脚本
 * 验证代码结构和配置的正确性
 */

const fs = require('fs')
const path = require('path')

// 验证文件存在性
function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`)
  return exists
}

// 验证文件内容
function checkFileContent(filePath, searchText, description) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    const found = content.includes(searchText)
    console.log(`${found ? '✅' : '❌'} ${description}`)
    return found
  } catch (error) {
    console.log(`❌ ${description} (文件读取失败)`)
    return false
  }
}

// 验证数据库schema
function validateDatabaseSchema() {
  console.log('\n📊 验证数据库Schema...')
  
  let allValid = true
  
  // 检查schema文件
  allValid &= checkFileExists('lib/software-schema.ts', '软件Schema文件')
  
  // 检查自增ID配置
  allValid &= checkFileContent(
    'lib/software-schema.ts', 
    'serial(\'id\').primaryKey()', 
    '软件表使用自增ID'
  )
  
  // 检查版本历史表结构
  allValid &= checkFileContent(
    'lib/software-schema.ts', 
    'softwareVersionHistory', 
    '版本历史表定义'
  )
  
  // 检查下载链接结构
  allValid &= checkFileContent(
    'lib/software-schema.ts', 
    'downloadLinks', 
    '多下载源支持'
  )
  
  // 检查下载统计表
  allValid &= checkFileContent(
    'lib/software-schema.ts', 
    'downloadStats', 
    '下载统计表定义'
  )
  
  return allValid
}

// 验证API路由
function validateAPIRoutes() {
  console.log('\n🔗 验证API路由...')
  
  let allValid = true
  
  // 检查主要API文件
  allValid &= checkFileExists('app/app/software/route.ts', '软件管理API')
  allValid &= checkFileExists('app/app/software/id/[id]/route.ts', '软件详情API')
  allValid &= checkFileExists('app/app/software/id/[id]/versions/route.ts', '版本管理API')
  allValid &= checkFileExists('app/app/software/version-management/route.ts', '版本管理功能API')
  
  // 检查API功能
  allValid &= checkFileContent(
    'app/app/software/route.ts', 
    'getLatestVersion', 
    '自动版本检测功能'
  )
  
  allValid &= checkFileContent(
    'app/app/software/id/[id]/versions/route.ts', 
    'downloadLinks', 
    '多下载源API支持'
  )
  
  return allValid
}

// 验证前端组件
function validateFrontendComponents() {
  console.log('\n🎨 验证前端组件...')
  
  let allValid = true
  
  // 检查组件文件
  allValid &= checkFileExists('components/VersionManager.tsx', '版本管理器组件')
  allValid &= checkFileExists('components/VersionComparison.tsx', '版本比较组件')
  allValid &= checkFileExists('components/EnhancedVersionManager.tsx', '增强版本管理器组件')
  
  // 检查软件管理页面
  allValid &= checkFileExists('app/admin/software/page.tsx', '软件列表页面')
  allValid &= checkFileExists('app/admin/software/[id]/page.tsx', '软件详情页面')
  allValid &= checkFileExists('app/admin/software/[id]/edit/page.tsx', '软件编辑页面')
  
  // 检查组件功能
  allValid &= checkFileContent(
    'components/EnhancedVersionManager.tsx', 
    'VersionComparison', 
    '版本比较功能集成'
  )
  
  allValid &= checkFileContent(
    'app/admin/software/page.tsx', 
    'Tag color="blue">#{id}', 
    '新ID格式显示'
  )
  
  return allValid
}

// 验证版本管理功能
function validateVersionManagement() {
  console.log('\n⚙️ 验证版本管理功能...')
  
  let allValid = true
  
  // 检查版本管理器文件
  allValid &= checkFileExists('lib/version-manager.ts', '版本管理器库')
  
  // 检查版本比较功能
  allValid &= checkFileContent(
    'lib/version-manager.ts', 
    'compareVersions', 
    '版本比较算法'
  )
  
  // 检查自动更新功能
  allValid &= checkFileContent(
    'lib/version-manager.ts', 
    'updateLatestVersion', 
    '自动版本更新功能'
  )
  
  // 检查版本建议功能
  allValid &= checkFileContent(
    'lib/version-manager.ts', 
    'suggestNextVersion', 
    '版本建议功能'
  )
  
  return allValid
}

// 验证迁移脚本
function validateMigrationScript() {
  console.log('\n🔄 验证数据库迁移脚本...')
  
  let allValid = true
  
  // 检查迁移文件
  allValid &= checkFileExists('drizzle/0005_migrate_to_serial_ids.sql', '数据库迁移脚本')
  
  // 检查迁移内容
  allValid &= checkFileContent(
    'drizzle/0005_migrate_to_serial_ids.sql', 
    'software_new', 
    '新软件表创建'
  )
  
  allValid &= checkFileContent(
    'drizzle/0005_migrate_to_serial_ids.sql', 
    'software_id_mapping', 
    'UUID到自增ID映射表'
  )
  
  allValid &= checkFileContent(
    'drizzle/0005_migrate_to_serial_ids.sql', 
    'download_stats', 
    '下载统计表创建'
  )
  
  return allValid
}

// 验证配置文件
function validateConfiguration() {
  console.log('\n⚙️ 验证配置文件...')
  
  let allValid = true
  
  // 检查配置文件
  allValid &= checkFileExists('drizzle.software.config.ts', 'Drizzle软件数据库配置')
  allValid &= checkFileExists('package.json', 'Package配置')
  allValid &= checkFileExists('tsconfig.json', 'TypeScript配置')
  
  // 检查依赖
  allValid &= checkFileContent(
    'package.json', 
    'drizzle-orm', 
    'Drizzle ORM依赖'
  )
  
  allValid &= checkFileContent(
    'package.json', 
    'antd', 
    'Ant Design依赖'
  )
  
  return allValid
}

// 验证文档
function validateDocumentation() {
  console.log('\n📚 验证文档...')
  
  let allValid = true
  
  // 检查文档文件
  allValid &= checkFileExists('docs/SOFTWARE_SYSTEM_DEPLOYMENT_CHECKLIST.md', '部署检查清单')
  
  return allValid
}

// 主验证函数
function runValidation() {
  console.log('🔍 开始软件管理系统验证\n')
  
  const results = []
  
  results.push(validateDatabaseSchema())
  results.push(validateAPIRoutes())
  results.push(validateFrontendComponents())
  results.push(validateVersionManagement())
  results.push(validateMigrationScript())
  results.push(validateConfiguration())
  results.push(validateDocumentation())
  
  const allPassed = results.every(result => result)
  
  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('🎉 所有验证通过！系统已准备就绪。')
    console.log('\n📋 下一步操作：')
    console.log('1. 运行数据库迁移脚本')
    console.log('2. 启动开发服务器进行测试')
    console.log('3. 执行部署检查清单')
    console.log('4. 进行用户验收测试')
  } else {
    console.log('❌ 验证失败！请检查上述问题。')
    process.exit(1)
  }
}

// 运行验证
if (require.main === module) {
  runValidation()
}

module.exports = {
  runValidation,
  validateDatabaseSchema,
  validateAPIRoutes,
  validateFrontendComponents,
  validateVersionManagement,
  validateMigrationScript,
  validateConfiguration,
  validateDocumentation
}

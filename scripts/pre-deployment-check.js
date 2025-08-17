/**
 * 部署前检查脚本
 * 验证激活码格式更新和认证修复是否正确实施
 */

const fs = require('fs')
const path = require('path')

// 检查文件是否存在
function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}

// 检查文件内容是否包含指定字符串
function checkFileContains(filePath, searchString) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    return content.includes(searchString)
  } catch (error) {
    return false
  }
}

// 检查项目列表
const checks = [
  // 1. 激活码生成逻辑检查
  {
    name: '激活码生成函数更新',
    file: 'app/api/activation-codes/route.ts',
    check: () => checkFileContains('app/api/activation-codes/route.ts', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    description: '检查新的8位激活码生成逻辑'
  },
  
  // 2. 激活码验证逻辑检查
  {
    name: '激活码格式验证函数',
    file: 'app/api/activation-codes/route.ts',
    check: () => checkFileContains('app/api/activation-codes/route.ts', 'isValidActivationCodeFormat'),
    description: '检查激活码格式验证函数'
  },
  
  // 3. JWT认证支持检查
  {
    name: 'JWT认证支持 - 激活码生成API',
    file: 'app/api/activation-codes/route.ts',
    check: () => checkFileContains('app/api/activation-codes/route.ts', 'authenticateRequest'),
    description: '检查激活码生成API的JWT认证支持'
  },
  
  // 4. JWT认证支持检查 - 激活码详情API
  {
    name: 'JWT认证支持 - 激活码详情API',
    file: 'app/api/activation-codes/[id]/route.ts',
    check: () => checkFileContains('app/api/activation-codes/[id]/route.ts', 'authenticateRequest'),
    description: '检查激活码详情API的JWT认证支持'
  },
  
  // 5. 前端API客户端更新检查
  {
    name: '前端API客户端认证更新',
    file: 'utils/activation-codes-api.ts',
    check: () => checkFileContains('utils/activation-codes-api.ts', 'getAuthToken'),
    description: '检查前端API客户端的自动认证功能'
  },
  
  // 6. API文档更新检查
  {
    name: 'API文档认证说明更新',
    file: 'docs/API_USAGE_GUIDE.md',
    check: () => checkFileContains('docs/API_USAGE_GUIDE.md', 'JWT Token 或 API Key'),
    description: '检查API文档中的双重认证说明'
  },
  
  // 7. 更新日志检查
  {
    name: '更新日志记录',
    file: 'docs/API_USAGE_GUIDE.md',
    check: () => checkFileContains('docs/API_USAGE_GUIDE.md', '认证系统增强'),
    description: '检查更新日志中的认证增强记录'
  },
  
  // 8. 测试文件检查
  {
    name: '激活码格式测试文件',
    file: 'tests/activation-code-format.test.ts',
    check: () => checkFileExists('tests/activation-code-format.test.ts'),
    description: '检查激活码格式测试文件是否存在'
  },
  
  // 9. 确保测试页面已删除
  {
    name: '测试页面已删除',
    file: 'app/test-auth/page.tsx',
    check: () => !checkFileExists('app/test-auth/page.tsx'),
    description: '确保调试用的测试页面已从生产代码中删除'
  },
  
  // 10. 迁移文档检查
  {
    name: '激活码格式迁移文档',
    file: 'docs/ACTIVATION_CODE_FORMAT_MIGRATION.md',
    check: () => checkFileExists('docs/ACTIVATION_CODE_FORMAT_MIGRATION.md'),
    description: '检查激活码格式迁移文档是否存在'
  },
  
  // 11. OAuth修复文档检查
  {
    name: 'OAuth认证修复文档',
    file: 'docs/OAUTH_ACTIVATION_CODE_FIX.md',
    check: () => checkFileExists('docs/OAUTH_ACTIVATION_CODE_FIX.md'),
    description: '检查OAuth认证修复文档是否存在'
  }
]

// 运行检查
function runChecks() {
  console.log('🚀 开始部署前检查...\n')
  
  let passedChecks = 0
  let failedChecks = 0
  
  checks.forEach((check, index) => {
    const result = check.check()
    const status = result ? '✅' : '❌'
    const statusText = result ? 'PASS' : 'FAIL'
    
    console.log(`${index + 1}. ${check.name}`)
    console.log(`   ${status} ${statusText} - ${check.description}`)
    
    if (!result) {
      console.log(`   📁 文件: ${check.file}`)
      failedChecks++
    } else {
      passedChecks++
    }
    
    console.log('')
  })
  
  // 总结
  console.log('📊 检查结果总结:')
  console.log(`   ✅ 通过: ${passedChecks}`)
  console.log(`   ❌ 失败: ${failedChecks}`)
  console.log(`   📝 总计: ${checks.length}`)
  
  if (failedChecks === 0) {
    console.log('\n🎉 所有检查通过！项目已准备好部署。')
    console.log('\n📋 部署清单:')
    console.log('   ✅ 激活码格式已更新为8位格式')
    console.log('   ✅ 支持新旧激活码格式验证')
    console.log('   ✅ 激活码API支持JWT和API Key双重认证')
    console.log('   ✅ 前端自动处理JWT认证')
    console.log('   ✅ API文档已更新')
    console.log('   ✅ 测试文件已创建')
    console.log('   ✅ 文档已完善')
    console.log('   ✅ 调试文件已清理')
    
    process.exit(0)
  } else {
    console.log('\n❌ 部分检查失败，请修复后再部署。')
    process.exit(1)
  }
}

// 运行检查
runChecks()

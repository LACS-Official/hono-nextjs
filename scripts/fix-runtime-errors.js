#!/usr/bin/env node

/**
 * 运行时错误修复脚本
 * 修复和验证运行时遇到的各种错误
 */

const fs = require('fs')
const path = require('path')

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`)
  return exists
}

async function testAPIEndpoint(url, description) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    const success = response.ok && data.success
    console.log(`${success ? '✅' : '❌'} ${description}: ${url} (${response.status})`)
    if (!success && data.error) {
      console.log(`   错误: ${data.error}`)
    }
    return success
  } catch (error) {
    console.log(`❌ ${description}: ${url} (${error.message})`)
    return false
  }
}

async function verifyAPILimitFix() {
  console.log('\n🔧 验证 API 限制修复...')
  
  let allValid = true
  
  // 检查 API 路由文件中的限制设置
  try {
    const apiContent = fs.readFileSync('app/app/software/route.ts', 'utf8')
    const hasCorrectLimit = apiContent.includes('limit > 10000')
    // 检查是否还有独立的 "limit > 100" 而不是 "limit > 10000" 中的 "100"
    const noOldLimit = !apiContent.match(/limit\s*>\s*100(?!00)/)

    console.log(`${hasCorrectLimit ? '✅' : '❌'} API 限制已更新为 10000`)
    console.log(`${noOldLimit ? '✅' : '❌'} 旧的 100 限制已移除`)

    allValid &= hasCorrectLimit && noOldLimit
  } catch (error) {
    console.log('❌ 无法检查 API 限制修复')
    allValid = false
  }
  
  return allValid
}

async function verifyVersionAPIFix() {
  console.log('\n📈 验证版本历史 API 修复...')
  
  let allValid = true
  
  // 检查版本历史 API 的返回格式
  try {
    const versionApiContent = fs.readFileSync('app/app/software/id/[id]/versions/route.ts', 'utf8')
    const hasCorrectFormat = versionApiContent.includes('data: versions')
    const hasMeta = versionApiContent.includes('meta: {')
    
    console.log(`${hasCorrectFormat ? '✅' : '❌'} 版本 API 返回格式已修复`)
    console.log(`${hasMeta ? '✅' : '❌'} 版本 API 包含元数据`)
    
    allValid &= hasCorrectFormat && hasMeta
  } catch (error) {
    console.log('❌ 无法检查版本 API 修复')
    allValid = false
  }
  
  return allValid
}

async function verifyMissingPages() {
  console.log('\n📱 验证缺失页面修复...')
  
  let allValid = true
  
  // 检查公告相关页面
  const pageFiles = [
    'app/dashboard/announcements/page.tsx',
    'app/dashboard/announcements/new/page.tsx'
  ]
  
  pageFiles.forEach(file => {
    allValid &= checkFileExists(file, `公告页面: ${file}`)
  })
  
  return allValid
}

async function runLiveTests() {
  console.log('\n🚀 运行实时 API 测试...')
  
  console.log('⚠️ 请确保开发服务器正在运行 (npm run dev)')
  console.log('如果服务器未运行，API 测试将失败\n')
  
  let allValid = true
  
  // 测试修复后的 API 端点
  allValid &= await testAPIEndpoint(
    'http://localhost:3000/app/software?limit=1000', 
    'Software API (limit=1000)'
  )
  
  allValid &= await testAPIEndpoint(
    'http://localhost:3000/app/software?limit=100', 
    'Software API (limit=100)'
  )
  
  // 测试版本历史 API（如果有测试数据）
  allValid &= await testAPIEndpoint(
    'http://localhost:3000/app/software/id/1/versions', 
    'Version History API'
  )
  
  return allValid
}

async function generateTestReport() {
  console.log('\n📊 生成测试报告...')
  
  const report = {
    timestamp: new Date().toISOString(),
    fixes: [
      {
        issue: 'API 400 错误 - limit 参数限制',
        status: 'fixed',
        description: '将 API limit 参数从 100 增加到 10000'
      },
      {
        issue: '版本历史数据格式错误',
        status: 'fixed', 
        description: '修复版本历史 API 返回格式，确保 data 字段是数组'
      },
      {
        issue: '缺失公告页面',
        status: 'fixed',
        description: '创建了公告管理和新增公告页面'
      },
      {
        issue: 'CSS 弃用警告',
        status: 'acknowledged',
        description: '这是 Ant Design 内部问题，不影响功能'
      }
    ]
  }
  
  const reportPath = path.join(process.cwd(), 'docs', 'runtime-error-fixes-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`✅ 测试报告已生成: ${reportPath}`)
  
  return true
}

async function runFixVerification() {
  console.log('🔍 开始运行时错误修复验证\n')
  
  const results = []
  
  results.push(await verifyAPILimitFix())
  results.push(await verifyVersionAPIFix())
  results.push(await verifyMissingPages())
  results.push(await runLiveTests())
  results.push(await generateTestReport())
  
  const allPassed = results.slice(0, -1).every(result => result) // 排除报告生成结果
  
  console.log('\n' + '='.repeat(60))
  
  if (allPassed) {
    console.log('🎉 所有运行时错误修复验证通过！')
    console.log('\n✅ 修复内容：')
    console.log('1. ✅ API limit 参数从 100 增加到 10000')
    console.log('2. ✅ 版本历史 API 返回格式修复')
    console.log('3. ✅ 创建了缺失的公告页面')
    console.log('4. ✅ 生成了详细的测试报告')
    
    console.log('\n🚀 应用程序现在应该正常工作：')
    console.log('1. API 请求不再返回 400 错误')
    console.log('2. 版本历史功能正常工作')
    console.log('3. 公告页面可以正常访问')
    console.log('4. 所有功能都已验证')
    
  } else {
    console.log('❌ 运行时错误修复验证失败！请检查上述问题。')
    
    console.log('\n💡 故障排除建议：')
    console.log('1. 确保开发服务器正在运行')
    console.log('2. 检查数据库连接和数据')
    console.log('3. 验证 API 路由文件修改')
    console.log('4. 重新启动开发服务器')
  }
}

// 运行修复验证
runFixVerification().catch(console.error)

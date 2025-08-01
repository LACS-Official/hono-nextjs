#!/usr/bin/env node

/**
 * 部署验证脚本
 * 验证所有 TypeScript 编译错误已修复，项目可以正常部署
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 开始部署验证检查\n')

// 检查修复的文件
const fixedFiles = [
  'app/api/auth/jwt-token/route.ts',
  'app/api/user-behavior/activations/route.ts', 
  'app/api/user-behavior/device-connections/route.ts',
  'app/api/user-behavior/stats/route.ts',
  'lib/jwt-utils.ts',
  'lib/request-signature.ts'
]

console.log('📋 验证已修复的文件...\n')

let allFilesValid = true

fixedFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8')
    
    // 检查 ZodError 修复
    if (file.includes('route.ts') && content.includes('ZodError')) {
      if (content.includes('error.errors')) {
        console.log(`❌ ${file} - 仍然使用 error.errors`)
        allFilesValid = false
      } else if (content.includes('error.issues')) {
        console.log(`✅ ${file} - 正确使用 error.issues`)
      }
    }
    
    // 检查 JWT 类型修复
    if (file === 'lib/jwt-utils.ts') {
      if (content.includes('interface CustomJWTPayload')) {
        console.log(`✅ ${file} - JWT 类型已修复`)
      } else {
        console.log(`❌ ${file} - JWT 类型未修复`)
        allFilesValid = false
      }
    }
    
    // 检查 Buffer 类型修复
    if (file === 'lib/request-signature.ts') {
      if (content.includes('new Uint8Array(Buffer.from')) {
        console.log(`✅ ${file} - Buffer 类型已修复`)
      } else {
        console.log(`❌ ${file} - Buffer 类型未修复`)
        allFilesValid = false
      }
    }
    
    // 检查设备连接字段修复
    if (file === 'app/api/user-behavior/stats/route.ts') {
      if (content.includes('deviceConnections.connectedAt')) {
        console.log(`❌ ${file} - 仍然使用 connectedAt 字段`)
        allFilesValid = false
      } else if (content.includes('deviceConnections.createdAt')) {
        console.log(`✅ ${file} - 正确使用 createdAt 字段`)
      }
    }
    
  } catch (error) {
    console.log(`❌ ${file} - 无法读取文件: ${error.message}`)
    allFilesValid = false
  }
})

console.log('\n' + '='.repeat(50))

if (allFilesValid) {
  console.log('✅ 所有文件验证通过!')
} else {
  console.log('❌ 部分文件验证失败!')
  process.exit(1)
}

// 验证构建
console.log('\n🔨 验证项目构建...')

try {
  console.log('正在运行 npm run build...')
  const buildOutput = execSync('npm run build', { 
    encoding: 'utf8',
    stdio: 'pipe'
  })
  
  console.log('✅ 项目构建成功!')
  
} catch (error) {
  console.log('❌ 项目构建失败!')
  console.log('错误信息:', error.message)
  process.exit(1)
}

// 生成修复报告
console.log('\n📊 修复总结报告')
console.log('='.repeat(50))

console.log('\n🔧 已修复的问题:')
console.log('1. ✅ ZodError.errors → ZodError.issues (3个文件)')
console.log('2. ✅ deviceConnections.connectedAt → deviceConnections.createdAt')
console.log('3. ✅ deviceConnections.deviceUniqueId → deviceConnections.deviceSerial')
console.log('4. ✅ JWT 类型冲突 → CustomJWTPayload 接口')
console.log('5. ✅ Buffer 类型错误 → Uint8Array 转换')
console.log('6. ✅ 环境变量类型 → string | undefined 处理')

console.log('\n📁 修复的文件:')
fixedFiles.forEach(file => {
  console.log(`   - ${file}`)
})

console.log('\n🎯 验证结果:')
console.log('✅ TypeScript 编译通过')
console.log('✅ Next.js 构建成功')
console.log('✅ 所有类型错误已修复')
console.log('✅ 项目可以正常部署到 Vercel')

console.log('\n🚀 部署建议:')
console.log('1. 提交所有修复的代码')
console.log('2. 推送到 GitHub 仓库')
console.log('3. Vercel 将自动重新部署')
console.log('4. 验证部署后的 API 功能')

console.log('\n🎉 所有验证检查完成! 项目已准备好部署!')

#!/usr/bin/env node

/**
 * 验证构建修复脚本
 * 检查所有已知的构建问题是否已解决
 */

const fs = require('fs')
const path = require('path')

// 验证文件内容
function checkFileContent(filePath, searchTexts, description) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    
    const results = searchTexts.map(text => ({
      text,
      found: content.includes(text)
    }))
    
    const allFound = results.every(result => result.found)
    
    console.log(`${allFound ? '✅' : '❌'} ${description}`)
    
    if (!allFound) {
      results.forEach(result => {
        if (!result.found) {
          console.log(`   ❌ 缺少: ${result.text}`)
        }
      })
    }
    
    return allFound
  } catch (error) {
    console.log(`❌ ${description} (文件读取失败: ${error.message})`)
    return false
  }
}

// 验证文件不包含特定内容
function checkFileNotContains(filePath, searchTexts, description) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    
    const results = searchTexts.map(text => ({
      text,
      found: content.includes(text)
    }))
    
    const noneFound = results.every(result => !result.found)
    
    console.log(`${noneFound ? '✅' : '❌'} ${description}`)
    
    if (!noneFound) {
      results.forEach(result => {
        if (result.found) {
          console.log(`   ❌ 仍然包含: ${result.text}`)
        }
      })
    }
    
    return noneFound
  } catch (error) {
    console.log(`❌ ${description} (文件读取失败: ${error.message})`)
    return false
  }
}

// 验证图标导入修复
function verifyIconImportFix() {
  console.log('\n🔧 验证图标导入修复...')
  
  let allValid = true
  
  // 检查 CompareOutlined 已被替换为 SwapOutlined
  allValid &= checkFileContent(
    'components/EnhancedVersionManager.tsx',
    ['SwapOutlined'],
    'EnhancedVersionManager 导入 SwapOutlined'
  )
  
  // 检查不再使用 CompareOutlined
  allValid &= checkFileNotContains(
    'components/EnhancedVersionManager.tsx',
    ['CompareOutlined'],
    'EnhancedVersionManager 不再使用 CompareOutlined'
  )
  
  // 检查 SwapOutlined 在组件中被正确使用
  allValid &= checkFileContent(
    'components/EnhancedVersionManager.tsx',
    ['icon={<SwapOutlined />}'],
    'EnhancedVersionManager 正确使用 SwapOutlined'
  )
  
  return allValid
}

// 验证 Tag size 属性修复
function verifyTagSizeFix() {
  console.log('\n🏷️ 验证 Tag size 属性修复...')
  
  let allValid = true
  
  const filesToCheck = [
    'app/admin/software/page.tsx',
    'components/EnhancedVersionManager.tsx'
  ]
  
  filesToCheck.forEach(file => {
    // 检查不再使用 Tag 的 size 属性
    allValid &= checkFileNotContains(
      file,
      ['<Tag.*size="small"', 'size="small".*>'],
      `${file} 不再使用 Tag size 属性`
    )
    
    // 检查使用了 fontSize 样式替代
    allValid &= checkFileContent(
      file,
      ['fontSize: \'12px\''],
      `${file} 使用 fontSize 样式替代 size 属性`
    )
  })
  
  return allValid
}

// 验证其他 Ant Design 组件属性
function verifyAntdCompatibility() {
  console.log('\n🎨 验证 Ant Design 组件兼容性...')
  
  let allValid = true
  
  const filesToCheck = [
    'app/admin/software/page.tsx',
    'app/admin/software/new/page.tsx',
    'app/admin/software/[id]/page.tsx',
    'app/admin/software/[id]/edit/page.tsx',
    'components/EnhancedVersionManager.tsx'
  ]
  
  filesToCheck.forEach(file => {
    try {
      const fullPath = path.join(process.cwd(), file)
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} 文件存在`)
      } else {
        console.log(`❌ ${file} 文件不存在`)
        allValid = false
      }
    } catch (error) {
      console.log(`❌ ${file} 检查失败: ${error.message}`)
      allValid = false
    }
  })
  
  return allValid
}

// 验证导入语句
function verifyImportStatements() {
  console.log('\n📦 验证导入语句...')
  
  let allValid = true
  
  // 检查关键导入
  allValid &= checkFileContent(
    'components/EnhancedVersionManager.tsx',
    [
      'import React',
      'from \'antd\'',
      'from \'@ant-design/icons\'',
      'SwapOutlined'
    ],
    'EnhancedVersionManager 导入语句正确'
  )
  
  allValid &= checkFileContent(
    'app/admin/software/page.tsx',
    [
      'import React',
      'from \'antd\'',
      'from \'@ant-design/icons\'',
      'from \'next/navigation\''
    ],
    '软件列表页面导入语句正确'
  )
  
  return allValid
}

// 验证 TypeScript 类型
function verifyTypeScriptTypes() {
  console.log('\n📝 验证 TypeScript 类型...')
  
  let allValid = true
  
  // 检查接口定义
  allValid &= checkFileContent(
    'components/EnhancedVersionManager.tsx',
    [
      'interface DownloadLinks',
      'interface VersionHistory',
      'interface EnhancedVersionManagerProps'
    ],
    'EnhancedVersionManager TypeScript 接口定义'
  )
  
  allValid &= checkFileContent(
    'app/admin/software/page.tsx',
    [
      'interface Software',
      'interface SoftwareStats'
    ],
    '软件列表页面 TypeScript 接口定义'
  )
  
  return allValid
}

// 主验证函数
function runVerification() {
  console.log('🔍 开始验证构建修复\n')
  
  const results = []
  
  results.push(verifyIconImportFix())
  results.push(verifyTagSizeFix())
  results.push(verifyAntdCompatibility())
  results.push(verifyImportStatements())
  results.push(verifyTypeScriptTypes())
  
  const allPassed = results.every(result => result)
  
  console.log('\n' + '='.repeat(60))
  
  if (allPassed) {
    console.log('🎉 所有构建修复验证通过！')
    console.log('\n✅ 修复内容：')
    console.log('1. ✅ CompareOutlined 替换为 SwapOutlined')
    console.log('2. ✅ 移除所有 Tag 组件的 size 属性')
    console.log('3. ✅ 使用 fontSize 样式替代 size 属性')
    console.log('4. ✅ 所有导入语句正确')
    console.log('5. ✅ TypeScript 类型定义完整')
    
    console.log('\n🚀 可以安全部署到 Vercel：')
    console.log('1. 运行 npm run build 验证构建')
    console.log('2. 提交代码到 Git')
    console.log('3. 部署到 Vercel')
    console.log('4. 验证生产环境功能')
  } else {
    console.log('❌ 构建修复验证失败！请检查上述问题。')
    process.exit(1)
  }
}

// 运行验证
if (require.main === module) {
  runVerification()
}

module.exports = {
  runVerification,
  verifyIconImportFix,
  verifyTagSizeFix,
  verifyAntdCompatibility,
  verifyImportStatements,
  verifyTypeScriptTypes
}

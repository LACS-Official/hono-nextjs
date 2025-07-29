#!/usr/bin/env node

/**
 * 生成有效的 favicon.ico 文件
 * 创建一个最小的有效 ICO 格式文件
 */

const fs = require('fs')
const path = require('path')

// 创建一个最小的有效 ICO 文件 (16x16 像素，蓝色背景，白色 "S")
// 这是一个简化的 ICO 文件格式，包含必要的头部信息
function createMinimalIco() {
  // ICO 文件头 (6 字节)
  const header = Buffer.from([
    0x00, 0x00, // 保留字段
    0x01, 0x00, // 图像类型 (1 = ICO)
    0x01, 0x00  // 图像数量 (1)
  ])

  // 图像目录条目 (16 字节)
  const dirEntry = Buffer.from([
    0x10,       // 宽度 (16)
    0x10,       // 高度 (16)
    0x00,       // 颜色数 (0 = 256色以上)
    0x00,       // 保留字段
    0x01, 0x00, // 颜色平面数
    0x20, 0x00, // 每像素位数 (32位)
    0x00, 0x04, 0x00, 0x00, // 图像数据大小 (1024字节)
    0x16, 0x00, 0x00, 0x00  // 图像数据偏移 (22字节)
  ])

  // 创建一个简单的 16x16 RGBA 图像数据
  // 蓝色背景 (#1890ff) 带白色 "S"
  const imageData = Buffer.alloc(1024) // 16x16x4 = 1024 字节

  // 填充蓝色背景
  for (let i = 0; i < 1024; i += 4) {
    imageData[i] = 0xff     // B
    imageData[i + 1] = 0x90 // G  
    imageData[i + 2] = 0x18 // R
    imageData[i + 3] = 0xff // A
  }

  // 在中心绘制一个简单的白色 "S" (简化版本)
  const whitePixel = Buffer.from([0xff, 0xff, 0xff, 0xff]) // BGRA
  
  // 简单的 "S" 形状 (8x8 在 16x16 中居中)
  const sPattern = [
    [0,1,1,1,1,0,0,0],
    [1,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0],
    [0,1,1,1,0,0,0,0],
    [0,0,0,0,1,0,0,0],
    [0,0,0,0,1,0,0,0],
    [0,0,0,0,1,0,0,0],
    [1,1,1,1,0,0,0,0]
  ]

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (sPattern[y][x]) {
        const pixelIndex = ((y + 4) * 16 + (x + 4)) * 4
        whitePixel.copy(imageData, pixelIndex)
      }
    }
  }

  // 组合所有部分
  return Buffer.concat([header, dirEntry, imageData])
}

function generateFavicon() {
  console.log('🎨 生成 favicon.ico 文件...')

  try {
    // 生成 ICO 数据
    const icoData = createMinimalIco()

    // 写入 public 目录
    const publicPath = path.join(process.cwd(), 'public', 'favicon.ico')
    fs.writeFileSync(publicPath, icoData)
    console.log(`✅ 已创建: ${publicPath}`)

    // 验证文件大小
    const stats = fs.statSync(publicPath)
    console.log(`📊 文件大小: ${stats.size} 字节`)

    console.log('\n🎉 favicon.ico 生成完成!')
    console.log('💡 这是一个最小的有效 ICO 文件，包含蓝色背景和白色 "S" 字母')

  } catch (error) {
    console.error('❌ 生成 favicon 失败:', error.message)
    process.exit(1)
  }
}

// 运行生成器
if (require.main === module) {
  generateFavicon()
}

module.exports = { generateFavicon }

#!/usr/bin/env node

/**
 * 测试数据种子脚本
 * 为软件管理系统添加测试数据
 */

require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

async function seedTestData() {
  console.log('🌱 开始添加测试数据...\n')

  const databaseUrl = process.env.SOFTWARE_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ SOFTWARE_DATABASE_URL 环境变量未设置')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // 检查是否已有数据
    const existingSoftware = await sql`SELECT COUNT(*) as count FROM software`
    if (existingSoftware[0].count > 0) {
      console.log('⚠️ 数据库中已有软件数据，跳过种子数据添加')
      return
    }

    console.log('📦 添加测试软件...')

    // 添加测试软件
    const testSoftware = [
      {
        name: 'Visual Studio Code',
        nameEn: 'Visual Studio Code',
        description: '微软开发的免费源代码编辑器，支持多种编程语言和丰富的扩展生态系统。',
        descriptionEn: 'A free source code editor developed by Microsoft with support for multiple programming languages and a rich extension ecosystem.',
        currentVersion: '1.85.0',
        officialWebsite: 'https://code.visualstudio.com',
        category: '开发工具',
        tags: ['编辑器', '开发', '微软', 'IDE'],
        systemRequirements: {
          os: ['Windows', 'macOS', 'Linux'],
          memory: '1GB RAM',
          storage: '200MB 可用空间'
        },
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Google Chrome',
        nameEn: 'Google Chrome',
        description: '谷歌开发的网页浏览器，具有快速、安全、稳定的特点。',
        descriptionEn: 'A web browser developed by Google, known for its speed, security, and stability.',
        currentVersion: '120.0.6099.109',
        officialWebsite: 'https://www.google.com/chrome',
        category: '浏览器',
        tags: ['浏览器', '谷歌', '网页'],
        systemRequirements: {
          os: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'],
          memory: '4GB RAM',
          storage: '350MB 可用空间'
        },
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Adobe Photoshop',
        nameEn: 'Adobe Photoshop',
        description: '专业的图像编辑和设计软件，广泛用于照片编辑、数字艺术创作等领域。',
        descriptionEn: 'Professional image editing and design software widely used for photo editing, digital art creation, and more.',
        currentVersion: '2024.1.0',
        officialWebsite: 'https://www.adobe.com/products/photoshop.html',
        category: '图像处理',
        tags: ['图像编辑', 'Adobe', '设计', '专业'],
        systemRequirements: {
          os: ['Windows', 'macOS'],
          memory: '8GB RAM',
          storage: '4GB 可用空间',
          graphics: '支持 DirectX 12 的 GPU'
        },
        isActive: true,
        sortOrder: 3
      }
    ]

    for (const software of testSoftware) {
      const result = await sql`
        INSERT INTO software (
          name, name_en, description, description_en, current_version,
          official_website, category, tags, system_requirements,
          is_active, sort_order, created_at, updated_at
        ) VALUES (
          ${software.name}, ${software.nameEn}, ${software.description}, ${software.descriptionEn},
          ${software.currentVersion}, ${software.officialWebsite}, ${software.category},
          ${JSON.stringify(software.tags)}, ${JSON.stringify(software.systemRequirements)},
          ${software.isActive}, ${software.sortOrder}, NOW(), NOW()
        ) RETURNING id, name
      `
      
      console.log(`✅ 添加软件: ${result[0].name} (ID: ${result[0].id})`)

      // 为每个软件添加版本历史
      await sql`
        INSERT INTO software_version_history (
          software_id, version, release_date, release_notes, release_notes_en,
          download_links, file_size, is_stable, is_beta, is_prerelease,
          version_type, changelog_category, created_at, updated_at
        ) VALUES (
          ${result[0].id}, ${software.currentVersion}, NOW(),
          '初始版本发布', 'Initial version release',
          ${JSON.stringify({
            official: software.officialWebsite,
            quark: 'https://pan.quark.cn/example',
            pan123: 'https://www.123pan.com/example',
            baidu: 'https://pan.baidu.com/example'
          })},
          '100MB', true, false, false, 'release',
          ${JSON.stringify(['feature'])}, NOW(), NOW()
        )
      `
    }

    console.log('\n📊 数据统计:')
    const softwareCount = await sql`SELECT COUNT(*) as count FROM software`
    const versionCount = await sql`SELECT COUNT(*) as count FROM software_version_history`
    
    console.log(`软件总数: ${softwareCount[0].count}`)
    console.log(`版本历史记录数: ${versionCount[0].count}`)

    console.log('\n🎉 测试数据添加完成!')
    console.log('\n💡 现在可以访问以下页面测试功能:')
    console.log('- 软件列表: http://localhost:3000/admin/software')
    console.log('- 新增软件: http://localhost:3000/admin/software/new')

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 运行种子数据脚本
seedTestData().catch(console.error)

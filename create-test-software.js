/**
 * 创建测试软件数据
 */

const API_BASE_URL = 'http://localhost:3000/app';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your-api-key';

async function createTestSoftware() {
  console.log('🚀 创建测试软件数据...\n');

  try {
    // 创建测试软件
    const testSoftware = {
      name: '测试软件',
      nameEn: 'Test Software',
      description: '这是一个用于测试软件公告管理功能的测试软件',
      descriptionEn: 'This is a test software for testing software announcement management functionality',
      currentVersion: '1.0.0',
      category: 'tools',
      tags: ['test', 'utility'],
      officialWebsite: 'https://example.com',
      openname: 'test.exe',
      filetype: 'zip'
    };

    console.log('创建测试软件...');
    const response = await fetch(`${API_BASE_URL}/software`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(testSoftware)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ 成功创建测试软件: ${data.data.name} (ID: ${data.data.id})`);
      console.log('现在可以运行软件公告管理功能测试了！');
    } else {
      console.error('❌ 创建软件失败:', data.error);
    }

  } catch (error) {
    console.error('❌ 创建过程中发生错误:', error);
  }
}

// 运行创建
createTestSoftware();

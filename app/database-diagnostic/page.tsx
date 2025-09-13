'use client'

import { useState } from 'react'
import { Button, Card, Table, message, Input } from 'antd'

const DatabaseDiagnostic = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [versionId, setVersionId] = useState('26')

  // 获取软件ID为1的所有版本
  const getAllVersionsForSoftware1 = async () => {
    setLoading(true)
    try {
      const response = await fetch('/app/software/id/1/versions', {
        method: 'GET',
        headers: {
          'X-API-Key': '61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398'
        }
      })

      const data = await response.json()
      setResult({
        type: 'versions_list',
        status: response.status,
        data: data
      })

      if (data.success) {
        message.success(`获取版本列表成功，共${data.data?.length || 0}个版本`)
      } else {
        message.error(`获取失败: ${data.error}`)
      }
    } catch (error: any) {
      console.error('获取版本列表失败:', error)
      setResult({
        type: 'versions_list',
        error: error.message
      })
      message.error(`请求失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 测试特定版本ID的存在性
  const testSpecificVersion = async () => {
    if (!versionId) {
      message.error('请输入版本ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/app/software/id/1/versions/${versionId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': '61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398'
        }
      })

      const data = await response.json()
      setResult({
        type: 'specific_version',
        versionId: versionId,
        status: response.status,
        data: data
      })

      if (data.success) {
        message.success(`版本ID ${versionId} 存在`)
      } else {
        message.error(`版本ID ${versionId} 不存在: ${data.error}`)
      }
    } catch (error: any) {
      console.error(`测试版本ID ${versionId} 失败:`, error)
      setResult({
        type: 'specific_version',
        versionId: versionId,
        error: error.message
      })
      message.error(`请求失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 创建一个新版本用于测试
  const createTestVersion = async () => {
    setLoading(true)
    try {
      const testVersion = {
        version: `test-version-${Date.now()}`,
        releaseDate: new Date().toISOString(),
        releaseNotes: '数据库诊断测试版本',
        releaseNotesEn: 'Database diagnostic test version',
        downloadLinks: {
          official: 'https://example.com/test-download'
        },
        fileSize: '5MB',
        fileSizeBytes: 5242880,
        isStable: false,
        isBeta: true,
        isPrerelease: false,
        versionType: 'beta',
        changelogCategory: ['test'],
        metadata: { purpose: 'diagnostic' }
      }

      const response = await fetch('/app/software/id/1/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398'
        },
        body: JSON.stringify(testVersion)
      })

      const data = await response.json()
      setResult({
        type: 'create_test_version',
        status: response.status,
        data: data,
        requestBody: testVersion
      })

      if (data.success) {
        message.success(`测试版本创建成功，ID: ${data.data?.id}`)
        setVersionId(data.data?.id?.toString() || '')
      } else {
        message.error(`创建失败: ${data.error}`)
      }
    } catch (error: any) {
      console.error('创建测试版本失败:', error)
      setResult({
        type: 'create_test_version',
        error: error.message
      })
      message.error(`创建失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 渲染版本列表表格
  const renderVersionsTable = () => {
    if (result?.type !== 'versions_list' || !result.data?.success) return null

    const columns = [
      { title: 'ID', dataIndex: 'id', key: 'id' },
      { title: '版本号', dataIndex: 'version', key: 'version' },
      { title: '发布日期', dataIndex: 'releaseDate', key: 'releaseDate' },
      { title: '更新说明', dataIndex: 'releaseNotes', key: 'releaseNotes' },
      { title: '稳定版', dataIndex: 'isStable', key: 'isStable', render: (val: boolean) => val ? '是' : '否' },
    ]

    return (
      <Table
        dataSource={result.data.data}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
      />
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>数据库诊断工具</h1>
      
      <Card title="诊断操作" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button type="primary" onClick={getAllVersionsForSoftware1} loading={loading}>
            获取所有版本
          </Button>
          <Button onClick={createTestVersion} loading={loading}>
            创建测试版本
          </Button>
          <Input
            style={{ width: '120px' }}
            placeholder="版本ID"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          />
          <Button onClick={testSpecificVersion} loading={loading}>
            测试版本存在性
          </Button>
        </div>
      </Card>

      {result?.type === 'versions_list' && (
        <Card title="版本列表" style={{ marginBottom: '20px' }}>
          {renderVersionsTable()}
        </Card>
      )}

      {result && (
        <Card title="诊断结果">
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}

export default DatabaseDiagnostic
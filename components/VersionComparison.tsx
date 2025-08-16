'use client'

import React, { useState } from 'react'
import {
  Modal,
  Tag,
  Button,
  Space,
  Divider,
  Typography,
  Card,
  Row,
  Col,
  Timeline,
  Collapse
} from 'antd'
import {
  SwapOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { Panel } = Collapse

interface VersionHistory {
  id: number
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: {
    official?: string
    quark?: string
    pan123?: string
    baidu?: string
    thunder?: string
    backup?: string[]
  }
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: 'release' | 'beta' | 'alpha' | 'rc'
  changelogCategory?: string[]
  createdAt: string
  updatedAt: string
}

interface VersionComparisonProps {
  visible: boolean
  onClose: () => void
  versions: VersionHistory[]
  selectedVersions: VersionHistory[]
}

export default function VersionComparison({ 
  visible, 
  onClose, 
  versions, 
  selectedVersions 
}: VersionComparisonProps) {
  
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'timeline'>('side-by-side')

  // 版本比较数据
  const getComparisonData = () => {
    if (selectedVersions.length !== 2) return null

    const [version1, version2] = selectedVersions.sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    )

    return {
      newer: version1,
      older: version2,
      timeDiff: Math.abs(
        new Date(version1.releaseDate).getTime() - new Date(version2.releaseDate).getTime()
      ) / (1000 * 60 * 60 * 24), // 天数差
      sizeDiff: version1.fileSizeBytes && version2.fileSizeBytes 
        ? version1.fileSizeBytes - version2.fileSizeBytes 
        : null
    }
  }

  const comparisonData = getComparisonData()

  // 渲染下载链接
  const renderDownloadLinks = (links?: any) => {
    if (!links) return '-'
    
    const linkTypes = [
      { key: 'official', label: '官方', color: 'blue' },
      { key: 'quark', label: '夸克', color: 'purple' },
      { key: 'pan123', label: '123', color: 'green' },
      { key: 'baidu', label: '百度', color: 'red' },
      { key: 'thunder', label: '迅雷', color: 'orange' },
      { key: 'thunderPan', label: '迅雷网盘', color: 'gold' }
    ]

    return (
      <Space direction="vertical" size="small">
        {linkTypes.map(type => 
          links[type.key] ? (
            <Button 
              key={type.key}
              size="small" 
              type="link"
              icon={<DownloadOutlined />}
              href={links[type.key]}
              target="_blank"
            >
              {type.label}
            </Button>
          ) : null
        )}
      </Space>
    )
  }

  // 渲染更新类型标签
  const renderChangelogTags = (categories?: string[]) => {
    if (!categories || categories.length === 0) return '-'
    
    const tagColors = {
      feature: 'blue',
      bugfix: 'orange', 
      security: 'red',
      performance: 'green'
    }

    const tagLabels = {
      feature: '新功能',
      bugfix: '错误修复',
      security: '安全更新',
      performance: '性能优化'
    }

    return (
      <Space wrap>
        {categories.map(cat => (
          <Tag 
            key={cat} 
            color={tagColors[cat as keyof typeof tagColors]}
          >
            {tagLabels[cat as keyof typeof tagLabels] || cat}
          </Tag>
        ))}
      </Space>
    )
  }

  // 并排比较视图
  const renderSideBySideComparison = () => {
    if (!comparisonData) return null

    const { newer, older, timeDiff, sizeDiff } = comparisonData

    return (
      <div>
        <Row gutter={16}>
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <Tag color="green">较新版本</Tag>
                  <Text strong>{newer.version}</Text>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">发布日期：</Text>
                  <Text>{new Date(newer.releaseDate).toLocaleDateString()}</Text>
                </div>
                <div>
                  <Text type="secondary">版本类型：</Text>
                  <Tag color={newer.versionType === 'release' ? 'green' : 'orange'}>
                    {newer.versionType}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">文件大小：</Text>
                  <Text>{newer.fileSize || '-'}</Text>
                </div>
                <div>
                  <Text type="secondary">更新类型：</Text>
                  {renderChangelogTags(newer.changelogCategory)}
                </div>
                <div>
                  <Text type="secondary">下载链接：</Text>
                  {renderDownloadLinks(newer.downloadLinks)}
                </div>
                {newer.releaseNotes && (
                  <div>
                    <Text type="secondary">更新日志：</Text>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      <Text>{newer.releaseNotes}</Text>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <Tag color="orange">较旧版本</Tag>
                  <Text strong>{older.version}</Text>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">发布日期：</Text>
                  <Text>{new Date(older.releaseDate).toLocaleDateString()}</Text>
                </div>
                <div>
                  <Text type="secondary">版本类型：</Text>
                  <Tag color={older.versionType === 'release' ? 'green' : 'orange'}>
                    {older.versionType}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">文件大小：</Text>
                  <Text>{older.fileSize || '-'}</Text>
                </div>
                <div>
                  <Text type="secondary">更新类型：</Text>
                  {renderChangelogTags(older.changelogCategory)}
                </div>
                <div>
                  <Text type="secondary">下载链接：</Text>
                  {renderDownloadLinks(older.downloadLinks)}
                </div>
                {older.releaseNotes && (
                  <div>
                    <Text type="secondary">更新日志：</Text>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      <Text>{older.releaseNotes}</Text>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider>比较摘要</Divider>
        
        <Card size="small">
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>{Math.round(timeDiff)}</Text>
                  <div><Text type="secondary">天间隔</Text></div>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                {sizeDiff !== null ? (
                  <>
                    {sizeDiff > 0 ? (
                      <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                    ) : (
                      <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    )}
                    <div style={{ marginTop: '8px' }}>
                      <Text strong>
                        {sizeDiff > 0 ? '+' : ''}{(sizeDiff / 1024 / 1024).toFixed(1)} MB
                      </Text>
                      <div><Text type="secondary">大小变化</Text></div>
                    </div>
                  </>
                ) : (
                  <>
                    <InfoCircleOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary">无大小信息</Text>
                    </div>
                  </>
                )}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <SwapOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>
                    {newer.changelogCategory?.length || 0}
                  </Text>
                  <div><Text type="secondary">更新类型</Text></div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    )
  }

  // 时间线比较视图
  const renderTimelineComparison = () => {
    const sortedVersions = [...selectedVersions].sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    )

    return (
      <Timeline mode="left">
        {sortedVersions.map((version, index) => (
          <Timeline.Item
            key={version.id}
            color={index === 0 ? 'green' : 'blue'}
            label={new Date(version.releaseDate).toLocaleDateString()}
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Tag color={version.versionType === 'release' ? 'green' : 'orange'}>
                    {version.version}
                  </Tag>
                  {index === 0 && <Tag color="green">最新</Tag>}
                </div>
                <div>{renderChangelogTags(version.changelogCategory)}</div>
                {version.releaseNotes && (
                  <Collapse size="small">
                    <Panel header="更新日志" key="1">
                      <Text>{version.releaseNotes}</Text>
                    </Panel>
                  </Collapse>
                )}
              </Space>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    )
  }

  return (
    <Modal
      title="版本比较"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {selectedVersions.length !== 2 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">请选择两个版本进行比较</Text>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button 
                type={compareMode === 'side-by-side' ? 'primary' : 'default'}
                onClick={() => setCompareMode('side-by-side')}
              >
                并排比较
              </Button>
              <Button 
                type={compareMode === 'timeline' ? 'primary' : 'default'}
                onClick={() => setCompareMode('timeline')}
              >
                时间线视图
              </Button>
            </Space>
          </div>
          
          {compareMode === 'side-by-side' 
            ? renderSideBySideComparison() 
            : renderTimelineComparison()
          }
        </div>
      )}
    </Modal>
  )
}

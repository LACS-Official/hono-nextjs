'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Input,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Modal,
  Alert,
  Tooltip,
  Table,
  Select,
  Pagination,
  Statistic,
  message
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClearOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Breakpoint } from 'antd'
import { ErrorBoundary, EmptyState, NetworkError } from '@/components/ErrorBoundary'
import { PageLoading, StatisticLoading } from '@/components/LoadingState'
import {
  activationCodeApi,
  type ActivationCode,
  type ActivationCodeStats,
  type ActivationCodeStatus,
  getActivationCodeStatusText,
  getActivationCodeStatusColor,
  formatDate,
  getDaysUntilExpiration,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

// const { Content } = Layout // 暂时不使用
const { Title, Paragraph, Text } = Typography
const { Search } = Input
const { Option } = Select
const { confirm } = Modal

export default function ActivationCodesPage() {
  const router = useRouter()

  // 状态管理
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [stats, setStats] = useState<ActivationCodeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ActivationCodeStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 加载激活码列表
  const loadActivationCodes = async (page = currentPage, limit = pageSize, status = statusFilter) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await activationCodeApi.getActivationCodes(page, limit, status)
      setCodes(response.codes)
      setTotal(response.pagination.total)
      setCurrentPage(response.pagination.page)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      message.error(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    setStatsLoading(true)
    
    try {
      const statsData = await activationCodeApi.getActivationCodeStats()
      setStats(statsData)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      console.error('加载统计信息失败:', apiError.message)
    } finally {
      setStatsLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadActivationCodes()
    loadStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 状态筛选变化
  useEffect(() => {
    setCurrentPage(1)
    loadActivationCodes(1, pageSize, statusFilter)
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    // 这里可以实现前端搜索或者调用后端搜索API
    // 目前先实现前端搜索
  }

  // 过滤激活码
  const filteredCodes = codes.filter(code => {
    if (!searchTerm) return true
    return (
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.productInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.metadata?.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // 查看详情
  const handleViewDetail = (code: ActivationCode) => {
    router.push(`/admin/activation-codes/${code.id}`)
  }

  // 删除激活码
  const handleDelete = (code: ActivationCode) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您确定要删除激活码 <Text code>{code.code}</Text> 吗？</p>
          <Alert
            message="此操作无法撤销"
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await activationCodeApi.deleteActivationCode(code.id)
          message.success('激活码删除成功')
          loadActivationCodes()
          loadStats()
        } catch (error) {
          const apiError = error as ActivationCodeApiError
          message.error(apiError.message)
        }
      },
    })
  }

  // 清理过期激活码
  const handleCleanupExpired = () => {
    confirm({
      title: '清理过期激活码',
      icon: <ClearOutlined />,
      content: '确定要清理所有已过期的激活码吗？此操作无法撤销。',
      okText: '清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await activationCodeApi.cleanupExpiredCodes()
          message.success(result.message)
          loadActivationCodes()
          loadStats()
        } catch (error) {
          const apiError = error as ActivationCodeApiError
          message.error(apiError.message)
        }
      },
    })
  }

  // 表格列定义
  const columns: ColumnsType<ActivationCode> = [
    {
      title: '激活码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => (
        <Text
          code
          copyable
          className="activation-code-text"
          title={code}
        >
          {code}
        </Text>
      ),
      responsive: ['md'] as Breakpoint[],
    },
    {
      title: '激活码信息',
      key: 'codeInfo',
      render: (_, record) => (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ marginBottom: '8px' }}>
            <Text
              code
              copyable
              className="activation-code-text"
              title={record.code}
            >
              {record.code}
            </Text>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <Tag color={getActivationCodeStatusColor(record)}>
              {getActivationCodeStatusText(record)}
            </Tag>
          </div>
          {record.productInfo && (
            <div style={{ marginBottom: '6px' }}>
              <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                {record.productInfo.name} v{record.productInfo.version}
              </Text>
            </div>
          )}
          {record.metadata?.customerEmail && (
            <div>
              <Text
                type="secondary"
                className="customer-email-text"
                title={`客户: ${record.metadata.customerEmail}`}
              >
                客户: {record.metadata.customerEmail}
              </Text>
            </div>
          )}
        </div>
      ),
      responsive: ['xs', 'sm'] as Breakpoint[],
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={getActivationCodeStatusColor(record)}>
          {getActivationCodeStatusText(record)}
        </Tag>
      ),
      responsive: ['md'] as Breakpoint[],
    },
    {
      title: '产品信息',
      key: 'product',
      width: 150,
      render: (_, record) => (
        <div style={{ maxWidth: '140px' }}>
          {record.productInfo ? (
            <>
              <div
                style={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={record.productInfo.name}
              >
                {record.productInfo.name}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                v{record.productInfo.version}
              </Text>
            </>
          ) : (
            <Text type="secondary">未设置</Text>
          )}
        </div>
      ),
      responsive: ['lg'] as Breakpoint[],
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 180,
      render: (_, record) => (
        <div style={{ maxWidth: '170px' }}>
          {record.metadata?.customerEmail ? (
            <div>
              <Text
                className="customer-email-text"
                title={record.metadata.customerEmail}
              >
                {record.metadata.customerEmail}
              </Text>
              {record.metadata?.licenseType && (
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                  {record.metadata.licenseType}
                </Text>
              )}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>未设置</Text>
          )}
        </div>
      ),
      responsive: ['xl'] as Breakpoint[],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDate(date),
      responsive: ['lg'] as Breakpoint[],
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 150,
      render: (date: string, record) => {
        const days = getDaysUntilExpiration(date)
        return (
          <div>
            <div>{formatDate(date)}</div>
            {!record.isUsed && (
              <Text type={days > 7 ? 'secondary' : 'warning'} style={{ fontSize: '12px' }}>
                {days > 0 ? `${days}天后过期` : '已过期'}
              </Text>
            )}
          </div>
        )
      },
      responsive: ['md'] as Breakpoint[],
    },
    {
      title: '时间信息',
      key: 'timeInfo',
      render: (_, record) => {
        const days = getDaysUntilExpiration(record.expiresAt)
        return (
          <div style={{ maxWidth: '120px' }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              创建: {formatDate(record.createdAt)}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              过期: {formatDate(record.expiresAt)}
            </div>
            {!record.isUsed && (
              <Text
                type={days > 7 ? 'secondary' : 'warning'}
                style={{
                  fontSize: '10px',
                  display: 'block',
                  marginTop: '2px'
                }}
              >
                {days > 0 ? `${days}天后过期` : '已过期'}
              </Text>
            )}
          </div>
        )
      },
      responsive: ['xs', 'sm'] as Breakpoint[],
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <ErrorBoundary>
      <div className="responsive-container"
        style={{
          minHeight: 'calc(100vh - 64px)',
          paddingTop: '0',
          paddingBottom: '24px'
        }}
      >
            {/* 加载状态 */}
            {loading && <PageLoading tip="正在加载激活码数据..." />}

            {/* 错误状态 */}
            {error && !loading && (
              <NetworkError
                message={error}
                onRetry={() => {
                  loadActivationCodes()
                  loadStats()
                }}
              />
            )}

            {/* 主要内容 */}
            {!loading && !error && (
              <>
                {/* 页面头部 */}
                <div className="responsive-card-spacing">
                  <Title level={2} className="responsive-title">
                    激活码管理
                  </Title>
                  <Paragraph style={{ color: '#666', margin: 0 }}>
                    管理系统激活码，包括生成、查看、删除和统计功能
                  </Paragraph>
                </div>

                {/* 统计卡片 */}
                {statsLoading ? (
                  <Row gutter={[16, 16]} className="responsive-card-spacing">
                    <Col xs={24} sm={12} md={6}><StatisticLoading /></Col>
                    <Col xs={24} sm={12} md={6}><StatisticLoading /></Col>
                    <Col xs={24} sm={12} md={6}><StatisticLoading /></Col>
                    <Col xs={24} sm={12} md={6}><StatisticLoading /></Col>
                  </Row>
                ) : stats ? (
                  <Row gutter={[16, 16]} className="responsive-card-spacing">
                    <Col xs={24} sm={12} md={6}>
                      <Card className="responsive-statistic-card">
                        <Statistic
                          title="总激活码"
                          value={stats.total}
                          prefix={<KeyOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card className="responsive-statistic-card">
                        <Statistic
                          title="已使用"
                          value={stats.used}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card className="responsive-statistic-card">
                        <Statistic
                          title="有效激活码"
                          value={stats.active}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card className="responsive-statistic-card">
                        <Statistic
                          title="已过期"
                          value={stats.expired}
                          prefix={<ExclamationCircleOutlined />}
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card className="responsive-statistic-card">
                        <Statistic
                          title="使用率"
                          value={stats.usageRate}
                          suffix="%"
                          precision={1}
                          valueStyle={{ color: stats.usageRate > 50 ? '#52c41a' : '#faad14' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                ) : null}

          {/* 操作栏 */}
          <Card className="responsive-card-spacing">
            <div className="responsive-search-container">
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Search
                  placeholder="搜索激活码、产品名称或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: '100%', marginBottom: '12px' }}
                  allowClear
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%', maxWidth: '200px' }}
                  placeholder="选择状态筛选"
                >
                  <Option value="all">全部状态</Option>
                  <Option value="active">有效</Option>
                  <Option value="used">已使用</Option>
                  <Option value="expired">已过期</Option>
                  <Option value="unused">未使用</Option>
                </Select>
              </div>
              <div className="responsive-button-group">
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => router.push('/admin/activation-codes/stats')}
                >
                  统计
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    loadActivationCodes()
                    loadStats()
                  }}
                >
                  刷新
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleCleanupExpired}
                >
                  清理
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => router.push('/admin/activation-codes/new')}
                >
                  新增
                </Button>
              </div>
            </div>
          </Card>

                {/* 激活码表格 */}
                <Card>
                  {filteredCodes.length === 0 && !loading ? (
                    <EmptyState
                      title="暂无激活码"
                      description="当前没有符合条件的激活码，您可以创建新的激活码"
                      action={
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => router.push('/admin/activation-codes/new')}
                        >
                          创建激活码
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div className="responsive-table-container activation-codes-table">
                        <Table
                          columns={columns}
                          dataSource={filteredCodes}
                          rowKey="id"
                          loading={loading}
                          pagination={false}
                          scroll={{ x: 1200 }}
                          size="middle"
                        />
                      </div>

                      {/* 分页 */}
                      <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={total}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                          onChange={(page, size) => {
                            setCurrentPage(page)
                            setPageSize(size || 10)
                            loadActivationCodes(page, size || 10, statusFilter)
                          }}
                          onShowSizeChange={(_, size) => {
                            setPageSize(size)
                            setCurrentPage(1)
                            loadActivationCodes(1, size, statusFilter)
                          }}
                          responsive
                        />
                      </div>
                    </>
                  )}
                </Card>
              </>
            )}
      </div>
    </ErrorBoundary>
  )
}

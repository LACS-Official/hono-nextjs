'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  Switch, 
  message,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Upload,
  Tag
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  UploadOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
// 暂时使用 TextArea 替代 Markdown 编辑器

const { Content } = Layout
const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

// Hugo 文章接口
interface HugoArticle {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  categories: string[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  featured: boolean
  viewCount: number
  metadata: {
    seo_title?: string
    seo_description?: string
    featured_image?: string
  }
}

export default function EditHugoArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<HugoArticle | null>(null)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [inputTag, setInputTag] = useState('')
  const [inputCategory, setInputCategory] = useState('')

  // API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取文章详情
  const fetchArticle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/hugo/articles/${articleId}`)
      const data = await response.json()

      if (data.success) {
        const articleData = data.data
        setArticle(articleData)
        setContent(articleData.content || '')
        setTags(articleData.tags || [])
        setCategories(articleData.categories || [])
        
        // 设置表单初始值
        form.setFieldsValue({
          title: articleData.title,
          slug: articleData.slug,
          excerpt: articleData.excerpt,
          author: articleData.author,
          status: articleData.status,
          featured: articleData.featured,
          seo_title: articleData.metadata?.seo_title,
          seo_description: articleData.metadata?.seo_description,
          featured_image: articleData.metadata?.featured_image,
        })
      } else {
        message.error(data.error || '获取文章详情失败')
      }
    } catch (error) {
      console.error('获取文章详情失败:', error)
      message.error('获取文章详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存文章
  const handleSave = async (values: any) => {
    setSaving(true)
    try {
      const articleData = {
        ...values,
        content,
        tags,
        categories,
        metadata: {
          seo_title: values.seo_title,
          seo_description: values.seo_description,
          featured_image: values.featured_image,
        }
      }

      const response = await fetch(`${API_BASE_URL}/hugo/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData)
      })

      const data = await response.json()

      if (data.success) {
        message.success('文章保存成功')
        router.push(`/admin/hugo/${articleId}`)
      } else {
        message.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存文章失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag])
      setInputTag('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 添加分类
  const handleAddCategory = () => {
    if (inputCategory && !categories.includes(inputCategory)) {
      setCategories([...categories, inputCategory])
      setInputCategory('')
    }
  }

  // 删除分类
  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove))
  }

  // 生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // 页面加载时获取数据
  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
  }, [articleId])

  if (loading) {
    return (
      <Content style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Content>
    )
  }

  if (!article) {
    return (
      <Content style={{ padding: '24px', minHeight: '100vh' }}>
        <Alert
          message="文章不存在"
          description="请检查文章 ID 是否正确"
          type="error"
          showIcon
          action={
            <Button onClick={() => router.push('/admin/hugo')}>
              返回文章列表
            </Button>
          }
        />
      </Content>
    )
  }

  return (
    <Content style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push(`/admin/hugo/${articleId}`)}
          >
            返回详情
          </Button>
          <Button 
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/hugo/${articleId}`)}
          >
            预览
          </Button>
        </Space>

        <Title level={2} style={{ margin: 0 }}>
          编辑文章：{article.title}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          status: 'draft',
          featured: false,
          author: '管理员'
        }}
      >
        <Row gutter={[24, 0]}>
          {/* 左侧主要内容 */}
          <Col xs={24} lg={16}>
            {/* 基本信息 */}
            <Card title="基本信息" style={{ marginBottom: '16px' }}>
              <Form.Item
                label="文章标题"
                name="title"
                rules={[{ required: true, message: '请输入文章标题' }]}
              >
                <Input 
                  placeholder="请输入文章标题"
                  onChange={(e) => {
                    const title = e.target.value
                    form.setFieldsValue({ slug: generateSlug(title) })
                  }}
                />
              </Form.Item>

              <Form.Item
                label="URL Slug"
                name="slug"
                rules={[{ required: true, message: '请输入 URL Slug' }]}
              >
                <Input placeholder="url-slug" />
              </Form.Item>

              <Form.Item
                label="文章摘要"
                name="excerpt"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入文章摘要（可选）"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </Card>

            {/* 文章内容 */}
            <Card title="文章内容">
              <Form.Item
                label="Markdown 内容"
                name="content"
              >
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入 Markdown 格式的文章内容"
                  rows={20}
                  style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
                />
              </Form.Item>
            </Card>
          </Col>

          {/* 右侧设置区 */}
          <Col xs={24} lg={8}>
            {/* 发布设置 */}
            <Card title="发布设置" style={{ marginBottom: '16px' }}>
              <Form.Item
                label="作者"
                name="author"
                rules={[{ required: true, message: '请输入作者' }]}
              >
                <Input placeholder="请输入作者" />
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="draft">草稿</Option>
                  <Option value="published">已发布</Option>
                  <Option value="archived">已归档</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="精选文章"
                name="featured"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Card>

            {/* 标签管理 */}
            <Card title="标签" style={{ marginBottom: '16px' }}>
              <Space.Compact style={{ width: '100%', marginBottom: '8px' }}>
                <Input
                  placeholder="添加标签"
                  value={inputTag}
                  onChange={(e) => setInputTag(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button icon={<PlusOutlined />} onClick={handleAddTag} />
              </Space.Compact>
              <div>
                {tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    style={{ marginBottom: '4px', fontSize: '12px' }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>

            {/* 分类管理 */}
            <Card title="分类" style={{ marginBottom: '16px' }}>
              <Space.Compact style={{ width: '100%', marginBottom: '8px' }}>
                <Input
                  placeholder="添加分类"
                  value={inputCategory}
                  onChange={(e) => setInputCategory(e.target.value)}
                  onPressEnter={handleAddCategory}
                />
                <Button icon={<PlusOutlined />} onClick={handleAddCategory} />
              </Space.Compact>
              <div>
                {categories.map(category => (
                  <Tag
                    key={category}
                    color="blue"
                    closable
                    onClose={() => handleRemoveCategory(category)}
                    style={{ marginBottom: '4px', fontSize: '12px' }}
                  >
                    {category}
                  </Tag>
                ))}
              </div>
            </Card>

            {/* SEO 设置 */}
            <Card title="SEO 设置" style={{ marginBottom: '16px' }}>
              <Form.Item
                label="SEO 标题"
                name="seo_title"
              >
                <Input placeholder="SEO 标题（可选）" />
              </Form.Item>

              <Form.Item
                label="SEO 描述"
                name="seo_description"
              >
                <TextArea
                  rows={3}
                  placeholder="SEO 描述（可选）"
                  showCount
                  maxLength={160}
                />
              </Form.Item>

              <Form.Item
                label="特色图片"
                name="featured_image"
              >
                <Input placeholder="特色图片 URL（可选）" />
              </Form.Item>
            </Card>

            {/* 操作按钮 */}
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ width: '100%' }}
                >
                  保存文章
                </Button>
                <Button
                  onClick={() => router.push(`/admin/hugo/${articleId}`)}
                  size="large"
                  style={{ width: '100%' }}
                >
                  取消编辑
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </Content>
  )
}

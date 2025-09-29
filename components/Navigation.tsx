'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Typography, Drawer } from 'antd'
import {
  GithubOutlined,
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  KeyOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HeartOutlined,
  GlobalOutlined,
  BarChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

const { Sider } = Layout
const { Text } = Typography

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    if (pathname.includes('/activation-codes')) {
      return ['activation-codes']
    }
    if (pathname.includes('/software')) {
      return ['software']
    }
    if (pathname.includes('/websites')) {
      return ['websites']
    }
    if (pathname.includes('/user-behavior')) {
      return ['user-behavior']
    }
    if (pathname.includes('/donors')) {
      return ['donors']
    }
    if (pathname.includes('/info-management')) {
      return ['info-management']
    }
    if (pathname === '/admin') {
      return ['dashboard']
    }
    return []
  }

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: '仪表板',
      onClick: () => router.push('/admin'),
    },
    {
      key: 'software',
      icon: <AppstoreOutlined />,
      label: '软件管理',
      onClick: () => router.push('/admin/software'),
    },
    {
      key: 'websites',
      icon: <GlobalOutlined />,
      label: '网站管理',
      onClick: () => router.push('/admin/websites'),
    },
    {
      key: 'activation-codes',
      icon: <KeyOutlined />,
      label: '激活码管理',
      onClick: () => router.push('/admin/activation-codes'),
    },
    {
      key: 'user-behavior',
      icon: <BarChartOutlined />,
      label: '用户行为统计',
      onClick: () => router.push('/admin/user-behavior'),
    },
    {
      key: 'donors',
      icon: <HeartOutlined />,
      label: '捐赠人员管理',
      onClick: () => router.push('/admin/donors'),
    },
    {
      key: 'info-management',
      icon: <InfoCircleOutlined />,
      label: '关于我们管理',
      onClick: () => router.push('/admin/info-management'),
    },
  ]

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          width={240}
          collapsedWidth={80}
          collapsed={collapsed}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            zIndex: 1000,
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
          className={className}
          trigger={null}
        >
          {/* Logo区域 */}
          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: collapsed ? '0' : '0 16px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Button
              type="text"
              onClick={() => router.push('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '8px',
                padding: '4px 8px',
                height: 'auto',
                fontSize: '16px',
                fontWeight: 600,
                color: '#1890ff',
              }}
            >
              {!collapsed && (
                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                  领创全栈管理平台
                </Text>
              )}
            </Button>

            {!collapsed && (
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setCollapsed(true)}
                style={{ fontSize: '16px' }}
                title="折叠侧边栏"
              />
            )}
          </div>

          {/* 导航菜单 */}
          <Menu
            mode="vertical"
            selectedKeys={getSelectedKeys()}
            items={menuItems}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '8px 0',
            }}
            inlineCollapsed={collapsed}
          />

          {/* 用户信息区域 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
            }}
          >
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="topRight"
              arrow
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? '0' : '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                role="button"
                tabIndex={0}
                aria-label={`用户菜单 - ${user?.name || user?.login || '管理员'}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Avatar
                  src={user?.avatar_url}
                  icon={!user?.avatar_url && <UserOutlined />}
                  size="default"
                  alt={`${user?.name || user?.login || '管理员'}的头像`}
                />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      strong
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        lineHeight: '20px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.name || user?.login || '管理员'}
                    </Text>
                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        lineHeight: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email || 'GitHub 用户'}
                    </Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>

          {/* 折叠按钮（折叠状态下显示） */}
          {collapsed && (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setCollapsed(false)}
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '16px',
              }}
              title="展开侧边栏"
            />
          )}
        </Sider>
      )}

      {/* 移动端顶部栏 */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 1000,
          }}
        >
          {/* Logo */}
          <Button
            type="text"
            onClick={() => router.push('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              height: 'auto',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1890ff',
            }}
          >
            <GithubOutlined style={{ fontSize: '20px' }} />
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              LACS Admin
            </Text>
          </Button>

          {/* 菜单按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ fontSize: '18px' }}
            aria-label="打开导航菜单"
            title="打开导航菜单"
          />
        </div>
      )}

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GithubOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              LACS Admin
            </Text>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          body: { padding: 0 }
        }}
        aria-label="移动端导航菜单"
        destroyOnClose={false}
        maskClosable={true}
        keyboard={true}
      >
        <Menu
          mode="vertical"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          style={{ border: 'none', marginBottom: '80px' }}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="导航菜单项"
        />

        {/* 移动端用户信息 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="topRight"
            arrow
            trigger={['click']}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #f0f0f0',
                background: '#fafafa',
              }}
              role="button"
              tabIndex={0}
              aria-label={`用户菜单 - ${user?.name || user?.login || '管理员'}`}
            >
              <Avatar
                src={user?.avatar_url}
                icon={!user?.avatar_url && <UserOutlined />}
                size="large"
                alt={`${user?.name || user?.login || '管理员'}的头像`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong
                  style={{
                    display: 'block',
                    fontSize: '16px',
                    lineHeight: '22px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name || user?.login || '管理员'}
                </Text>
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    lineHeight: '20px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email || 'GitHub 用户'}
                </Text>
              </div>
            </div>
          </Dropdown>
        </div>
      </Drawer>
    </>
  )
}

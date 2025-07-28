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
  MenuOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

const { Header } = Layout
const { Text } = Typography

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    if (pathname.includes('/announcements')) {
      return ['announcements']
    }
    if (pathname.includes('/hugo')) {
      return ['hugo']
    }
    if (pathname.startsWith('/admin')) {
      return ['admin']
    }
    return []
  }

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: 'admin',
      icon: <HomeOutlined />,
      label: '管理控制台',
      onClick: () => router.push('/admin'),
    },
    {
      key: 'software',
      icon: <AppstoreOutlined />,
      label: '软件管理',
      onClick: () => router.push('/admin/software'),
    },
    {
      key: 'announcements',
      icon: <NotificationOutlined />,
      label: '公告管理',
      onClick: () => router.push('/admin/announcements'),
    },
    {
      key: 'activation-codes',
      icon: <KeyOutlined />,
      label: '激活码管理',
      onClick: () => router.push('/admin/activation-codes'),
    },
  ]

  // 如果在Hugo页面，添加Hugo菜单项
  if (pathname.includes('/hugo')) {
    menuItems.push({
      key: 'hugo',
      icon: <FileTextOutlined />,
      label: 'Hugo文章',
      onClick: () => {
        const match = pathname.match(/\/admin\/hugo\/([^\/]+)/)
        if (match) {
          router.push(`/admin/hugo/${match[1]}`)
        }
      },
    })
  }

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
      <Header
        style={{
          position: 'fixed',
          zIndex: 1000,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
          height: '64px',
        }}
        className={`responsive-header ${className || ''}`}
      >
        {/* Logo区域 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
            className="responsive-logo"
          >
            <GithubOutlined style={{ fontSize: '20px' }} className="responsive-icon" />
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }} className="desktop-only">
              LACS Admin
            </Text>
          </Button>
        </div>

        {/* 桌面端导航菜单 */}
        <div className="desktop-only" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Menu
            mode="horizontal"
            selectedKeys={getSelectedKeys()}
            items={menuItems}
            style={{
              border: 'none',
              background: 'transparent',
              minWidth: '200px',
            }}
          />
        </div>

        {/* 用户操作区域 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 移动端菜单按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ fontSize: '18px' }}
            className="mobile-only"
          />

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Space style={{ cursor: 'pointer', padding: '8px' }}>
              <Avatar
                src={user?.avatar_url}
                icon={!user?.avatar_url && <UserOutlined />}
                size="default"
              />
              <Text className="desktop-only">{user?.name || user?.login || '管理员'}</Text>
            </Space>
          </Dropdown>
        </div>
      </Header>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="导航菜单"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          body: { padding: 0 }
        }}
      >
        <Menu
          mode="vertical"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          style={{ border: 'none' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      </Drawer>
    </>
  )
}

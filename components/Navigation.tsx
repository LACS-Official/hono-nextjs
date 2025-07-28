'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Typography } from 'antd'
import {
  GithubOutlined,
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  KeyOutlined,
  AppstoreOutlined,
  NotificationOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '@/contexts/AuthContext'

const { Header } = Layout
const { Text } = Typography

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

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
        padding: '0 24px',
        height: '64px',
      }}
      className={className}
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
            fontSize: '18px',
            fontWeight: 600,
            color: '#1890ff',
          }}
        >
          <GithubOutlined style={{ fontSize: '24px' }} />
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            LACS Admin
          </Text>
        </Button>
      </div>

      {/* 导航菜单 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ cursor: 'pointer', padding: '8px' }}>
            <Avatar
              src={user?.avatar_url}
              icon={!user?.avatar_url && <UserOutlined />}
            />
            <Text>{user?.name || user?.login || '管理员'}</Text>
          </Space>
        </Dropdown>
      </div>
    </Header>
  )
}

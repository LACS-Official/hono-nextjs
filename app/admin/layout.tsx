'use client'

import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import debounce from 'lodash/debounce'
import { cn } from '@/lib/utils'

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme: currentTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [compact, setCompact] = useState(false)

  // Listen to system settings preferences
  useEffect(() => {
    let handleSettingChange: ((e: any) => void) | null = null

    try {
      const isCompact = localStorage.getItem('admin_compact_mode') === 'true'
      setCompact(isCompact)
      if (isCompact) {
        document.documentElement.classList.add('admin-compact-mode')
      }

      const title = localStorage.getItem('admin_system_title')
      if (title) {
        document.title = title
      }

      handleSettingChange = (e: any) => {
        if (e.detail?.key === 'compact_mode') {
          const enabled = Boolean(e.detail.value)
          setCompact(enabled)
          if (enabled) {
            document.documentElement.classList.add('admin-compact-mode')
          } else {
            document.documentElement.classList.remove('admin-compact-mode')
          }
        } else if (e.detail?.key === 'system_title' && e.detail.value) {
          document.title = e.detail.value
        }
      }

      window.addEventListener('admin_setting_change', handleSettingChange)
    } catch {}

    return () => {
      if (handleSettingChange) {
        window.removeEventListener('admin_setting_change', handleSettingChange)
      }
    }
  }, [])

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = debounce(() => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      }
    }, 200)

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      checkScreenSize.cancel()
    }
  }, [])

  return (
    <AuthGuard>
      <div className={cn(
        "min-h-screen flex bg-background",
        currentTheme === 'dark' ? 'dark' : ''
      )}>
        <Navigation 
          collapsed={collapsed} 
          setCollapsed={setCollapsed}
          isMobile={isMobile}
        />
        
        <main
          className={cn(
            "flex-1 min-h-screen transition-all duration-300 ease-in-out",
            compact ? "p-4 space-y-4" : "p-6 space-y-6",
            // Padding top regarding mobile header height
            isMobile && "mt-16 pb-20", 
            // Margin regarding sidebar width
            !isMobile && (collapsed ? "ml-[80px]" : "ml-[240px]")
          )}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}

export default function AdminLayout(props: Parameters<typeof AdminLayoutContent>[0]) {
  return <AdminLayoutContent {...props} />
}
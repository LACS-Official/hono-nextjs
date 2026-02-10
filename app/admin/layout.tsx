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

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = debounce(() => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      } else {
        // If switching back to desktop, maybe restore preference? 
        // For now, let's just leave it collapsed if it was manually collapsed, 
        // or ensure it's expanded if we want default behavior.
        // But user interaction should be primary.
        // Let's just update isMobile.
      }
    }, 200)

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      checkScreenSize.cancel()
    }
  }, []) // Remove collapsed dependency to avoid loops

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
            "flex-1 min-h-screen transition-all duration-300 ease-in-out p-6",
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
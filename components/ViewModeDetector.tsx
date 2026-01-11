'use client'

import React, { useState, useEffect } from 'react'

interface ViewModeDetectorProps {
  children: (isMobile: boolean) => React.ReactNode
  mobileBreakpoint?: number
}

const ViewModeDetector: React.FC<ViewModeDetectorProps> = ({ 
  children, 
  mobileBreakpoint = 768 
}) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    // 初始检查
    checkIsMobile()

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile)

    // 清理监听器
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [mobileBreakpoint])

  return <>{children(isMobile)}</>
}

export default ViewModeDetector
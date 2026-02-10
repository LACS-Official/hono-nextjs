'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  FileText,
  User,
  LogOut,
  Settings,
  Key,
  AppWindow,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Heart,
  Globe,
  BarChart,
  Info
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import debounce from 'lodash/debounce'

interface NavigationProps {
  className?: string
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isMobile: boolean
}

export default function Navigation({ className, collapsed, setCollapsed, isMobile }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handlers and effects for resize are now managed by parent or purely props based
  
  const handleLogout = async () => {
    await logout()
  }

  // Check if link is active
  const isLinkActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true
    if (href !== '/admin' && pathname.startsWith(href)) return true
    return false
  }

  // Menu items configuration
  const menuItems = [
    {
      href: '/admin',
      icon: Home,
      label: '仪表板',
    },
    {
      href: '/admin/software',
      icon: AppWindow,
      label: '软件管理',
    },
    {
      href: '/admin/websites',
      icon: Globe,
      label: '网站管理',
    },
    {
      href: '/admin/activation-codes',
      icon: Key,
      label: '激活码管理',
    },
    {
      href: '/admin/user-behavior',
      icon: BarChart,
      label: '用户行为统计',
    },
    {
      href: '/admin/donors',
      icon: Heart,
      label: '捐赠人员管理',
    },
    {
      href: '/admin/info-management',
      icon: Info,
      label: '关于我们管理',
    },
    {
      href: '/admin/system-settings',
      icon: Settings,
      label: '系统设置',
    },
  ]

  // Sidebar component for reuse
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Logo Area */}
      <div className={cn(
        "h-16 flex items-center px-4 border-b",
        collapsed ? "justify-center px-2" : "justify-between"
      )}>
        <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
          {!collapsed ? (
            <span className="text-xl font-bold text-foreground truncate">
              领创全栈管理平台
            </span>
          ) : (
             <span className="text-xl font-bold text-foreground">LACS</span>
          )}
        </Link>
        
        {!collapsed && !isMobile && (
          <div className="flex items-center gap-1">
             <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(true)}
              title="折叠侧边栏"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = isLinkActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Footer */}
      <div className="p-4 border-t bg-background">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full flex items-center gap-3 p-2 h-auto hover:bg-muted",
              collapsed ? "justify-center" : "justify-start"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              
              {!collapsed && (
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-sm font-medium truncate w-full">{user?.name || '管理员'}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{user?.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expand Button (Collapsed Mode) */}
      {collapsed && !isMobile && (
        <div className="py-2 flex justify-center border-t">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(false)}
            title="展开侧边栏"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300",
            collapsed ? "w-[80px]" : "w-[240px]",
            className
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center justify-between px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <SheetHeader className="sr-only">
                <SheetTitle>导航菜单</SheetTitle>
              </SheetHeader>
               {/* Mobile Sidebar Content */}
               <div className="flex flex-col h-full bg-background">
                 <div className="h-16 flex items-center px-6 border-b">
                     <span className="text-xl font-bold text-foreground">LACS Admin</span>
                 </div>
                 <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-4">
                      {menuItems.map((item) => {
                         const isActive = isLinkActive(item.href)
                         return (
                           <Link
                             key={item.href}
                             href={item.href}
                             onClick={() => setMobileMenuOpen(false)}
                             className={cn(
                               "flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm font-medium",
                               isActive 
                                 ? "bg-primary/10 text-primary" 
                                 : "text-muted-foreground hover:bg-muted hover:text-foreground"
                             )}
                           >
                             <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                             <span>{item.label}</span>
                           </Link>
                         )
                      })}
                    </nav>
                 </ScrollArea>
                 <div className="p-4 border-t bg-background">
                    <div className="flex items-center gap-3 mb-4 px-2">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.avatar_url} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{user?.name || '管理员'}</span>
                            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                          </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
                       <LogOut className="mr-2 h-4 w-4" />
                       退出登录
                    </Button>
                 </div>
               </div>
            </SheetContent>
          </Sheet>
          
          <span className="text-lg font-bold text-foreground">LACS Admin</span>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}
    </>
  )
}
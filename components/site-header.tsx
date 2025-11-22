'use client';

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

// 页面标题映射
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '仪表板',
  '/dashboard/accounts': '账号管理',
  '/dashboard/analytics': '用量统计',
  '/dashboard/settings': '设置',
  '/dashboard/profile': '用户信息',
  '/dashboard/help': '帮助中心',
  '/dashboard/playground': '演练场',
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] || '仪表板'

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  )
}

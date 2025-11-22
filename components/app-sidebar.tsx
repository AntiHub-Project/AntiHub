"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconDeviceImacCode
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getStoredUser } from "@/lib/api"

const data = {
  user: {
    name: "antihub",
    email: "antihub@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "我的仪表板",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "账号管理",
      url: "/dashboard/accounts",
      icon: IconListDetails,
    },
    {
      title: "用量统计",
      url: "/dashboard/analytics",
      icon: IconChartBar,
    },
    {
      title: "演练场",
      url: "/dashboard/playground",
      icon: IconDeviceImacCode,
    }
  ],
  navSecondary: [
    {
      title: "设置",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "帮助",
      url: "/dashboard/help",
      icon: IconHelp,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "访客",
    email: "未登录",
    avatar: "/logo_light.png",
  })

  React.useEffect(() => {
    // 从 localStorage 读取用户信息
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser({
        name: storedUser.username,
        email: storedUser.username, // 如果后端没有 email,使用 username
        avatar: storedUser.avatar_url || "/logo_light.png",
      })
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <img
                  src="/logo_light.png"
                  alt="AntiHub Logo"
                  className="h-5 w-5"
                />
                <span className="text-base font-semibold">AntiHub</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

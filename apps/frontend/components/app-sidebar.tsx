"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useTheme } from "@/lib/theme/ThemeContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Nightwatcher",
    email: "admin@nightwatch.io",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Monitors",
      url: "/dashboard/monitors",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Incidents",
      url: "#",
      icon: ListIcon,
    },
    {
      title: "Heartbeats",
      url: "#",
      icon: BarChartIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
  ],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 256 256" fill="none">
                  <path d="M 128 0 C 198.692 0 256 57.308 256 128 C 256 198.692 198.692 256 128 256 C 57.308 256 0 198.692 0 128 C 0 57.308 57.308 0 128 0 Z M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.019 74.98 224 128 224 C 181.019 224 224 181.019 224 128 C 224 74.98 181.019 32 128 32 Z M 128 112 C 136.837 112 144 119.163 144 128 C 144 136.837 136.837 144 128 144 C 119.163 144 112 136.837 112 128 C 112 119.163 119.163 112 128 112 Z" fill="currentColor" />
                </svg>
                <span className="text-base font-bold tracking-tight">NIGHTWATCH</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />

        <SidebarMenu className="px-2 pb-4">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                const audio = new Audio('/audio/anime-ahh.mp3');
                audio.play().catch(err => console.log('Audio play failed:', err));
                toggleTheme();
              }}
              tooltip="Toggle Theme"
            >
              {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}


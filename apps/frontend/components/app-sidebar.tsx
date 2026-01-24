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
import { Logo } from "@/components/Logo"

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
import { tokenManager } from "@/lib/auth/tokenManager"
import { authAPI } from "@/lib/api/auth"

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
      url: "/dashboard/incidents",
      icon: ListIcon,
    },
    {
      title: "Heartbeats",
      url: "/dashboard/heartbeats",
      icon: BarChartIcon,
    },
    {
      title: "Status Pages",
      url: "/dashboard/status-pages",
      icon: ArrowUpCircleIcon,
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
  const [userData, setUserData] = React.useState({
    name: "Nightwatcher",
    email: "admin@nightwatch.io",
    avatar: "/avatars/shadcn.jpg",
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = tokenManager.getToken();
      if (token) {
        try {
          const user = await authAPI.getCurrentUser(token);
          setUserData({
            name: user.name,
            email: user.email,
            avatar: "/avatars/shadcn.jpg"
          });
        } catch (err) {
          console.error("Failed to fetch user", err);
        }
      }
    };
    fetchUser();
  }, []);

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
                <Logo className="w-5 h-5 shrink-0" />
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
              onClick={(e) => {
                const audio = new Audio('/audio/nakime_biwa.mp3');
                audio.play().catch(err => console.log('Audio play failed:', err));
                toggleTheme(e);
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
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}


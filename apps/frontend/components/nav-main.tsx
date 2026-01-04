"use client"

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 px-1.5">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              asChild
              className="min-w-8 bg-button-primary text-button-text duration-200 ease-linear hover:bg-button-primaryHover hover:text-button-text active:bg-button-primaryHover"
            >
              <Link href="/dashboard/monitors/create">
                <PlusCircleIcon />
                <span>Quick Create</span>
              </Link>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0 border-border"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="gap-1 mt-2">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={isActive}
                  className={`transition-colors ${isActive ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-white/5'}`}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className={`size-4 ${isActive ? 'text-button-primary' : ''}`} />}
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

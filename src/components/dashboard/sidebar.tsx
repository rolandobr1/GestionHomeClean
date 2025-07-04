"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { navLinks } from "./nav-links";
import { useAuth } from "@/hooks/use-auth";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const accessibleNavLinks = navLinks.filter(link => {
    if (link.href === '/dashboard/ajustes') {
      return user?.role === 'admin';
    }
    return true;
  });

  return (
    <Sidebar
      className="border-r max-w-xs"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center justify-center h-[40px] px-2">
            <div className="group-data-[state=collapsed]:hidden">
                <img src="/logohomeclean.png" alt="HOMECLEAN Logo" width={120} height={40} className="object-contain" />
            </div>
            <div className="hidden group-data-[collapsed]:block">
                <img src="/logohomeclean.png" alt="HOMECLEAN Logo" width={32} height={32} className="object-contain" />
            </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {accessibleNavLinks.map((link) => {
            const isActive = link.matcher.test(pathname);
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={link.label}
                >
                  <Link href={link.href}>
                    <link.icon className="size-4" />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";

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

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="border-r max-w-xs"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <FlaskConical className="size-6 text-primary" />
          <h1 className="text-lg font-semibold text-primary font-headline">
            QuimioGest
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.href}
                  tooltip={link.label}
                >
                  <a>
                    <link.icon className="size-4" />
                    <span>{link.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

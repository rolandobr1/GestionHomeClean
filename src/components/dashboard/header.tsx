"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserNav } from "./user-nav";
import { navLinks } from "./nav-links";
import Link from "next/link";

export function DashboardHeader() {
    const pathname = usePathname();
    const currentLink = navLinks.find(link => link.href === pathname);
    const pageTitle = currentLink ? currentLink.label : "Dashboard";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                 >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

      <div className="w-full flex-1">
         <h1 className="font-semibold text-lg">{pageTitle}</h1>
      </div>
      <UserNav />
    </header>
  );
}

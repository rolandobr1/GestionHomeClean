"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserNav } from "./user-nav";
import { navLinks } from "./nav-links";
import Link from "next/link";
import { useState } from "react";

export function DashboardHeader() {
    const pathname = usePathname();
    const currentLink = navLinks.find(link => link.matcher.test(pathname));
    const pageTitle = currentLink ? currentLink.label : "Dashboard";
    const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="flex h-14 w-full items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
          <SheetContent side="left" className="flex flex-col p-0">
            <SheetHeader className="border-b p-4">
                <SheetTitle>
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                        <img src="/logohomeclean.png" alt="HOMECLEAN Logo" width={120} height={40} className="object-contain" />
                    </Link>
                </SheetTitle>
            </SheetHeader>
            <nav className="grid gap-2 text-lg font-medium p-4">
              {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    onClick={() => setIsSheetOpen(false)}
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navLinks } from "./nav-links";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const accessibleNavLinks = navLinks.filter(link => {
    if (link.href === '/dashboard/ajustes') {
      return user?.role === 'admin';
    }
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-50">
      <nav className="grid h-full grid-cols-5">
        {accessibleNavLinks.slice(0, 5).map((link) => {
          const isActive = link.matcher.test(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary",
                isActive && "text-primary bg-primary/10"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

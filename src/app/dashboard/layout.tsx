"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; // The loading screen is handled by AuthProvider
  }

  return (
      <SidebarProvider>
        <div className="md:flex">
          <div className="hidden md:block">
            <DashboardSidebar />
          </div>
          <main className="flex-1 md:ml-[58px] lg:ml-0 flex flex-col min-h-screen pb-16 md:pb-0">
              <DashboardHeader />
              <div className="flex-grow p-4 md:p-6 lg:p-8 bg-background">
                  {children}
              </div>
          </main>
          <BottomNav />
        </div>
      </SidebarProvider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppProvider } from "@/components/app-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen">
          <div className="hidden md:block border-r w-[58px] p-2">
              <div className="flex flex-col space-y-4 items-center">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
              </div>
          </div>
          <main className="flex-1 flex flex-col">
              <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                  <Skeleton className="h-8 w-8 rounded-full md:hidden" />
                  <div className="w-full flex-1">
                      <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
              </header>
              <div className="flex-grow p-4 md:p-6 lg:p-8">
                   <Skeleton className="h-full w-full" />
              </div>
          </main>
      </div>
    );
  }

  return (
    <AppProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-16 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
              {children}
            </main>
          </div>
          <BottomNav />
        </div>
      </SidebarProvider>
    </AppProvider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppProvider } from "@/components/app-provider";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
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

function DashboardUI({ children }: { children: React.ReactNode }) {
  const { loading: dataLoading } = useAppData();

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 pb-16 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <AppProvider>
      <DashboardUI>{children}</DashboardUI>
    </AppProvider>
  );
}


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function CuentasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/cuentas/por-cobrar');
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
      </div>
       <Skeleton className="h-96 w-full" />
    </div>
  );
}

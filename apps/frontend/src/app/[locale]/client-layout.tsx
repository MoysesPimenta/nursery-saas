'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { AuthProvider } from '@/lib/auth-context';
import { PageLoading } from '@/components/ui/loading';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/auth/reset-password', '/auth/mfa'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.includes(route));
}

function LayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { loading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      router.push(`/${params.locale}/auth/login`);
    }
  }, [loading, session, router, params.locale, isPublic]);

  // Public routes (login, signup, etc.) render without auth guard or shell
  if (isPublic) {
    return <>{children}</>;
  }

  if (loading) {
    return <PageLoading />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Topbar />
        <main className="flex-1 overflow-y-auto pt-20 md:ml-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <AuthProvider>
      <LayoutContent params={params}>{children}</LayoutContent>
    </AuthProvider>
  );
}

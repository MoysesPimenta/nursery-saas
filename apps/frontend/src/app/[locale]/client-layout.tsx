'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { AuthProvider } from '@/lib/auth-context';
import { PageLoading } from '@/components/ui/loading';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/auth/reset-password', '/auth/mfa'];

const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['super_admin', 'school_admin'],
  '/parent': ['parent', 'super_admin', 'school_admin', 'nurse'],
  '/profile': [], // Accessible to all authenticated users
  '/settings': [], // Accessible to all authenticated users
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.includes(route));
}

function checkRouteAccess(pathname: string, userRole?: string): boolean {
  // Remove locale prefix to check route access
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[a-zA-Z]{2})?/, '');

  for (const [protectedRoute, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (pathWithoutLocale.startsWith(protectedRoute)) {
      // If allowedRoles is empty, route is accessible to all authenticated users
      if (allowedRoles.length === 0) {
        return true;
      }
      // Otherwise, check if user's role is in the allowed list
      return userRole ? allowedRoles.includes(userRole) : false;
    }
  }

  // All other authenticated routes are accessible
  return true;
}

function LayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { loading, session, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      router.push(`/${params.locale}/auth/login`);
    }
  }, [loading, session, router, params.locale, isPublic]);

  // Check role-based access for protected routes
  useEffect(() => {
    if (!loading && session && !isPublic) {
      const hasAccess = checkRouteAccess(pathname, userProfile?.role);
      if (!hasAccess) {
        // Redirect to dashboard if user doesn't have access to this route
        router.push(`/${params.locale}`);
      }
    }
  }, [loading, session, userProfile, pathname, router, params.locale, isPublic]);

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

  // Check if user has access to this route
  const hasAccess = checkRouteAccess(pathname, userProfile?.role);
  if (!hasAccess) {
    return null; // Will be redirected by useEffect above
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-[260px] flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
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

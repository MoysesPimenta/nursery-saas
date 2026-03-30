'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useMessages } from 'next-intl';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { AuthProvider } from '@/lib/auth-context';
import { PageLoading } from '@/components/ui/loading';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function LayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { loading, session } = useAuth();
  const router = useRouter();
  const messages = useMessages();

  useEffect(() => {
    if (!loading && !session) {
      router.push(`/${params.locale}/auth/login`);
    }
  }, [loading, session, router, params.locale]);

  if (loading) {
    return <PageLoading />;
  }

  if (!session) {
    return null;
  }

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full">
          <Topbar />
          <main className="flex-1 overflow-y-auto pt-20 md:ml-0">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

export default function LocaleLayout({
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

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to locale-specific home page
    const locale = navigator.language.split('-')[0];
    const supportedLocales = ['en', 'pt', 'es', 'de', 'fr', 'it', 'he'];
    const targetLocale = supportedLocales.includes(locale) ? locale : 'en';
    router.push(`/${targetLocale}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to locale-specific home page
    const browserLang = navigator.language;
    const supportedLocales = ['en', 'pt-BR', 'es', 'de', 'fr', 'it', 'he'];
    const shortLang = browserLang.split('-')[0];
    // Match full locale first (e.g., pt-BR), then fall back to short (e.g., es)
    const targetLocale = supportedLocales.includes(browserLang)
      ? browserLang
      : supportedLocales.find(l => l.startsWith(shortLang)) || 'en';
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

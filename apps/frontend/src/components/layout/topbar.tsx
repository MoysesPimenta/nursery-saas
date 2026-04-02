'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Globe, Bell, HelpCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopbarProps {
  className?: string;
}

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
];

export function Topbar({ className }: TopbarProps) {
  const [localeOpen, setLocaleOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;

  const changeLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setLocaleOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 left-0 md:left-64 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Placeholder for content */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 relative">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Language"
              onClick={() => setLocaleOpen(!localeOpen)}
            >
              <Globe className="w-4 h-4" />
            </Button>
            {localeOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                {LOCALES.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => changeLocale(locale.code)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors',
                      currentLocale === locale.code
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {locale.label}
                    {currentLocale === locale.code && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

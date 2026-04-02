'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Globe, Bell, HelpCircle, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'pt', label: 'Português', flag: 'PT' },
];

export function Topbar() {
  const [localeOpen, setLocaleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setLocaleOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Search">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Help">
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs font-medium"
            onClick={() => setLocaleOpen(!localeOpen)}
          >
            <Globe className="w-3.5 h-3.5" />
            {currentLocale.toUpperCase()}
          </Button>
          {localeOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-popover border border-border rounded-xl shadow-elevated z-50 py-1 animate-scale-in origin-top-right">
              {LOCALES.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => changeLocale(locale.code)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors rounded-lg mx-1 first:mt-0.5 last:mb-0.5',
                    currentLocale === locale.code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                  )}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <span>{locale.label}</span>
                  {currentLocale === locale.code && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

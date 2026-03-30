'use client';

import Link from 'next/link';
import { Globe, Bell, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Language">
            <Globe className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

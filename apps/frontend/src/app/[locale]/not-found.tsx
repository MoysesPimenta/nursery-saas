'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-primary/20 mb-2">404</div>
        <h2 className="text-2xl font-semibold mb-2">{t('notFound')}</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link href="/en">
        <Button variant="default">Go to Dashboard</Button>
      </Link>
    </div>
  );
}

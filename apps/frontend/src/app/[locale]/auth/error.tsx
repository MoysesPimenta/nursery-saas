'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Authentication Error</h2>
        <p className="text-muted-foreground max-w-md">
          An error occurred during authentication. Please try again or log in.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Link href="/en/auth/login">
          <Button variant="outline">Go to Login</Button>
        </Link>
      </div>
    </div>
  );
}

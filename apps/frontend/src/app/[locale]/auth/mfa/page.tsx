'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function MFAPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get the current session to verify MFA
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setError('No active session found. Please login again.');
        router.push(`/${locale}/auth/login`);
        return;
      }

      // Verify the TOTP code
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: session.user.user_metadata?.factor_id || '',
        code,
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data) {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify MFA code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-primary-600" />
            <h1 className="text-2xl font-bold text-primary-600">Two-Factor Auth</h1>
          </div>
          <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
              variant="primary"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="text-center text-sm">
              <a href={`/${locale}/auth/login`} className="text-primary-600 hover:underline">
                Back to login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

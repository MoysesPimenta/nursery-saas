'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage('Check your email for a password reset link');
      setTimeout(() => {
        setStep('reset');
        setMessage(null);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-green-500" />
              <h1 className="text-2xl font-bold text-green-500">Reset Password</h1>
            </div>
            <CardTitle className="text-2xl">
              {step === 'request' ? 'Request Password Reset' : 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {step === 'request'
                ? 'Enter your email address to receive a reset code'
                : 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>

                <div className="text-center text-sm">
                  <a href={`/${locale}/auth/login`} className="text-green-600 hover:underline">
                    Back to login
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <div className="text-center text-sm">
                  <a href={`/${locale}/auth/login`} className="text-green-600 hover:underline">
                    Back to login
                  </a>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

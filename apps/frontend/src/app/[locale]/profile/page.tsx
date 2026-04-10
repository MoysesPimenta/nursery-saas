'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { userProfile, session } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError(t('allPasswordFieldsRequired'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('passwordMinimum'));
      return;
    }

    try {
      setLoading(true);

      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const displayName = userProfile?.firstName || userProfile?.lastName
    ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    : 'User';

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Messages */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-900 dark:text-red-100">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {success && (
        <motion.div variants={itemVariants}>
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-900 dark:text-green-100">
                {t('passwordChanged')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Information */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('accountInfo')}</CardTitle>
            <CardDescription>
              {t('accountDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('name')}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {displayName}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('email')}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {userProfile?.email || t('notAvailable')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Role and Permissions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('rolePermissions')}</CardTitle>
            <CardDescription>
              {t('yourAccountRole')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('role')}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {userProfile?.role || t('user')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('tenant')}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {userProfile?.tenantId ? `Org ${userProfile.tenantId.substring(0, 8)}...` : t('default')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('changePassword')}</CardTitle>
            <CardDescription>
              {t('keepAccountSecure')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('currentPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder={t('enterCurrentPassword')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder={t('enterNewPassword')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('confirmNewPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder={t('confirmYourNewPassword')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t('updating')}
                    </>
                  ) : (
                    t('changePassword')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  onClick={() =>
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }
                >
                  {t('clear')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

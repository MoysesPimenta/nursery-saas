'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Moon, Sun, Monitor, Bell, Mail, AlertCircle } from 'lucide-react';

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

const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'he', label: 'עברית' },
];

type ThemeMode = 'light' | 'dark' | 'system';

interface NotificationSettings {
  emailNotifications: boolean;
  visitAlerts: boolean;
  authorizationReminders: boolean;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const [theme, setTheme] = useState<ThemeMode>('system');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    visitAlerts: true,
    authorizationReminders: true,
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Load notification preferences from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to load notification settings:', e);
      }
    }
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale !== locale) {
      router.push(`/${newLocale}/settings`);
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme to DOM
    if (newTheme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    const updated = {
      ...notifications,
      [key]: value,
    };
    setNotifications(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
  };

  const currentLocaleLabel = SUPPORTED_LOCALES.find(l => l.code === locale)?.label || 'English';

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

      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-900 dark:text-green-100">
                {t('savedSuccessfully')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Language & Locale Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
            <CardDescription>
              Choose your preferred language for the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-3">
                {t('language')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SUPPORTED_LOCALES.map((localeOption) => (
                  <button
                    key={localeOption.code}
                    onClick={() => handleLocaleChange(localeOption.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      locale === localeOption.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-transparent hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{localeOption.label}</span>
                      {locale === localeOption.code && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('theme')}</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-3">
                {t('theme')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-transparent hover:border-primary/40'
                  }`}
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('light')}</span>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-transparent hover:border-primary/40'
                  }`}
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('dark')}</span>
                </button>

                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    theme === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-transparent hover:border-primary/40'
                  }`}
                >
                  <Monitor className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('system')}</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications')}</CardTitle>
            <CardDescription>
              Manage how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">
                    {t('emailNotifications')}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleNotificationChange(
                    'emailNotifications',
                    !notifications.emailNotifications
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.emailNotifications
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Visit Alerts */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">
                    Visit Alerts
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified of visit changes and updates
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleNotificationChange(
                    'visitAlerts',
                    !notifications.visitAlerts
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.visitAlerts ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.visitAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Authorization Reminders */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">
                    Authorization Reminders
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive reminders about pending authorizations
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleNotificationChange(
                    'authorizationReminders',
                    !notifications.authorizationReminders
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.authorizationReminders
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.authorizationReminders
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div variants={itemVariants}>
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              Your settings are saved locally on your device. Language and locale preferences are applied immediately when changed.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle, Loader, CheckCircle, Upload } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

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

interface TenantData {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  subscription_tier?: string;
  max_children?: number;
  max_employees?: number;
  max_storage_mb?: number;
  created_at: string;
  updated_at: string;
}

interface TenantSettings {
  name: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
}

export default function TenantSettingsPage() {
  const t = useTranslations('admin');
  const [tenant, setTenant] = React.useState<TenantData | null>(null);
  const [settings, setSettings] = React.useState<TenantSettings>({
    name: '',
    logo_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadTenant() {
      try {
        setLoading(true);
        setError(null);

        // Try to load tenant, fallback to demo data
        try {
          const data = await apiGet<TenantData>('/api/v1/admin/tenant');
          setTenant(data);
          setSettings({
            name: data.name,
            logo_url: data.logo_url,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            phone: data.phone,
            email: data.email,
          });
        } catch {
          // Demo data
          const demoTenant: TenantData = {
            id: '1',
            name: 'Demo School',
            slug: 'demo-school',
            logo_url: '',
            address: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip_code: '62701',
            phone: '(217) 555-0100',
            email: 'info@demo-school.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setTenant(demoTenant);
          setSettings({
            name: demoTenant.name,
            logo_url: demoTenant.logo_url,
            address: demoTenant.address,
            city: demoTenant.city,
            state: demoTenant.state,
            zip_code: demoTenant.zip_code,
            phone: demoTenant.phone,
            email: demoTenant.email,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load settings'
        );
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await apiPatch('/api/v1/admin/tenant', {
        name: settings.name,
        logo_url: settings.logo_url,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zip_code: settings.zip_code,
        phone: settings.phone,
        email: settings.email,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {t('tenantSettings')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('configureBranding')}
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
                {t('settingsSavedSuccessfully')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Information Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t('schoolInformation')}</CardTitle>
              <CardDescription>
                {t('manageSchoolDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('schoolName')}
                </label>
                <Input
                  value={settings.name}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Bright Kids Academy"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('address')}
                </label>
                <Input
                  value={settings.address || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="e.g., 123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('city')}
                  </label>
                  <Input
                    value={settings.city || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="e.g., Springfield"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('state')}
                  </label>
                  <Input
                    value={settings.state || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    placeholder="e.g., IL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('zipCode')}
                  </label>
                  <Input
                    value={settings.zip_code || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        zip_code: e.target.value,
                      }))
                    }
                    placeholder="e.g., 62701"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('phone')}
                  </label>
                  <Input
                    value={settings.phone || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="e.g., (217) 555-0100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('email')}
                  </label>
                  <Input
                    value={settings.email || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="e.g., info@school.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('schoolLogo')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-muted">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="mb-2"
                      disabled
                    >
                      {t('uploadLogo')}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t('logoFormat')}. Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Info - Optional */}
        {tenant?.subscription_tier && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Information</CardTitle>
                <CardDescription>
                  Your current plan and usage limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tenant.subscription_tier && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Current Plan
                        </p>
                        <p className="text-lg font-semibold text-foreground capitalize">
                          {tenant.subscription_tier}
                        </p>
                      </div>
                    )}

                    {tenant.max_children !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Max Children
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {tenant.max_children}
                        </p>
                      </div>
                    )}

                    {tenant.max_employees !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Max Employees
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {tenant.max_employees}
                        </p>
                      </div>
                    )}

                    {tenant.max_storage_mb !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Storage Limit
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {(tenant.max_storage_mb / 1024).toFixed(1)} GB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button variant="secondary" disabled>
                      View Billing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feature Toggles */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t('features')}</CardTitle>
              <CardDescription>
                {t('enableDisableFeatures')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {t('healthRecords')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('storeManageHealth')}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {t('enabled')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {t('medicationTracking')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('trackMedications')}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {t('enabled')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {t('parentPortal')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('allowParents')}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {t('enabled')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {t('advancedAnalytics')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('accessHealthTrends')}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {tenant?.subscription_tier === 'enterprise'
                      ? t('enabled')
                      : t('upgradeToProPlus')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex gap-3">
          <Button
            type="submit"
            variant="default"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveSettings')
            )}
          </Button>
          <Button type="button" variant="ghost" disabled={saving}>
            {t('common.cancel')}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}

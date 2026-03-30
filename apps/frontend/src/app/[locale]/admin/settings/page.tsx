'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';
import { motion } from 'framer-motion';
import { AlertCircle, Loader, CheckCircle, Upload } from 'lucide-react';
import { Tenant } from '@nursery-saas/shared';
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

interface TenantSettings {
  name: string;
  themeColor: string;
  logoUrl?: string;
}

export default function TenantSettingsPage() {
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [settings, setSettings] = React.useState<TenantSettings>({
    name: '',
    themeColor: '#10b981',
    logoUrl: '',
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
          const data = await apiGet<Tenant>('/api/v1/admin/tenant');
          setTenant(data);
          setSettings({
            name: data.name,
            themeColor: data.themeColor,
            logoUrl: data.logoUrl,
          });
        } catch {
          // Demo data
          const demoTenant: Tenant = {
            id: '1',
            name: 'Demo School',
            slug: 'demo-school',
            logoUrl: '',
            themeColor: '#10b981',
            subscriptionTier: 'professional',
            maxChildren: 100,
            maxEmployees: 20,
            maxStorageMb: 51200,
            isActive: true,
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTenant(demoTenant);
          setSettings({
            name: demoTenant.name,
            themeColor: demoTenant.themeColor,
            logoUrl: demoTenant.logoUrl,
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
        themeColor: settings.themeColor,
        logoUrl: settings.logoUrl,
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
        <Loader className="w-8 h-8 animate-spin text-green-600" />
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
          <h1 className="text-3xl font-bold tracking-tight">
            Tenant Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your school's branding and configuration.
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
                Settings saved successfully!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize your school's appearance and identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  School Name
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
                <label className="block text-sm font-semibold mb-3">
                  Theme Color
                </label>
                <ColorPicker
                  value={settings.themeColor}
                  onChange={(color) =>
                    setSettings((prev) => ({
                      ...prev,
                      themeColor: color,
                    }))
                  }
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  This color will be used for buttons, links, and highlights throughout the app.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  School Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="mb-2"
                      disabled
                    >
                      Upload Logo
                    </Button>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      PNG, JPG up to 5MB. Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Info */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Information</CardTitle>
              <CardDescription>
                Your current plan and usage limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        Current Plan
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 capitalize">
                        {tenant.subscriptionTier}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        Max Children
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {tenant.maxChildren}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        Max Employees
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {tenant.maxEmployees}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        Storage Limit
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {(tenant.maxStorageMb / 1024).toFixed(1)} GB
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <Button variant="secondary" disabled>
                      View Billing
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Enable or disable features for your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-50">
                      Health Records
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Store and manage child health records
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Enabled
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-50">
                      Medication Tracking
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Track medications and allergies
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Enabled
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-50">
                      Parent Portal
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Allow parents to view child health information
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Enabled
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-50">
                      Advanced Analytics
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Access health trends and reporting
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {tenant?.subscriptionTier === 'enterprise'
                      ? 'Enabled'
                      : 'Upgrade to Professional+'}
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
            variant="primary"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
          <Button type="button" variant="ghost" disabled={saving}>
            Cancel
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}

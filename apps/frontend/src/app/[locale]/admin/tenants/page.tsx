'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Pause,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { Tenant } from '@nursery-saas/shared';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

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

interface CreateTenantForm {
  name: string;
  slug: string;
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  maxChildren: number;
  maxEmployees: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTierColor(
  tier: 'free' | 'starter' | 'professional' | 'enterprise'
): string {
  const colors = {
    free: 'secondary',
    starter: 'info',
    professional: 'success',
    enterprise: 'purple',
  } as any;
  return colors[tier] || 'secondary';
}

export default function TenantManagementPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateTenantForm>({
    name: '',
    slug: '',
    subscriptionTier: 'starter',
    maxChildren: 50,
    maxEmployees: 10,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadTenants() {
      try {
        setLoading(true);
        setError(null);
        // Mock data - replace with actual API call
        const data = await apiGet<Tenant[]>('/api/v1/admin/tenants');
        setTenants(data || []);
      } catch (err) {
        // For demo purposes, use empty array
        setTenants([]);
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newTenant = await apiPost<Tenant>('/api/v1/admin/tenants', {
        ...formData,
        maxStorageMb: 10240,
      });
      setTenants((prev) => [newTenant, ...prev]);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        slug: '',
        subscriptionTier: 'starter',
        maxChildren: 50,
        maxEmployees: 10,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create tenant'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = tenants.reduce((sum, tenant) => {
    const tierPrices = {
      free: 0,
      starter: 99,
      professional: 299,
      enterprise: 999,
    };
    return sum + (tierPrices[tenant.subscriptionTier] || 0);
  }, 0);

  const expiringCount = 0; // Mock value

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tenant Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all registered nursery tenants and their subscriptions.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                New Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Register a new nursery school tenant in the system.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    School Name
                  </label>
                  <Input
                    placeholder="e.g., Bright Kids Academy"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Slug (auto-generated)
                  </label>
                  <Input
                    placeholder="bright-kids-academy"
                    value={formData.slug}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={formData.subscriptionTier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subscriptionTier: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">Free - $0/mo</option>
                    <option value="starter">
                      Starter - $99/mo
                    </option>
                    <option value="professional">
                      Professional - $299/mo
                    </option>
                    <option value="enterprise">
                      Enterprise - $999/mo
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Children
                    </label>
                    <Input
                      type="number"
                      value={formData.maxChildren}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxChildren: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Employees
                    </label>
                    <Input
                      type="number"
                      value={formData.maxEmployees}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxEmployees: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !formData.name}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Tenant'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Error message */}
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

      {/* Search */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name or slug..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Active Tenants
              </div>
              <div className="text-2xl font-bold text-foreground">
                {tenants.filter((t) => t.isActive).length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Monthly Revenue
              </div>
              <div className="text-2xl font-bold text-primary">
                ${totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Expiring Soon
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {expiringCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tenants List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Tenants List</CardTitle>
            <CardDescription>
              Total: {filteredTenants.length} tenant(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? 'No tenants match your search.'
                  : 'No tenants created yet. Create your first tenant to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">
                        School Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Slug
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Tier
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Max Children
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {tenant.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {tenant.slug}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getTierColor(tenant.subscriptionTier)}>
                            {tenant.subscriptionTier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {tenant.maxChildren}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              tenant.isActive
                                ? 'success'
                                : 'secondary'
                            }
                          >
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(tenant.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              aria-label="Edit tenant"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              aria-label="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

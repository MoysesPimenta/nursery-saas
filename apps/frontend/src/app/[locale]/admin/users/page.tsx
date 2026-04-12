'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
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
  Edit2,
  X,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

// Local interface matching backend snake_case response
interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: Array<{ id: string; name: string }>;
  created_at: string;
  updated_at: string;
}

interface BackendRole {
  id: string;
  name: string;
}

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

const ROLE_CONFIG: { name: string; labelKey: string; variant: 'success' | 'info' | 'warning' | 'purple' | 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
  { name: 'school_admin', labelKey: 'schoolAdmin', variant: 'purple' },
  { name: 'nurse', labelKey: 'nurse', variant: 'success' },
  { name: 'teacher', labelKey: 'teacher', variant: 'info' },
  { name: 'inspector', labelKey: 'inspector', variant: 'warning' },
  { name: 'parent', labelKey: 'parent', variant: 'default' },
  { name: 'read_only', labelKey: 'readOnly', variant: 'secondary' },
];

interface InviteForm {
  email: string;
  roleId: string;
  fullName?: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRoleVariant(roleName: string): 'success' | 'info' | 'warning' | 'purple' | 'default' | 'secondary' | 'destructive' | 'outline' {
  const config = ROLE_CONFIG.find((r) => r.name === roleName);
  return config?.variant || 'default';
}

function getRoleLabel(roleName: string, t: (_key: string) => string): string {
  const config = ROLE_CONFIG.find((r) => r.name === roleName);
  return config?.labelKey ? t(config.labelKey) : roleName;
}

export default function UserManagementPage() {
  const t = useTranslations('admin');
  const [users, setUsers] = React.useState<BackendUser[]>([]);
  const [availableRoles, setAvailableRoles] = React.useState<BackendRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string | 'all'>('all');
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<InviteForm>({
    email: '',
    roleId: '',
    fullName: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadUsersAndRoles() {
      try {
        setLoading(true);
        setError(null);

        // Fetch users from correct endpoint
        const response = await apiGet<{ data: BackendUser[] }>('/api/v1/admin/users');
        setUsers(response?.data || []);

        // Try to fetch roles - if endpoint doesn't exist, set empty array
        try {
          const rolesResponse = await apiGet<{ data: BackendRole[] }>('/api/v1/admin/roles');
          setAvailableRoles(rolesResponse?.data || ROLE_CONFIG.map((r) => ({ id: r.name, name: r.name })));
        } catch {
          // Fallback to predefined roles if endpoint doesn't exist
          setAvailableRoles(ROLE_CONFIG.map((r) => ({ id: r.name, name: r.name })));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        setUsers([]);
        setAvailableRoles(ROLE_CONFIG.map((r) => ({ id: r.name, name: r.name })));
      } finally {
        setLoading(false);
      }
    }

    loadUsersAndRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiPost('/api/v1/admin/users', {
        email: formData.email,
        role_id: formData.roleId,
        full_name: formData.fullName,
      });

      setIsInviteOpen(false);
      setFormData({
        email: '',
        roleId: '',
        fullName: '',
      });

      // Reload users
      const response = await apiGet<{ data: BackendUser[] }>('/api/v1/admin/users');
      setUsers(response?.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invite'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.roles.some((r) => r.name === roleFilter);

    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter((u) => u.is_active).length;

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
              {t('users')}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users, roles, and access permissions.
            </p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <Plus className="w-4 h-4" />
                {t('inviteUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('inviteNewUser')}</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new user to join the system.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name (Optional)
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={formData.fullName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        roleId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a role...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {getRoleLabel(role.name, t)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isSubmitting || !formData.email || !formData.roleId}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      t('sendInvite')
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

      {/* Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search and Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Filter by Role
              </label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={roleFilter === 'all' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setRoleFilter('all')}
                >
                  All Roles
                </Button>
                {ROLE_CONFIG.map((role) => (
                  <Button
                    key={role.name}
                    variant={
                      roleFilter === role.name ? 'default' : 'secondary'
                    }
                    size="sm"
                    onClick={() => setRoleFilter(role.name)}
                  >
                    {t(role.labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Total Users
              </div>
              <div className="text-2xl font-bold text-foreground">
                {users.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Active Users
              </div>
              <div className="text-2xl font-bold text-primary">
                {activeUsers}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Users List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              Total: {filteredUsers.length} user(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? 'No users match your search.'
                  : 'No users created yet. Invite your first user to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Last Login
                      </th>
                      <th className="text-right py-3 px-4 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {user.full_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          {user.roles.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.map((role) => (
                                <Badge key={role.id} variant={getRoleVariant(role.name)}>
                                  {getRoleLabel(role.name, t)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No role</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              user.is_active ? 'success' : 'secondary'
                            }
                          >
                            {user.is_active ? t('active') : t('inactive')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(user.updated_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              aria-label="Edit user"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 hover:text-red-600"
                              aria-label="Deactivate user"
                            >
                              <X className="w-4 h-4" />
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

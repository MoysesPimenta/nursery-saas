'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, Building2, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface DepartmentsResponse {
  data: Department[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function DepartmentsPage() {
  const t = useTranslations('departments');
  const tc = useTranslations('common');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: response, loading, error, refetch } = useApiQuery<DepartmentsResponse>(
    `/api/v1/departments?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const { execute: createDepartment, loading: isSubmitting } = useApiMutation<Department>(
    '/api/v1/departments',
    'POST'
  );

  const { execute: updateDepartment, loading: isUpdating } = useApiMutation<Department>(
    editingItem ? `/api/v1/departments/${editingItem.id}` : '',
    'PATCH'
  );

  const { execute: deleteDepartment, loading: isDeleting } = useApiMutation<void>(
    '',
    'DELETE'
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('departmentNameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
      };

      if (editingItem) {
        await updateDepartment(payload);
      } else {
        await createDepartment(payload);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to save department' });
    }
  };

  const handleEdit = (item: Department) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: Department) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteDepartment(undefined, `/api/v1/departments/${item.id}`);
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to delete department' });
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: tc('name'),
      render: (value: string, item: Department) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'description' as const,
      label: tc('description'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate">{value || '—'}</span>
      ),
    },
  ];

  const rowActions = (item: Department) => [
    {
      label: tc('edit'),
      icon: Edit2,
      onClick: () => handleEdit(item),
    },
    {
      label: tc('delete'),
      icon: Trash2,
      onClick: () => handleDelete(item),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4" />
          {t('addDepartment')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} departments available
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-center">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Failed to load departments. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                emptyMessage={t('noDepartments')}
                rowKey={(departmentItem) => departmentItem.id}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingItem(null);
          setFormData({ name: '', description: '' });
          setErrors({});
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editDepartment') : t('addDepartment')}</DialogTitle>
            <DialogDescription>
              {editingItem ? t('editDepartmentDescription') : t('addDepartmentDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField
              label={t('departmentName')}
              required
              error={errors.name}
            >
              <Input
                name="name"
                placeholder="e.g., Administration"
                value={formData.name}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={tc('description')}
              error={errors.description}
            >
              <Textarea
                name="description"
                placeholder="e.g., Handles administrative tasks and operations"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </FormField>

            {errors.submit && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting || isUpdating}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUpdating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isSubmitting || isUpdating ? (editingItem ? t('updating') : t('creating')) : (editingItem ? t('update') : t('addDepartment'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

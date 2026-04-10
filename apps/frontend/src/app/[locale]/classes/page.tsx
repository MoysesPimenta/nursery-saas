'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface Class {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
}

interface ClassesResponse {
  data: Class[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function ClassesPage() {
  const t = useTranslations('classes');
  const tc = useTranslations('common');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_capacity: '',
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

  const { data: response, loading, error, refetch } = useApiQuery<ClassesResponse>(
    `/api/v1/classes?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const { execute: createClass, loading: isSubmitting } = useApiMutation<Class>(
    '/api/v1/classes',
    'POST'
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
      newErrors.name = t('classNameRequired');
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
        capacity: formData.max_capacity ? parseInt(formData.max_capacity, 10) : undefined,
      };

      await createClass(payload);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        max_capacity: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to create class' });
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: tc('name'),
      render: (value: string, item: Class) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
            <GraduationCap className="w-4 h-4" />
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
    {
      key: 'capacity' as const,
      label: t('maxCapacity'),
      render: (value: number) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
  ];

  const rowActions = (item: Class) => [
    {
      label: 'Edit',
      icon: Edit2,
      onClick: () => {
        // Edit functionality would go here
        console.log('Edit class:', item.id);
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => {
        // Delete functionality would go here
        console.log('Delete class:', item.id);
      },
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
          className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <Plus className="w-4 h-4" />
          {t('addClass')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                All Classes
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} classes available
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
                  Failed to load classes. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                emptyMessage={t('noClasses')}
                rowKey={(classItem) => classItem.id}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addClass')}</DialogTitle>
            <DialogDescription>
              {t('addClassDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField
              label={t('className')}
              required
              error={errors.name}
            >
              <Input
                name="name"
                placeholder="e.g., Toddlers Room A"
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
                placeholder="e.g., For children aged 2-3 years"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </FormField>

            <FormField
              label={t('maxCapacity')}
              error={errors.max_capacity}
            >
              <Input
                name="max_capacity"
                type="number"
                placeholder="e.g., 15"
                value={formData.max_capacity}
                onChange={handleInputChange}
                min="1"
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
              disabled={isSubmitting}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {isSubmitting ? t('creating') : t('addClass')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

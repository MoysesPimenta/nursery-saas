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
  grade_level?: string;
  academic_year?: string;
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
  const [editingItem, setEditingItem] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade_level: '',
    capacity: '',
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

  const { execute: updateClass, loading: isUpdating } = useApiMutation<Class>(
    editingItem ? `/api/v1/classes/${editingItem.id}` : '/api/v1/classes',
    'PATCH'
  );

  const { execute: deleteClass, loading: isDeleting } = useApiMutation<void>(
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
        grade_level: formData.grade_level || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
      };

      if (editingItem) {
        await updateClass(payload);
      } else {
        await createClass(payload);
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        grade_level: '',
        capacity: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || `Failed to ${editingItem ? 'update' : 'create'} class` });
    }
  };

  const handleEdit = (item: Class) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      grade_level: item.grade_level || '',
      capacity: item.capacity?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: Class) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteClass(undefined, `/api/v1/classes/${item.id}`);
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to delete class' });
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
      key: 'grade_level' as const,
      label: t('gradeLevel'),
      render: (value: string) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'capacity' as const,
      label: t('maxCapacity'),
      render: (value: number) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'actions' as const,
      label: tc('actions'),
      render: (_, item: Class) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            className="h-8 w-8 p-0"
            title={tc('edit')}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
            title={tc('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
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
                {t('title')}
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null);
          setFormData({
            name: '',
            description: '',
            grade_level: '',
            capacity: '',
          });
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editClass') : t('addClass')}</DialogTitle>
            <DialogDescription>
              {editingItem ? t('editClassDescription') : t('addClassDescription')}
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
              label={t('gradeLevel')}
              error={errors.grade_level}
            >
              <Input
                name="grade_level"
                placeholder="e.g., Kindergarten"
                value={formData.grade_level}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={t('maxCapacity')}
              error={errors.capacity}
            >
              <Input
                name="capacity"
                type="number"
                placeholder="e.g., 15"
                value={formData.capacity}
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
              onClick={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
                setFormData({
                  name: '',
                  description: '',
                  grade_level: '',
                  capacity: '',
                });
              }}
              disabled={isSubmitting || isUpdating}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUpdating}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {isSubmitting || isUpdating ? t('creating') : (editingItem ? t('saveChanges') : t('addClass'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Allergy {
  id: string;
  name: string;
  description?: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  category: 'food' | 'drug' | 'environmental' | 'other';
  notes?: string;
}

interface AllergiesResponse {
  data: Allergy[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const SEVERITY_BADGE_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  mild: 'success',
  moderate: 'warning',
  severe: 'destructive',
  life_threatening: 'destructive',
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200',
  moderate: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
  severe: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200',
  life_threatening: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200',
};

export default function AllergiesPage() {
  const t = useTranslations('allergies');
  const tc = useTranslations('common');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'mild' as const,
    category: 'food' as const,
    notes: '',
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

  const { data: response, loading, error, refetch } = useApiQuery<AllergiesResponse>(
    `/api/v1/allergies?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const { execute: createAllergy, loading: isSubmitting } = useApiMutation<Allergy>(
    '/api/v1/allergies',
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
      newErrors.name = 'Allergy name is required';
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
        severity: formData.severity,
        category: formData.category,
        notes: formData.notes || undefined,
      };

      await createAllergy(payload);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        severity: 'mild',
        category: 'food',
        notes: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to create allergy' });
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: tc('name'),
      render: (value: string, item: Allergy) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'category' as const,
      label: t('category') || 'Category',
      render: (value: string) => (
        <Badge variant="secondary" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'severity' as const,
      label: t('severity'),
      render: (value: string) => {
        const severityLabel = value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return (
          <Badge className={`capitalize ${SEVERITY_COLORS[value]}`} variant="outline">
            {severityLabel}
          </Badge>
        );
      },
    },
    {
      key: 'description' as const,
      label: tc('description'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate">{value || '—'}</span>
      ),
    },
  ];

  const rowActions = (item: Allergy) => [
    {
      label: tc('edit'),
      icon: Edit2,
      onClick: () => {
        // Edit functionality would go here
        console.log('Edit allergy:', item.id);
      },
    },
    {
      label: tc('delete'),
      icon: Trash2,
      onClick: () => {
        // Delete functionality would go here
        console.log('Delete allergy:', item.id);
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
          className="gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        >
          <Plus className="w-4 h-4" />
          {t('addAllergy')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} allergies defined
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
                  Failed to load allergies. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                emptyMessage={t('noAllergies')}
                rowKey={(allergy) => allergy.id}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Allergy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addAllergy')}</DialogTitle>
            <DialogDescription>
              {t('addAllergyDescription') || 'Add a new allergy definition to your nursery catalog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField
              label={t('allergyName') || 'Allergy Name'}
              required
              error={errors.name}
            >
              <Input
                name="name"
                placeholder="e.g., Peanut Allergy"
                value={formData.name}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={tc('description')}
              error={errors.description}
            >
              <Input
                name="description"
                placeholder="e.g., Allergic reaction to peanuts"
                value={formData.description}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={t('category') || 'Category'}
              error={errors.category}
            >
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="food">{t('food') || 'Food'}</option>
                <option value="drug">{t('drug') || 'Drug'}</option>
                <option value="environmental">{t('environmental') || 'Environmental'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </Select>
            </FormField>

            <FormField
              label={t('severity')}
              error={errors.severity}
            >
              <Select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
              >
                <option value="mild">{t('mild')}</option>
                <option value="moderate">{t('moderate')}</option>
                <option value="severe">{t('severe')}</option>
                <option value="life_threatening">{t('lifeThreatening')}</option>
              </Select>
            </FormField>

            <FormField
              label={tc('notes')}
              error={errors.notes}
            >
              <Textarea
                name="notes"
                placeholder="Additional notes about this allergy"
                value={formData.notes}
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
              disabled={isSubmitting}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              {isSubmitting ? tc('loading') : t('addAllergy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

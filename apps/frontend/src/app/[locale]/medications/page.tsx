'use client';

import React, { useState, useEffect } from 'react';
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
import { Plus, Search, Pill, Edit2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Medication {
  id: string;
  name: string;
  generic_name?: string;
  dosage_form?: string;
  default_dosage?: string;
  instructions?: string;
  requires_authorization?: boolean;
  is_active: boolean;
}

interface MedicationsResponse {
  data: Medication[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function MedicationsPage() {
  const t = useTranslations('medications');
  const tc = useTranslations('common');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    dosage_form: '',
    default_dosage: '',
    instructions: '',
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

  const { data: response, loading, error, refetch } = useApiQuery<MedicationsResponse>(
    `/api/v1/medications?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const { execute: createMedication, loading: isSubmitting } = useApiMutation<Medication>(
    '/api/v1/medications',
    'POST'
  );

  const { execute: updateMedication, loading: isUpdating } = useApiMutation<Medication>(
    editingItem ? `/api/v1/medications/${editingItem.id}` : '/api/v1/medications',
    'PATCH'
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
      newErrors.name = 'Medication name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditClick = (medication: Medication) => {
    setEditingItem(medication);
    setFormData({
      name: medication.name,
      generic_name: medication.generic_name || '',
      dosage_form: medication.dosage_form || '',
      default_dosage: medication.default_dosage || '',
      instructions: medication.instructions || '',
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDeactivateClick = async (medication: Medication) => {
    if (!window.confirm(`Are you sure you want to deactivate "${medication.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/medications/${medication.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate medication');
      }

      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to deactivate medication' });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        generic_name: formData.generic_name || undefined,
        dosage_form: formData.dosage_form || undefined,
        default_dosage: formData.default_dosage || undefined,
        instructions: formData.instructions || undefined,
      };

      if (editingItem) {
        await updateMedication(payload);
      } else {
        await createMedication(payload);
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        generic_name: '',
        dosage_form: '',
        default_dosage: '',
        instructions: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to save medication' });
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: tc('name'),
      render: (value: string, item: Medication) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            <Pill className="w-4 h-4" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'generic_name' as const,
      label: t('genericName'),
      render: (value: string) => (
        <span className="text-muted-foreground">{value || '—'}</span>
      ),
    },
    {
      key: 'dosage_form' as const,
      label: t('dosageForm'),
      render: (value: string) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'default_dosage' as const,
      label: t('defaultDosage') || 'Default Dosage',
      render: (value: string) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'is_active' as const,
      label: tc('status'),
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? tc('active') : tc('inactive')}
        </Badge>
      ),
    },
  ];

  const rowActions = (item: Medication) => [
    {
      label: tc('edit'),
      icon: Edit2,
      onClick: () => handleEditClick(item),
    },
    {
      label: t('deactivate') || 'Deactivate',
      icon: X,
      onClick: () => handleDeactivateClick(item),
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
          {t('addMedication')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('medicationsInCatalog', {
                  count: response?.pagination?.total || 0,
                })}
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
                  Failed to load medications. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                emptyMessage={t('noMedications')}
                rowKey={(medication) => medication.id}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Medication Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setFormData({
              name: '',
              generic_name: '',
              dosage_form: '',
              default_dosage: '',
              instructions: '',
            });
            setErrors({});
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('editMedication') || 'Edit Medication' : t('addMedication')}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? t('editMedicationDescription') || 'Update medication details'
                : t('addMedicationDescription') || 'Add a new medication to your nursery catalog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField
              label={t('medicationName')}
              required
              error={errors.name}
            >
              <Input
                name="name"
                placeholder="e.g., Paracetamol"
                value={formData.name}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={t('genericName')}
              error={errors.generic_name}
            >
              <Input
                name="generic_name"
                placeholder="e.g., Acetaminophen"
                value={formData.generic_name}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={t('dosageForm')}
              error={errors.dosage_form}
            >
              <Select
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleInputChange}
              >
                <option value="">{t('selectDosageForm') || 'Select dosage form'}</option>
                <option value="tablet">{t('tablet') || 'Tablet'}</option>
                <option value="capsule">{t('capsule') || 'Capsule'}</option>
                <option value="liquid">{t('liquid') || 'Liquid'}</option>
                <option value="injection">{t('injection') || 'Injection'}</option>
                <option value="topical">{t('topical') || 'Topical'}</option>
                <option value="inhaler">{t('inhaler') || 'Inhaler'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </Select>
            </FormField>

            <FormField
              label={t('defaultDosage') || 'Default Dosage'}
              error={errors.default_dosage}
            >
              <Input
                name="default_dosage"
                placeholder="e.g., 500mg twice daily"
                value={formData.default_dosage}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label={t('instructions') || 'Instructions'}
              error={errors.instructions}
            >
              <Textarea
                name="instructions"
                placeholder="Administration instructions and notes"
                value={formData.instructions}
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
              {isSubmitting || isUpdating ? tc('loading') : editingItem ? t('save') || 'Save' : t('addMedication')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

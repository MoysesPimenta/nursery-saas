'use client';

import { useState, useEffect } from 'react';
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
  strength?: string;
  manufacturer?: string;
  notes?: string;
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
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    dosage_form: '',
    strength: '',
    manufacturer: '',
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

  const { data: response, loading, error, refetch } = useApiQuery<MedicationsResponse>(
    `/api/v1/medications?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const { execute: createMedication, loading: isSubmitting } = useApiMutation<Medication>(
    '/api/v1/medications',
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
      newErrors.name = 'Medication name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        generic_name: formData.generic_name || undefined,
        dosage_form: formData.dosage_form || undefined,
        strength: formData.strength || undefined,
        manufacturer: formData.manufacturer || undefined,
        notes: formData.notes || undefined,
      };

      await createMedication(payload);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        generic_name: '',
        dosage_form: '',
        strength: '',
        manufacturer: '',
        notes: '',
      });
      await refetch();
    } catch (err) {
      setErrors({ submit: (err as Error).message || 'Failed to create medication' });
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
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
      label: 'Generic Name',
      render: (value: string) => (
        <span className="text-muted-foreground">{value || '—'}</span>
      ),
    },
    {
      key: 'dosage_form' as const,
      label: 'Dosage Form',
      render: (value: string) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'strength' as const,
      label: 'Strength',
      render: (value: string) => (
        <span className="text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'is_active' as const,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const rowActions = (item: Medication) => [
    {
      label: 'Edit',
      icon: Edit2,
      onClick: () => {
        // Edit functionality would go here
        console.log('Edit medication:', item.id);
      },
    },
    {
      label: 'Deactivate',
      icon: X,
      onClick: () => {
        // Deactivate functionality would go here
        console.log('Deactivate medication:', item.id);
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
          <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground mt-1">Manage medication catalog for your nursery</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" />
                All Medications
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} medications in catalog
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
                placeholder="Search by name..."
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
                emptyMessage="No medications found"
                rowKey={(medication) => medication.id}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Medication Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>
              Add a new medication to your nursery catalog
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField
              label="Medication Name"
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
              label="Generic Name"
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
              label="Dosage Form"
              error={errors.dosage_form}
            >
              <Select
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleInputChange}
              >
                <option value="">Select dosage form</option>
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="liquid">Liquid</option>
                <option value="injection">Injection</option>
                <option value="topical">Topical</option>
                <option value="inhaler">Inhaler</option>
                <option value="other">Other</option>
              </Select>
            </FormField>

            <FormField
              label="Strength"
              error={errors.strength}
            >
              <Input
                name="strength"
                placeholder="e.g., 500mg"
                value={formData.strength}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label="Manufacturer"
              error={errors.manufacturer}
            >
              <Input
                name="manufacturer"
                placeholder="e.g., Pharma Corp"
                value={formData.manufacturer}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField
              label="Notes"
              error={errors.notes}
            >
              <Textarea
                name="notes"
                placeholder="Additional notes about this medication"
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
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isSubmitting ? 'Creating...' : 'Add Medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

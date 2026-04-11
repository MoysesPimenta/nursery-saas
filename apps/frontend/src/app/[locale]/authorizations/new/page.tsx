'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Check, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  class_name?: string;
}

export default function NewAuthorizationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('authorizations');

  const [formData, setFormData] = useState({
    childId: '',
    symptoms: '',
    notes: '',
    priority: 'normal',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successId, setSuccessId] = useState<string | null>(null);

  // Fetch children
  const { data: childrenData, loading: childrenLoading } = useApiQuery<{
    data: Child[];
  }>('/api/v1/children?status=active&limit=100');

  const children = childrenData?.data || [];

  // Create authorization mutation
  const { execute: createAuth, loading: isCreating, error: createError } =
    useApiMutation<{ id: string }>('/api/v1/authorizations', 'POST');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.childId) newErrors.childId = 'Child is required';
    if (!formData.symptoms?.trim()) newErrors.symptoms = 'Reason/symptoms are required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        child_id: formData.childId,
        symptoms: formData.symptoms,
        notes: formData.notes || undefined,
        priority: formData.priority,
      };

      const result = await createAuth(payload);
      setSuccessId(result.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create authorization';
      setErrors({ submit: message });
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${locale}/authorizations`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            {t('newAuthorization', { defaultValue: 'New Authorization' })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('newAuthSubtitle', { defaultValue: 'Authorize a child to visit the nursery for medical attention' })}
          </p>
        </div>
      </div>

      {/* Error Alerts */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createError.message || 'Failed to create authorization'}
          </AlertDescription>
        </Alert>
      )}

      {errors.submit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('childAndPriority', { defaultValue: 'Child & Priority' })}</CardTitle>
            <CardDescription>
              {t('selectChildForAuth', { defaultValue: 'Select the child and set the urgency level' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t('selectChild', { defaultValue: 'Child' })} error={errors.childId} required>
              <Select
                name="childId"
                value={formData.childId}
                onChange={handleChange}
                disabled={childrenLoading}
              >
                <option value="">
                  {childrenLoading ? 'Loading...' : 'Select a child'}
                </option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                    {child.class_name && ` (${child.class_name})`}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('priority', { defaultValue: 'Priority' })}>
              <Select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="normal">{t('normal', { defaultValue: 'Normal' })}</option>
                <option value="urgent">{t('urgent', { defaultValue: 'Urgent' })}</option>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reasonDetails', { defaultValue: 'Reason & Details' })}</CardTitle>
            <CardDescription>
              {t('describeSymptoms', { defaultValue: 'Describe why this child needs nursery authorization' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t('symptoms', { defaultValue: 'Reason / Symptoms' })} error={errors.symptoms} required>
              <Textarea
                name="symptoms"
                placeholder={t('symptomsPlaceholder', { defaultValue: 'e.g., Headache and mild fever, complaining of stomach pain...' })}
                value={formData.symptoms}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>

            <FormField label={t('notes', { defaultValue: 'Additional Notes' })}>
              <Textarea
                name="notes"
                placeholder={t('notesPlaceholder', { defaultValue: 'Any additional information for the nurse...' })}
                value={formData.notes}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/authorizations`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" disabled={isCreating} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <ShieldCheck className="w-4 h-4" />
            {isCreating ? t('creating', { defaultValue: 'Creating...' }) : t('createAuthorization', { defaultValue: 'Create Authorization' })}
          </Button>
        </div>
      </form>

      {/* Success Dialog */}
      <Dialog open={!!successId} onOpenChange={(open) => !open && router.push(`/${locale}/authorizations`)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              {t('successTitle', { defaultValue: 'Authorization Created' })}
            </DialogTitle>
            <DialogDescription>
              {t('authSuccessDesc', { defaultValue: 'The child has been authorized for a nursery visit. A nurse will be notified.' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Authorization ID:</p>
              <p className="font-mono text-sm font-medium text-foreground">
                {successId}
              </p>
            </div>
            <Button
              onClick={() => router.push(`/${locale}/authorizations`)}
              className="w-full"
            >
              {t('viewAll', { defaultValue: 'View All Authorizations' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

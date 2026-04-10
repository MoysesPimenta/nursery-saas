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
import { Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const authorizationSchema = z.object({
  childId: z.string().min(1, 'Child is required'),
  authorizationType: z.enum(['medication_administration', 'treatment', 'emergency_care', 'field_trip_medical']),
  medicationName: z.string().optional(),
  dosageInfo: z.string().optional(),
  specialInstructions: z.string().optional(),
  priority: z.enum(['normal', 'urgent']),
  expiresAt: z.string().optional(),
});

type AuthorizationFormData = z.infer<typeof authorizationSchema>;

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

  const [formData, setFormData] = useState<Partial<AuthorizationFormData>>({
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
    if (!formData.authorizationType) newErrors.authorizationType = 'Authorization type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // Build notes from treatment details
      const treatmentDetails = [];
      if (formData.medicationName) treatmentDetails.push(`Medication: ${formData.medicationName}`);
      if (formData.dosageInfo) treatmentDetails.push(`Dosage: ${formData.dosageInfo}`);
      if (formData.specialInstructions) treatmentDetails.push(`Instructions: ${formData.specialInstructions}`);

      const payload = {
        child_id: formData.childId!,
        symptoms: formData.authorizationType!,
        notes: treatmentDetails.join('\n'),
        priority: formData.priority!,
        expires_at: formData.expiresAt || null,
      };

      const result = await createAuth(payload);
      setSuccessId(result.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('createError', { defaultValue: 'Failed to create authorization' });
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
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createError.message || t('createError', { defaultValue: 'Failed to create authorization' })}
          </AlertDescription>
        </Alert>
      )}

      {errors.submit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit || t('createError', { defaultValue: 'An error occurred' })}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('childAuthType')}</CardTitle>
          <CardDescription>
            {t('selectChildDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label={t('selectChild')} error={errors.childId} required>
              <Select
                name="childId"
                value={formData.childId || ''}
                onChange={handleChange}
                disabled={childrenLoading}
              >
                <option value="">
                  {childrenLoading ? t('loading', { defaultValue: 'Loading...' }) : t('selectChildOption', { defaultValue: 'Select a child' })}
                </option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                    {child.class_name && ` (${child.class_name})`}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('authorizationType')} error={errors.authorizationType} required>
              <Select name="authorizationType" value={formData.authorizationType || ''} onChange={handleChange}>
                <option value="">{t('selectType', { defaultValue: 'Select type' })}</option>
                <option value="medication_administration">{t('medicationAdministration', { defaultValue: 'Medication Administration' })}</option>
                <option value="treatment">{t('treatment', { defaultValue: 'Treatment' })}</option>
                <option value="emergency_care">{t('emergencyCare', { defaultValue: 'Emergency Care' })}</option>
                <option value="field_trip_medical">{t('fieldTripMedical', { defaultValue: 'Field Trip Medical' })}</option>
              </Select>
            </FormField>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('treatmentDetails')}</CardTitle>
          <CardDescription>
            {t('treatmentDetailsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label={t('medicationName', { defaultValue: 'Medication/Treatment Name' })}>
              <Input
                name="medicationName"
                placeholder={t('enterMedicationName', { defaultValue: 'e.g., Ibuprofen, Physical Therapy' })}
                value={formData.medicationName || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('dosageInfo', { defaultValue: 'Dosage/Administration Info' })}>
              <Input
                name="dosageInfo"
                placeholder={t('enterDosageInfo', { defaultValue: 'e.g., 200mg twice daily' })}
                value={formData.dosageInfo || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('specialInstructions', { defaultValue: 'Special Instructions' })}>
              <Textarea
                name="specialInstructions"
                placeholder={t('enterInstructions', { defaultValue: 'Any special instructions or notes...' })}
                value={formData.specialInstructions || ''}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </FormField>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('additionalInfo')}</CardTitle>
          <CardDescription>
            {t('priorityAndExpiration')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label={t('priority')}>
              <Select name="priority" value={formData.priority || 'normal'} onChange={handleChange}>
                <option value="normal">{t('normal')}</option>
                <option value="urgent">{t('urgent')}</option>
              </Select>
            </FormField>

            <FormField label={t('expirationDate')}>
              <Input
                name="expiresAt"
                type="date"
                value={formData.expiresAt || ''}
                onChange={handleChange}
              />
            </FormField>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/authorizations`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button onClick={handleSubmit} disabled={isCreating}>
          {isCreating ? t('creating', { defaultValue: 'Creating...' }) : t('createButton', { defaultValue: 'Create Authorization' })}
        </Button>
      </div>

      {/* Success Dialog */}
      <Dialog open={!!successId} onOpenChange={(open) => !open && router.push(`/${locale}/authorizations`)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              {t('successTitle', { defaultValue: 'Authorization Created' })}
            </DialogTitle>
            <DialogDescription>
              {t('successDesc', { defaultValue: 'The authorization has been successfully created.' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('successMessage', { defaultValue: 'The authorized person has been added to the system.' })}
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t('idLabel', { defaultValue: 'Authorization ID:' })}</p>
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

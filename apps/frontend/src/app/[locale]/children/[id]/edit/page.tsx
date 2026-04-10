'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormField } from '@/components/ui/form-field';
import { PageLoading } from '@/components/ui/loading';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const childSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  classId: z.string().optional(),
  bloodType: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelation: z.string().optional(),
  notes: z.string().optional(),
});

type ChildFormData = z.infer<typeof childSchema>;

// API returns snake_case from Supabase
interface ChildDetail {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id?: string;
  blood_type?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string;
  notes?: string;
}

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('children');
  const locale = params.locale as string;
  const childId = params.id as string;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<ChildFormData>>({});

  // Fetch child data
  const { data: child, loading: loadingChild } = useApiQuery<ChildDetail>(
    `/api/v1/children/${childId}`
  );

  // Fetch classes
  const { data: classesData } = useApiQuery<{ data: Array<{ id: string; name: string }> }>(
    '/api/v1/classes'
  );
  const classes = classesData?.data || [];

  // Initialize form data when child data is loaded (map snake_case → camelCase for form)
  const [initialized, setInitialized] = useState(false);
  if (child && !initialized) {
    setFormData({
      firstName: child.first_name,
      lastName: child.last_name,
      dateOfBirth: child.date_of_birth,
      gender: child.gender,
      classId: child.class_id,
      bloodType: child.blood_type,
      emergencyContactName: child.emergency_contact_name,
      emergencyContactPhone: child.emergency_contact_phone,
      emergencyContactRelation: child.emergency_contact_relation,
      notes: child.notes,
    });
    setInitialized(true);
  }

  const { execute: updateChild, loading: saving } = useApiMutation<{ id: string }>(
    `/api/v1/children/${childId}`,
    'PATCH'
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.emergencyContactName)
      newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactPhone)
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Convert camelCase form fields to snake_case for the API
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        class_id: formData.classId || null,
        blood_type: formData.bloodType || null,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relation: formData.emergencyContactRelation || null,
        notes: formData.notes || null,
      };
      await updateChild(payload);
      router.push(`/${locale}/children/${childId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update child';
      setErrors({ submit: message });
    }
  };

  if (loadingChild) {
    return <PageLoading />;
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Child not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/children`)}
          className="mt-4"
        >
          Back to Children
        </Button>
      </div>
    );
  }

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
          onClick={() => router.push(`/${locale}/children/${childId}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('editChild')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('updateInfo', { name: `${child.first_name} ${child.last_name}` })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('personalInfo')}</CardTitle>
          <CardDescription>
            {t('updateChildProfile')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('firstName')} error={errors.firstName} required>
                <Input
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label={t('lastName')} error={errors.lastName} required>
                <Input
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label={t('dateOfBirth')} error={errors.dateOfBirth} required>
              <Input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('gender')} error={errors.gender} required>
              <Select
                name="gender"
                value={formData.gender || 'M'}
                onChange={handleChange}
              >
                <option value="M">{t('male')}</option>
                <option value="F">{t('female')}</option>
                <option value="O">{t('other')}</option>
                <option value="Prefer not to say">{t('preferNotToSay')}</option>
              </Select>
            </FormField>

            <FormField label={t('class')}>
              <Select name="classId" value={formData.classId || ''} onChange={handleChange}>
                <option value="">{t('selectClass')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('bloodType')}>
              <Select name="bloodType" value={formData.bloodType || ''} onChange={handleChange}>
                <option value="">{t('selectBloodType')}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('emergencyContactMedical')}</CardTitle>
          <CardDescription>
            {t('emergencyContactDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <FormField
              label={t('emergencyContactName')}
              error={errors.emergencyContactName}
              required
            >
              <Input
                name="emergencyContactName"
                placeholder="Parent/Guardian Name"
                value={formData.emergencyContactName || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField
              label={t('emergencyContactPhone')}
              error={errors.emergencyContactPhone}
              required
            >
              <PhoneInput
                name="emergencyContactPhone"
                placeholder="11 99999-9999"
                value={formData.emergencyContactPhone || ''}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, emergencyContactPhone: value }));
                  if (errors.emergencyContactPhone) {
                    setErrors((prev) => ({ ...prev, emergencyContactPhone: '' }));
                  }
                }}
              />
            </FormField>

            <FormField label={t('relationship')}>
              <Input
                name="emergencyContactRelation"
                placeholder="e.g., Mother, Father, Guardian"
                value={formData.emergencyContactRelation || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('additionalNotes')}>
              <Textarea
                name="notes"
                placeholder="Any additional medical information or special notes..."
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/children/${childId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </motion.div>
  );
}

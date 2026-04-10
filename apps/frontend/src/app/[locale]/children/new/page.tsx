'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

export default function NewChildPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<ChildFormData>>({
    gender: 'male',
  });

  const { execute: createChild, loading } = useApiMutation<{ id: string }>(
    '/api/v1/children',
    'POST'
  );

  // Fetch classes from API instead of hardcoding
  const { data: classesData } = useApiQuery<{ data: Array<{ id: string; name: string }> }>(
    '/api/v1/classes'
  );
  const classes = classesData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    } else if (step === 1) {
      if (!formData.emergencyContactName)
        newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone)
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      // Convert camelCase form fields to snake_case for the API
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        class_id: formData.classId || undefined,
        blood_type: formData.bloodType || undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relation: formData.emergencyContactRelation || undefined,
        notes: formData.notes || undefined,
      };
      const result = await createChild(payload);
      router.push(`/${locale}/children/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create child';
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Child</h1>
        <p className="text-muted-foreground mt-1">
          Create a new child profile in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step + 1} of 2</CardTitle>
          <CardDescription>
            {step === 0 ? 'Personal Information' : 'Emergency Contact & Medical'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            {step === 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" error={errors.firstName} required>
                    <Input
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                    />
                  </FormField>
                  <FormField label="Last Name" error={errors.lastName} required>
                    <Input
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField label="Date of Birth" error={errors.dateOfBirth} required>
                  <Input
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Gender" error={errors.gender} required>
                  <Select
                    name="gender"
                    value={formData.gender || 'male'}
                    onChange={handleChange}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </FormField>

                <FormField label="Class">
                  <Select name="classId" value={formData.classId || ''} onChange={handleChange}>
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Blood Type">
                  <Select name="bloodType" value={formData.bloodType || ''} onChange={handleChange}>
                    <option value="">Select blood type</option>
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
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FormField
                  label="Emergency Contact Name"
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
                  label="Emergency Contact Phone"
                  error={errors.emergencyContactPhone}
                  required
                >
                  <Input
                    name="emergencyContactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.emergencyContactPhone || ''}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Relationship">
                  <Input
                    name="emergencyContactRelation"
                    placeholder="e.g., Mother, Father, Guardian"
                    value={formData.emergencyContactRelation || ''}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Additional Notes">
                  <Textarea
                    name="notes"
                    placeholder="Any additional medical information or special notes..."
                    value={formData.notes || ''}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </FormField>
              </motion.div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 0 || loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {step === 0 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Child'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

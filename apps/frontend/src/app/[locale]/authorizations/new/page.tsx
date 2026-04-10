'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  type: z.enum(['pickup', 'medical', 'field_trip', 'medication_administration']),
  authorizedPersonName: z.string().min(1, 'Authorized person name is required'),
  authorizedPersonPhone: z.string().min(1, 'Phone number is required'),
  relationship: z.enum(['parent', 'guardian', 'relative', 'emergency_contact', 'other']),
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
  priority: z.enum(['normal', 'urgent']),
});

type AuthorizationFormData = z.infer<typeof authorizationSchema>;

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
}

export default function NewAuthorizationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

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
    useApiMutation<{ data: { id: string } }>('/api/v1/authorizations', 'POST');

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
    if (!formData.type) newErrors.type = 'Authorization type is required';
    if (!formData.authorizedPersonName)
      newErrors.authorizedPersonName = 'Authorized person name is required';
    if (!formData.authorizedPersonPhone)
      newErrors.authorizedPersonPhone = 'Phone number is required';
    if (!formData.relationship) newErrors.relationship = 'Relationship is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // Transform camelCase to snake_case for API
      const payload = {
        child_id: formData.childId!,
        title: formData.type!,
        description: formData.notes,
        priority: formData.priority!,
      };

      const result = await createAuth(payload);
      setSuccessId(result.data.id);
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
          <h1 className="text-2xl font-bold tracking-tight">Create Authorization</h1>
          <p className="text-muted-foreground mt-1">
            Grant authorization for a person to perform an action for a child
          </p>
        </div>
      </div>

      {/* Error Alert */}
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

      <Card>
        <CardHeader>
          <CardTitle>Child & Authorization Type</CardTitle>
          <CardDescription>
            Select the child and the type of authorization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Child" error={errors.childId} required>
                <Select
                  name="childId"
                  value={formData.childId || ''}
                  onChange={handleChange}
                  disabled={childrenLoading}
                >
                  <option value="">
                    {childrenLoading ? 'Loading...' : 'Select a child'}
                  </option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                      {child.className && ` (${child.className})`}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Authorization Type" error={errors.type} required>
                <Select name="type" value={formData.type || ''} onChange={handleChange}>
                  <option value="">Select type</option>
                  <option value="pickup">Pickup</option>
                  <option value="medical">Medical</option>
                  <option value="field_trip">Field Trip</option>
                  <option value="medication_administration">Medication Administration</option>
                </Select>
              </FormField>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Person Details</CardTitle>
          <CardDescription>
            Information about the person being authorized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Authorized Person Name" error={errors.authorizedPersonName} required>
              <Input
                name="authorizedPersonName"
                placeholder="Full name"
                value={formData.authorizedPersonName || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Phone Number" error={errors.authorizedPersonPhone} required>
              <Input
                name="authorizedPersonPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.authorizedPersonPhone || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Relationship" error={errors.relationship} required>
              <Select name="relationship" value={formData.relationship || ''} onChange={handleChange}>
                <option value="">Select relationship</option>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="relative">Relative</option>
                <option value="emergency_contact">Emergency Contact</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Notes and expiration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Notes">
              <Textarea
                name="notes"
                placeholder="Any additional information or special instructions..."
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>

            <FormField label="Expiration Date">
              <Input
                name="expiresAt"
                type="date"
                value={formData.expiresAt || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Priority">
              <Select name="priority" value={formData.priority || 'normal'} onChange={handleChange}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
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
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Authorization'}
        </Button>
      </div>

      {/* Success Dialog */}
      <Dialog open={!!successId} onOpenChange={(open) => !open && router.push(`/${locale}/authorizations`)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              Authorization Created
            </DialogTitle>
            <DialogDescription>
              The authorization has been successfully created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              The authorized person has been added to the system.
            </p>
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
              View All Authorizations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

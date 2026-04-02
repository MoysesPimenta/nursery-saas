'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
}

interface CreateAuthorizationPayload {
  childId: string;
  symptoms: string;
  priority: 'normal' | 'urgent';
  notes?: string;
}

export default function NewAuthorizationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [childId, setChildId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successId, setSuccessId] = useState<string | null>(null);

  // Fetch children (filtered to teacher's class)
  const { data: childrenData, loading: childrenLoading } = useApiQuery<{
    data: Child[];
  }>('/api/v1/children?status=active&limit=100');

  const children = childrenData?.data || [];

  // Create authorization mutation
  const { execute: createAuth, loading: isCreating, error: createError } =
    useApiMutation<{ data: { id: string } }>('/api/v1/authorizations', 'POST');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!childId) {
      newErrors.childId = 'Please select a child';
    }
    if (!symptoms.trim()) {
      newErrors.symptoms = 'Please describe the symptoms';
    }
    if (symptoms.trim().length < 10) {
      newErrors.symptoms = 'Please provide more detail about the symptoms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await createAuth({
        childId,
        symptoms,
        priority,
        notes: notes || undefined,
      } as CreateAuthorizationPayload);

      setSuccessId(result.data.id);
      // Reset form
      setChildId('');
      setSymptoms('');
      setPriority('normal');
      setNotes('');
      setErrors({});
    } catch (error) {
      console.error('Failed to create authorization:', error);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request Authorization</h1>
        <p className="text-muted-foreground mt-1">
          Request parent pickup authorization for a child
        </p>
      </div>

      {/* Error Alert */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createError.message || 'Failed to create authorization request'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Child Information</CardTitle>
          <CardDescription>Select the child and describe their condition</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Selection */}
            <div>
              <label htmlFor="childId" className="text-sm font-medium text-foreground">
                Select Child *
              </label>
              <select
                id="childId"
                value={childId}
                onChange={(e) => {
                  setChildId(e.target.value);
                  if (errors.childId) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.childId;
                      return newErrors;
                    });
                  }
                }}
                disabled={childrenLoading}
                className={`w-full mt-1 px-3 py-2 border rounded-md text-sm bg-white dark:bg-slate-950 dark:border-border ${
                  errors.childId ? 'border-red-500' : 'border-border'
                }`}
              >
                <option value="">
                  {childrenLoading ? 'Loading children...' : 'Choose a child...'}
                </option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                    {child.className && ` (${child.className})`}
                  </option>
                ))}
              </select>
              {errors.childId && (
                <p className="text-xs text-red-600 mt-1">{errors.childId}</p>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label htmlFor="symptoms" className="text-sm font-medium text-foreground">
                Symptoms/Reason *
              </label>
              <Textarea
                id="symptoms"
                placeholder="Describe the child's symptoms or condition..."
                value={symptoms}
                onChange={(e) => {
                  setSymptoms(e.target.value);
                  if (errors.symptoms) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.symptoms;
                      return newErrors;
                    });
                  }
                }}
                rows={4}
                className={`mt-1 ${errors.symptoms ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between items-start mt-1">
                {errors.symptoms && (
                  <p className="text-xs text-red-600">{errors.symptoms}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {symptoms.length} characters
                </p>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Priority
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={priority === 'normal'}
                    onChange={() => setPriority('normal')}
                    className="rounded-full"
                  />
                  <span className="text-sm">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={priority === 'urgent'}
                    onChange={() => setPriority('urgent')}
                    className="rounded-full"
                  />
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Urgent (Medical Attention Needed)
                  </span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="text-sm font-medium text-foreground">
                Additional Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the child's condition..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? 'Creating Request...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={!!successId} onOpenChange={(open) => !open && router.push(`/${locale}/authorizations`)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Check className="w-5 h-5" />
              Authorization Request Sent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your authorization request has been created successfully.
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Request ID:</p>
              <p className="font-mono text-sm font-medium text-foreground">
                {successId}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Parents will be notified to approve or reject this request.
            </p>
            <Button
              onClick={() => router.push(`/${locale}/authorizations`)}
            >
              View All Requests
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

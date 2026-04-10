'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VisitForm, type VisitFormData } from '@/components/visit-form';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface VisitCreationResponse {
  data: {
    id: string;
    visitNumber: string;
  };
}

export default function NewVisitPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const authorizationId = searchParams.get('authorizationId');
  const [createdVisitId, setCreatedVisitId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>();

  // Fetch authorization details if provided
  const { data: authData } = useApiQuery<{ data: { childName: string; childId: string } }>(
    authorizationId ? `/api/v1/authorizations/${authorizationId}` : '',
    [authorizationId]
  );

  useEffect(() => {
    if (authData?.data?.childName) {
      setChildName(authData.data.childName);
    }
  }, [authData]);

  // Fetch available children for dropdown
  const { data: childrenData } = useApiQuery<{
    data: Array<{ id: string; first_name: string; last_name: string }>;
  }>('/api/v1/children?limit=500');

  const availableChildren = childrenData?.data || [];

  // Fetch available medications
  const { data: medicationsData } = useApiQuery<{
    data: Array<{ id: string; name: string }>;
  }>('/api/v1/medications/catalog');

  const availableMedications = medicationsData?.data || [];

  // Create visit mutation
  const { execute: createVisit, loading: isCreating, error: createError } =
    useApiMutation<VisitCreationResponse>('/api/v1/visits', 'POST');

  const handleSubmitVisit = async (data: VisitFormData) => {
    try {
      // Transform camelCase to snake_case for API
      const payload = {
        child_id: data.childId,
        employee_id: data.employeeId,
        authorization_id: authorizationId || undefined,
        visit_type: data.visitType,
        chief_complaint: data.chiefComplaint,
        vitals: data.vitals,
        assessment: data.assessment,
        treatment: data.treatment,
        medications_administered: data.medications,
        disposition: data.disposition,
        parent_notified: data.notifyParent,
      };
      const result = await createVisit(payload);
      setCreatedVisitId(result.data.id);
    } catch (error) {
      console.error('Failed to create visit:', error);
      throw error;
    }
  };

  if (createdVisitId) {
    return (
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="mt-8">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Visit Created Successfully
            </h2>
            <p className="text-muted-foreground mb-6">
              The visit record has been saved to the system.
            </p>
            <div className="p-4 bg-muted rounded-lg mb-6">
              <p className="text-xs text-muted-foreground mb-1">Visit ID:</p>
              <p className="font-mono text-sm font-medium text-foreground">
                {createdVisitId}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/visits/${createdVisitId}`)}
              >
                View Visit
              </Button>
              <Button
                onClick={() => router.push(`/${locale}/visits`)}
              >
                Back to Visits
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Visit Record</h1>
        <p className="text-muted-foreground mt-1">
          {authorizationId
            ? 'Create visit from authorization request'
            : 'Log a new child visit'}
        </p>
      </div>

      {/* Error Alert */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createError.message || 'Failed to create visit'}
          </AlertDescription>
        </Alert>
      )}

      <VisitForm
        onSubmit={handleSubmitVisit}
        initialValues={
          authorizationId
            ? { authorizationId: authorizationId }
            : undefined
        }
        childName={childName}
        loading={isCreating}
        availableChildren={availableChildren}
        availableMedications={availableMedications}
      />
    </motion.div>
  );
}

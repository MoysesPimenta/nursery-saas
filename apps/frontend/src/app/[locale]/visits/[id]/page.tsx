'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VisitForm, type VisitFormData } from '@/components/visit-form';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { ArrowLeft, Edit2, Clock, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

interface Visit {
  id: string;
  child_id: string;
  employee_id?: string;
  visit_type: 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
  chief_complaint: string;
  vitals: any;
  assessment: string;
  treatment: string;
  medications_administered: any[];
  disposition: 'returned_to_class' | 'sent_home' | 'referred' | 'hospitalized';
  parent_notified: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
  nurse_id: string;
}

const visitTypeConfig = {
  authorization: { label: 'From Authorization', color: 'authorization' as const },
  walk_in: { label: 'Walk-in', color: 'walk_in' as const },
  scheduled: { label: 'Scheduled', color: 'scheduled' as const },
  emergency: { label: 'Emergency', color: 'emergency' as const },
};

const dispositionConfig = {
  returned_to_class: { label: 'Returned to Class', color: 'returned_to_class' as const },
  sent_home: { label: 'Sent Home', color: 'sent_home' as const },
  referred: { label: 'Referred', color: 'referred' as const },
  hospitalized: { label: 'Hospitalized', color: 'hospitalized' as const },
};

export default function VisitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('visits');
  const locale = params.locale as string;
  const visitId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [isEndingVisit, setIsEndingVisit] = useState(false);

  // Fetch visit details
  const { data: visitData, loading, refetch } = useApiQuery<{ data: Visit }>(
    `/api/v1/visits/${visitId}`
  );

  const visit = visitData?.data;

  // End visit mutation
  const { execute: endVisit, loading: isEnding } = useApiMutation<any>(
    `/api/v1/visits/${visitId}`,
    'PATCH'
  );

  // Update visit mutation
  const { execute: updateVisit, loading: isUpdating } = useApiMutation<any>(
    `/api/v1/visits/${visitId}`,
    'PATCH'
  );

  const handleEndVisit = async () => {
    try {
      setIsEndingVisit(true);
      await endVisit({ ended_at: new Date().toISOString() });
      await refetch();
      setIsEndingVisit(false);
    } catch (error) {
      console.error('Failed to end visit:', error);
      setIsEndingVisit(false);
    }
  };

  const handleUpdateVisit = async (data: VisitFormData) => {
    try {
      await updateVisit({
        ...data,
      });
      await refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update visit:', error);
      throw error;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading visit details...</div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/visits`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Visits
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Visit not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Button
          variant="outline"
          onClick={() => setIsEditing(false)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel Editing
        </Button>
        <VisitForm
          onSubmit={handleUpdateVisit}
          initialValues={visit as any}
          childName={visit.child_id}
          loading={isUpdating}
        />
      </motion.div>
    );
  }

  const duration = visit.ended_at
    ? Math.round((new Date(visit.ended_at).getTime() - new Date(visit.started_at).getTime()) / 60000)
    : null;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/visits`)}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{visit.child_id}</h1>
          </div>
          <div className="flex gap-2 ml-10 flex-wrap">
            <Badge variant={visitTypeConfig[visit.visit_type]?.color || 'default'}>
              {visitTypeConfig[visit.visit_type]?.label}
            </Badge>
            <Badge variant={dispositionConfig[visit.disposition]?.color || 'default'}>
              {dispositionConfig[visit.disposition]?.label}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          {!visit.ended_at && (
            <Button
              onClick={handleEndVisit}
              disabled={isEnding || isEndingVisit}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              {isEnding || isEndingVisit ? 'Ending...' : 'End Visit'}
            </Button>
          )}
        </div>
      </div>

      {/* Visit Meta */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('visitID')}</p>
              <p className="font-mono text-sm font-medium">{visit.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('date')}</p>
              <p className="text-sm font-medium">
                {new Date(visit.started_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('startTime')}</p>
              <p className="text-sm font-medium">
                {new Date(visit.started_at).toLocaleTimeString()}
              </p>
            </div>
            {visit.ended_at && (
              <div>
                <p className="text-xs text-muted-foreground">{t('duration')}</p>
                <p className="text-sm font-medium">{duration} {t('minutes')}</p>
              </div>
            )}
            {!visit.ended_at && (
              <div>
                <p className="text-xs text-muted-foreground">{t('status')}</p>
                <Badge variant="warning">{t('ongoing')}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaint */}
      <Card>
        <CardHeader>
          <CardTitle>{t('chiefComplaint')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{visit.chief_complaint}</p>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      {visit.vitals && (
        <Card>
          <CardHeader>
            <CardTitle>{t('vitals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visit.vitals.temperature && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('temperature')}</p>
                  <p className="text-sm font-medium">
                    {visit.vitals.temperature}°{visit.vitals.temperatureUnit}
                  </p>
                </div>
              )}
              {visit.vitals.systolicBP && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('bloodPressure')}</p>
                  <p className="text-sm font-medium">
                    {visit.vitals.systolicBP}/{visit.vitals.diastolicBP} mmHg
                  </p>
                </div>
              )}
              {visit.vitals.heartRate && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('heartRate')}</p>
                  <p className="text-sm font-medium">{visit.vitals.heartRate} bpm</p>
                </div>
              )}
              {visit.vitals.weight && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('weight')}</p>
                  <p className="text-sm font-medium">
                    {visit.vitals.weight} {visit.vitals.weightUnit}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment & Treatment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('assessment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">
              {visit.assessment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('treatment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">
              {visit.treatment}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Medications */}
      {visit.medications_administered && visit.medications_administered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('medicationsAdministered')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visit.medications_administered.map((med, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="font-medium text-foreground">
                    {med.medicationName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {med.dosage} at {med.time}
                  </div>
                  {med.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {med.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dispositionFollowup')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('disposition')}</p>
            <Badge variant={dispositionConfig[visit.disposition]?.color || 'default'}>
              {dispositionConfig[visit.disposition]?.label}
            </Badge>
          </div>
          {visit.parent_notified && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {t('parentNotificationSent')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

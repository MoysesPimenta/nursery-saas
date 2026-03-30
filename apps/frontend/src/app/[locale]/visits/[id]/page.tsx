'use client';

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
  childName: string;
  employeeName?: string;
  visitType: 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
  chiefComplaint: string;
  vitals: any;
  assessment: string;
  treatment: string;
  medications: any[];
  disposition: 'returned_to_class' | 'sent_home' | 'referred' | 'hospitalized';
  notifyParent: boolean;
  startTime: string;
  endTime?: string;
  createdAt: string;
  createdBy: string;
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
      await endVisit({ endedAt: new Date().toISOString() });
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
        <div className="text-slate-600 dark:text-slate-400">Loading visit details...</div>
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
            <p className="text-center text-slate-600 dark:text-slate-400">Visit not found</p>
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
          childName={visit.childName}
          loading={isUpdating}
        />
      </motion.div>
    );
  }

  const duration = visit.endTime
    ? Math.round((new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime()) / 60000)
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
            <h1 className="text-3xl font-bold tracking-tight">{visit.childName}</h1>
          </div>
          <div className="flex gap-2 ml-10 flex-wrap">
            <Badge variant={visitTypeConfig[visit.visitType]?.color || 'default'}>
              {visitTypeConfig[visit.visitType]?.label}
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
          {!visit.endTime && (
            <Button
              onClick={handleEndVisit}
              disabled={isEnding || isEndingVisit}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
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
              <p className="text-xs text-slate-600 dark:text-slate-400">Visit ID</p>
              <p className="font-mono text-sm font-medium">{visit.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Date</p>
              <p className="text-sm font-medium">
                {new Date(visit.startTime).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Start Time</p>
              <p className="text-sm font-medium">
                {new Date(visit.startTime).toLocaleTimeString()}
              </p>
            </div>
            {visit.endTime && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Duration</p>
                <p className="text-sm font-medium">{duration} minutes</p>
              </div>
            )}
            {!visit.endTime && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Status</p>
                <Badge variant="warning">Ongoing</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaint */}
      <Card>
        <CardHeader>
          <CardTitle>Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-900 dark:text-slate-50">{visit.chiefComplaint}</p>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      {visit.vitals && (
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visit.vitals.temperature && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Temperature</p>
                  <p className="text-sm font-medium">
                    {visit.vitals.temperature}°{visit.vitals.temperatureUnit}
                  </p>
                </div>
              )}
              {visit.vitals.systolicBP && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Blood Pressure</p>
                  <p className="text-sm font-medium">
                    {visit.vitals.systolicBP}/{visit.vitals.diastolicBP} mmHg
                  </p>
                </div>
              )}
              {visit.vitals.heartRate && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Heart Rate</p>
                  <p className="text-sm font-medium">{visit.vitals.heartRate} bpm</p>
                </div>
              )}
              {visit.vitals.weight && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Weight</p>
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
            <CardTitle>Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
              {visit.assessment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
              {visit.treatment}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Medications */}
      {visit.medications && visit.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medications Administered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visit.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-3"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-50">
                    {med.medicationName}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {med.dosage} at {med.time}
                  </div>
                  {med.notes && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
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
          <CardTitle>Disposition & Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Disposition</p>
            <Badge variant={dispositionConfig[visit.disposition]?.color || 'default'}>
              {dispositionConfig[visit.disposition]?.label}
            </Badge>
          </div>
          {visit.notifyParent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-50">
                Parent notification has been sent about this visit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

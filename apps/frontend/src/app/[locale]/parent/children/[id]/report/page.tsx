'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PrintLayout } from '@/components/print-layout';
import { Avatar } from '@/components/ui/avatar';
import { AllergyBadge } from '@/components/allergy-badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, AlertCircle, Loader } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface DetailedChild {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  class_id?: string;
  photo_url?: string;
  blood_type?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  allergies: Array<{
    id: string;
    name: string;
    severity_level: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    description?: string;
    created_at: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage_form?: string;
    default_dosage?: string;
  }>;
  visits: Array<{
    id: string;
    visit_type: string;
    chief_complaint: string;
    disposition: string;
    started_at: string;
    ended_at?: string;
    created_at: string;
  }>;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChildHealthReportPage() {
  const t = useTranslations('children');
  const params = useParams();
  const childId = params.id as string;
  const locale = params.locale as string;
  const [child, setChild] = useState<DetailedChild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChild() {
      try {
        setLoading(true);
        setError(null);

        const childData = await apiGet<DetailedChild>(`/api/v1/children/${childId}`);
        const visitsData = await apiGet<any[]>(
          `/api/v1/visits?child_id=${childId}`
        );

        setChild({
          ...childData,
          visits: visitsData || [],
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load child details'
        );
      } finally {
        setLoading(false);
      }
    }

    loadChild();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/parent/children/${childId}`}>
          <Button variant="ghost" className="gap-2 print-hide">
            <ArrowLeft className="w-4 h-4" />
            {t('backToDetails')}
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10 rounded-xl">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-900 dark:text-red-100">
              {error || 'Child not found'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const age = calculateAge(child.date_of_birth);
  const initials = getInitials(child.first_name, child.last_name);
  const today = formatDate(new Date().toISOString());
  const visitsByType = (child.visits || []).reduce(
    (acc, visit) => {
      const type = visit.visit_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <motion.div className="space-y-4">
      {/* Actions bar - hidden on print */}
      <motion.div className="print-hide flex items-center justify-between">
        <Link href={`/${locale}/parent/children/${childId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('backToDetails')}
          </Button>
        </Link>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          {t('printSaveAsPDF')}
        </Button>
      </motion.div>

      {/* Report Content */}
      <PrintLayout title={`Health Report: ${child.first_name} ${child.last_name}`}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar
                initials={initials}
                src={child.photo_url}
                colorSeed={child.first_name + child.last_name}
                size="lg"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">
                  {child.first_name} {child.last_name}
                </h1>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-semibold">Age:</span> {age} years
                  </div>
                  <div>
                    <span className="font-semibold">Class:</span>{' '}
                    {child.class_id || 'Not assigned'}
                  </div>
                  {child.blood_type && (
                    <div>
                      <span className="font-semibold">Blood Type:</span>{' '}
                      {child.blood_type}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Date of Birth:</span>{' '}
                    {formatDate(child.date_of_birth)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-2">Report Date</div>
                <div className="font-semibold">{today}</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">{t('emergencyContact')}</h3>
              <div className="text-sm space-y-0.5">
                <p>
                  <span className="font-medium">{child.emergency_contact_name}</span>
                  {' '}
                  ({child.emergency_contact_relation})
                </p>
                <p>{child.emergency_contact_phone}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
              {t('personalInformation')}
            </h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="font-semibold block text-muted-foreground text-xs uppercase mb-1">
                  Full Name
                </span>
                <p>{child.first_name} {child.last_name}</p>
              </div>
              <div>
                <span className="font-semibold block text-muted-foreground text-xs uppercase mb-1">
                  Gender
                </span>
                <p>{child.gender || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-semibold block text-muted-foreground text-xs uppercase mb-1">
                  Blood Type
                </span>
                <p>{child.blood_type || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-semibold block text-muted-foreground text-xs uppercase mb-1">
                  Class
                </span>
                <p>{child.class_id || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
              {t('knownAllergies')}
            </h2>
            {child.allergies && child.allergies.length > 0 ? (
              <div className="space-y-3">
                {child.allergies.map((allergy) => (
                  <div key={allergy.id} className="border-l-4 border-red-300 pl-4 py-2">
                    <h3 className="font-semibold mb-1">{allergy.name}</h3>
                    <div className="text-sm space-y-1">
                      {allergy.description && (
                        <p>
                          <span className="font-medium">Reaction:</span>{' '}
                          {allergy.description}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Severity:</span>{' '}
                        {allergy.severity_level.replace(/_/g, ' ')}
                      </p>
                      <p>
                        <span className="font-medium">Diagnosed:</span>{' '}
                        {formatDate(allergy.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noAllergies')}</p>
            )}
          </div>

          {/* Medications */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
              {t('medications')}
            </h2>
            {child.medications && child.medications.length > 0 ? (
              <div className="space-y-3">
                {child.medications.map((med) => (
                  <div key={med.id} className="border border-border p-3 rounded">
                    <h3 className="font-semibold mb-2">{med.name}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Dosage Form:</span> {med.dosage_form || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Default Dosage:</span>{' '}
                        {med.default_dosage || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noMedications')}</p>
            )}
          </div>

          {/* Visit Summary */}
          {child.visits && child.visits.length > 0 && (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                  {t('visitSummary')}
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="font-semibold">Total Visits</div>
                    <div className="text-3xl font-bold text-primary">
                      {child.visits.length}
                    </div>
                  </div>
                  {Object.entries(visitsByType).map(([type, count]) => (
                    <div key={type}>
                      <div className="font-semibold capitalize">
                        {type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit Details */}
              <div className="page-break">
                <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                  {t('visitHistory')}
                </h2>
                <div className="space-y-4">
                  {child.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="border border-border p-4 rounded"
                    >
                      <div className="flex justify-between mb-3">
                        <h3 className="font-semibold">
                          {formatDateTime(visit.started_at)}
                        </h3>
                        <span className="font-medium text-sm">
                          {visit.visit_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        {visit.chief_complaint && (
                          <div>
                            <span className="font-medium block mb-1">
                              Chief Complaint
                            </span>
                            <p>{visit.chief_complaint}</p>
                          </div>
                        )}
                        {visit.assessment && (
                          <div>
                            <span className="font-medium block mb-1">
                              Assessment
                            </span>
                            <p>{visit.assessment}</p>
                          </div>
                        )}
                        {visit.treatment && (
                          <div>
                            <span className="font-medium block mb-1">
                              Treatment
                            </span>
                            <p>{visit.treatment}</p>
                          </div>
                        )}
                        {visit.disposition && (
                          <div>
                            <span className="font-medium block mb-1">
                              Disposition
                            </span>
                            <p>{visit.disposition.replace(/_/g, ' ')}</p>
                          </div>
                        )}
                      </div>

                      {visit.vitals && (
                        <div className="border-t pt-3 mt-3">
                          <span className="font-medium block mb-2 text-sm">
                            Vitals
                          </span>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {visit.vitals.temperature && (
                              <p>
                                Temperature: {visit.vitals.temperature}°C
                              </p>
                            )}
                            {visit.vitals.heart_rate && (
                              <p>Heart Rate: {visit.vitals.heart_rate} bpm</p>
                            )}
                            {visit.vitals.blood_pressure && (
                              <p>BP: {visit.vitals.blood_pressure}</p>
                            )}
                            {visit.vitals.weight && (
                              <p>Weight: {visit.vitals.weight} kg</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground mt-8">
            <p>This report was generated on {formatDate(new Date().toISOString())}</p>
            <p className="mt-2">
              For confidential medical information. Please handle with care.
            </p>
          </div>
        </div>
      </PrintLayout>
    </motion.div>
  );
}

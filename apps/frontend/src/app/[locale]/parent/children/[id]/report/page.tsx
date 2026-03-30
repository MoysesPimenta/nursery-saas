'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PrintLayout } from '@/components/print-layout';
import { Avatar } from '@/components/ui/avatar';
import { AllergyBadge } from '@/components/allergy-badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, AlertCircle, Loader } from 'lucide-react';
import { Child, Visit, Allergy } from '@repo/shared';
import { apiGet } from '@/lib/api';

interface ChildMedication {
  id: string;
  medicationId: string;
  childId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface DetailedChild extends Child {
  allergies: Allergy[];
  medications: ChildMedication[];
  visits: Visit[];
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

        const childData = await apiGet<any>(`/api/v1/children/${childId}`);
        const visitsData = await apiGet<Visit[]>(
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
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/parent/children/${childId}`}>
          <Button variant="ghost" className="gap-2 print-hide">
            <ArrowLeft className="w-4 h-4" />
            Back to Child Details
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10">
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

  const age = calculateAge(child.dateOfBirth);
  const initials = getInitials(child.firstName, child.lastName);
  const today = formatDate(new Date().toISOString());
  const visitsByType = (child.visits || []).reduce(
    (acc, visit) => {
      const type = visit.visitType;
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
            Back to Child Details
          </Button>
        </Link>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </motion.div>

      {/* Report Content */}
      <PrintLayout title={`Health Report: ${child.firstName} ${child.lastName}`}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-slate-300 pb-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar
                initials={initials}
                src={child.photoUrl}
                colorSeed={child.firstName + child.lastName}
                size="lg"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">
                  {child.firstName} {child.lastName}
                </h1>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-semibold">Age:</span> {age} years
                  </div>
                  <div>
                    <span className="font-semibold">Class:</span>{' '}
                    {child.classId || 'Not assigned'}
                  </div>
                  {child.bloodType && (
                    <div>
                      <span className="font-semibold">Blood Type:</span>{' '}
                      {child.bloodType}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Date of Birth:</span>{' '}
                    {formatDate(child.dateOfBirth)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600 mb-2">Report Date</div>
                <div className="font-semibold">{today}</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">Emergency Contact</h3>
              <div className="text-sm space-y-0.5">
                <p>
                  <span className="font-medium">{child.emergencyContactName}</span>
                  {' '}
                  ({child.emergencyContactRelation})
                </p>
                <p>{child.emergencyContactPhone}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="font-semibold block text-slate-600 text-xs uppercase mb-1">
                  Full Name
                </span>
                <p>{child.firstName} {child.lastName}</p>
              </div>
              <div>
                <span className="font-semibold block text-slate-600 text-xs uppercase mb-1">
                  Gender
                </span>
                <p>{child.gender || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-semibold block text-slate-600 text-xs uppercase mb-1">
                  Blood Type
                </span>
                <p>{child.bloodType || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-semibold block text-slate-600 text-xs uppercase mb-1">
                  Class
                </span>
                <p>{child.classId || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 pb-2">
              Known Allergies
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
                        {allergy.severityLevel.replace(/_/g, ' ')}
                      </p>
                      <p>
                        <span className="font-medium">Diagnosed:</span>{' '}
                        {formatDate(allergy.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No known allergies recorded.</p>
            )}
          </div>

          {/* Medications */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 pb-2">
              Medications
            </h2>
            {child.medications && child.medications.length > 0 ? (
              <div className="space-y-3">
                {child.medications.map((med) => (
                  <div key={med.id} className="border border-slate-300 p-3 rounded">
                    <h3 className="font-semibold mb-2">{med.medicationName}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Dosage:</span> {med.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span>{' '}
                        {med.frequency}
                      </div>
                      {med.prescribedBy && (
                        <div>
                          <span className="font-medium">Prescribed by:</span>{' '}
                          {med.prescribedBy}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Started:</span>{' '}
                        {formatDate(med.startDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No medications recorded.</p>
            )}
          </div>

          {/* Visit Summary */}
          {child.visits && child.visits.length > 0 && (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 pb-2">
                  Visit Summary
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="font-semibold">Total Visits</div>
                    <div className="text-3xl font-bold text-green-600">
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
                <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 pb-2">
                  Visit History
                </h2>
                <div className="space-y-4">
                  {child.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="border border-slate-300 p-4 rounded"
                    >
                      <div className="flex justify-between mb-3">
                        <h3 className="font-semibold">
                          {formatDateTime(visit.startedAt)}
                        </h3>
                        <span className="font-medium text-sm">
                          {visit.visitType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        {visit.chiefComplaint && (
                          <div>
                            <span className="font-medium block mb-1">
                              Chief Complaint
                            </span>
                            <p>{visit.chiefComplaint}</p>
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
                            {visit.vitals.heartRate && (
                              <p>Heart Rate: {visit.vitals.heartRate} bpm</p>
                            )}
                            {visit.vitals.bloodPressure && (
                              <p>BP: {visit.vitals.bloodPressure}</p>
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
          <div className="border-t border-slate-300 pt-6 text-center text-xs text-slate-600 mt-8">
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

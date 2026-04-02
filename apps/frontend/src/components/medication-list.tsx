'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface MedicationListProps {
  medications: ChildMedication[];
  className?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isExpired(endDate?: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

export function MedicationList({ medications, className }: MedicationListProps) {
  if (!medications || medications.length === 0) {
    return (
      <div className={cn('py-8 text-center text-muted-foreground', className)}>
        No medications recorded.
      </div>
    );
  }

  const activeMeds = medications.filter((m) => !isExpired(m.endDate));
  const expiredMeds = medications.filter((m) => isExpired(m.endDate));

  return (
    <div className={cn('space-y-6', className)}>
      {activeMeds.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Current Medications
          </h3>
          {activeMeds.map((med) => (
            <Card key={med.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {med.medicationName}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
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
                  {med.notes && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      {med.notes}
                    </div>
                  )}
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {expiredMeds.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Previous Medications
          </h3>
          {expiredMeds.map((med) => (
            <Card key={med.id} className="p-4 opacity-75">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {med.medicationName}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Dosage:</span> {med.dosage}
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span>{' '}
                      {med.frequency}
                    </div>
                    <div>
                      <span className="font-medium">Prescribed:</span>{' '}
                      {formatDate(med.startDate)}
                      {med.endDate && (
                        <>
                          {' '}
                          to {formatDate(med.endDate)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Expired</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

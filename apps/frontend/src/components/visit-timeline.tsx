'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Visit, VisitType, Disposition } from '@nursery-saas/shared';

interface VisitTimelineProps {
  visits: Visit[];
  className?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getVisitTypeLabel(type: VisitType): string {
  const labels: Record<VisitType, string> = {
    authorization: 'Authorization',
    walk_in: 'Walk-in',
    scheduled: 'Scheduled',
    emergency: 'Emergency',
  };
  return labels[type];
}

function getDispositionLabel(disposition?: Disposition): string {
  if (!disposition) return 'Pending';
  const labels: Record<Disposition, string> = {
    returned_to_class: 'Returned to Class',
    sent_home: 'Sent Home',
    referred: 'Referred',
    hospitalized: 'Hospitalized',
  };
  return labels[disposition];
}

export function VisitTimeline({ visits, className }: VisitTimelineProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (!visits || visits.length === 0) {
    return (
      <div className={cn('py-8 text-center text-slate-600 dark:text-slate-400', className)}>
        No visits recorded yet.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {visits.map((visit, index) => (
        <div key={visit.id} className="relative">
          {/* Timeline dot and line */}
          <div className="absolute left-4 top-0 w-2 h-2 bg-green-500 rounded-full -translate-x-1/2" />
          {index < visits.length - 1 && (
            <div className="absolute left-4 top-6 w-0.5 h-12 bg-slate-200 dark:bg-slate-700 -translate-x-1/2" />
          )}

          {/* Visit card */}
          <Card className="ml-8 p-4">
            <div
              className="cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === visit.id ? null : visit.id)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <time className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {formatDate(visit.startedAt)}
                    </time>
                    <Badge variant={visit.visitType}>
                      {getVisitTypeLabel(visit.visitType)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {visit.chiefComplaint || 'No complaint recorded'}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform text-slate-400',
                    expandedId === visit.id && 'rotate-180'
                  )}
                />
              </div>
            </div>

            {expandedId === visit.id && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                {visit.assessment && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Assessment
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {visit.assessment}
                    </p>
                  </div>
                )}

                {visit.treatment && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Treatment
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {visit.treatment}
                    </p>
                  </div>
                )}

                {visit.vitals && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Vitals
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {visit.vitals.temperature && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            Temperature:
                          </span>
                          <span className="ml-1 font-medium">
                            {visit.vitals.temperature}°C
                          </span>
                        </div>
                      )}
                      {visit.vitals.heartRate && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            Heart Rate:
                          </span>
                          <span className="ml-1 font-medium">
                            {visit.vitals.heartRate} bpm
                          </span>
                        </div>
                      )}
                      {visit.vitals.bloodPressure && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            BP:
                          </span>
                          <span className="ml-1 font-medium">
                            {visit.vitals.bloodPressure}
                          </span>
                        </div>
                      )}
                      {visit.vitals.weight && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">
                            Weight:
                          </span>
                          <span className="ml-1 font-medium">
                            {visit.vitals.weight} kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge
                    variant={
                      visit.disposition
                        ? (visit.disposition as any)
                        : 'default'
                    }
                  >
                    {getDispositionLabel(visit.disposition)}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}

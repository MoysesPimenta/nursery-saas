'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { AllergyBadge } from '@/components/allergy-badge';
import { cn } from '@/lib/utils';
import { Child, Allergy } from '@repo/shared';
import { ChevronRight } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  allergies?: Allergy[];
  lastVisitDate?: string;
  className?: string;
  locale?: string;
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

export function ChildCard({
  child,
  allergies = [],
  lastVisitDate,
  className,
  locale = 'en',
}: ChildCardProps) {
  const initials = getInitials(child.firstName, child.lastName);
  const age = calculateAge(child.dateOfBirth);
  const lifeThreateningAllergyCount = allergies.filter(
    (a) => a.severityLevel === 'life_threatening'
  ).length;
  const hasLifeThreatening = lifeThreateningAllergyCount > 0;

  return (
    <Link
      href={`/${locale}/parent/children/${child.id}`}
      className="block group"
    >
      <Card
        className={cn(
          'p-5 hover:shadow-lg transition-all duration-200 cursor-pointer',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Avatar
              initials={initials}
              src={child.photoUrl}
              colorSeed={child.firstName + child.lastName}
              size="lg"
              alt={`${child.firstName} ${child.lastName}`}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50 group-hover:text-green-600 transition-colors">
                {child.firstName} {child.lastName}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Age {age} years • {child.classId || 'Class not assigned'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
        </div>

        {/* Allergies section */}
        {allergies.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
              Allergies ({allergies.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {hasLifeThreatening && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                  <span>⛔</span>
                  <span>Life-Threatening Alert</span>
                </div>
              )}
              {allergies.slice(0, 2).map((allergy) => (
                <AllergyBadge
                  key={allergy.id}
                  severity={allergy.severityLevel}
                  className="text-xs"
                />
              ))}
              {allergies.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{allergies.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Last visit section */}
        {lastVisitDate && (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium">Last visit:</span> {formatDate(lastVisitDate)}
          </div>
        )}

        {!lastVisitDate && (
          <div className="text-xs text-slate-500 dark:text-slate-500 italic">
            No visits recorded
          </div>
        )}
      </Card>
    </Link>
  );
}

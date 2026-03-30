'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AllergyBadgeProps {
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  className?: string;
}

export function AllergyBadge({ severity, className }: AllergyBadgeProps) {
  const severityConfig = {
    mild: {
      variant: 'warning' as const,
      label: 'Mild',
      icon: '⚠️',
    },
    moderate: {
      variant: 'warning' as const,
      label: 'Moderate',
      icon: '⚠️',
    },
    severe: {
      variant: 'destructive' as const,
      label: 'Severe',
      icon: '🚨',
    },
    life_threatening: {
      variant: 'destructive' as const,
      label: 'Life-Threatening',
      icon: '⛔',
    },
  };

  const config = severityConfig[severity];

  const pulseClass =
    severity === 'life_threatening' ? 'animate-pulse' : '';

  return (
    <Badge
      variant={config.variant}
      className={cn('gap-1.5', pulseClass, className)}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}

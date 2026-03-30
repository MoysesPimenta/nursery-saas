import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'text-blue-600',
  bgColor = 'bg-blue-100 dark:bg-blue-900',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className={cn(`p-2 rounded-lg ${bgColor}`)}>{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className={cn('text-xs mt-1', color)}>{trend}</p>}
      </CardContent>
    </Card>
  );
}

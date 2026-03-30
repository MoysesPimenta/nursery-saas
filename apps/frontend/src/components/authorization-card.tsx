'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorizationCardProps {
  id: string;
  childName: string;
  symptoms: string;
  priority: 'normal' | 'urgent';
  teacherName: string;
  timestamp: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  loading?: boolean;
}

export function AuthorizationCard({
  id,
  childName,
  symptoms,
  priority,
  teacherName,
  timestamp,
  onAccept,
  onReject,
  loading = false,
}: AuthorizationCardProps) {
  const isUrgent = priority === 'urgent';
  const timeAgo = formatTimeAgo(timestamp);

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-4 transition-all duration-200',
        isUrgent
          ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950 shadow-md'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-sm hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Header with priority */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {childName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                {childName}
              </h3>
            </div>
            {isUrgent && (
              <Badge variant="urgent" className="flex-shrink-0">
                <AlertCircle className="w-3 h-3 mr-1" />
                URGENT
              </Badge>
            )}
            {!isUrgent && (
              <Badge variant="normal" className="flex-shrink-0">
                Normal
              </Badge>
            )}
          </div>

          {/* Symptoms */}
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
            <span className="font-medium">Symptoms:</span> {symptoms}
          </p>

          {/* Footer info */}
          <div className="flex flex-col sm:flex-row gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{teacherName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            onClick={() => onAccept(id)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-sm font-medium"
          >
            Accept
          </Button>
          <Button
            onClick={() => onReject(id)}
            disabled={loading}
            variant="destructive"
            className="h-9 px-4 text-sm font-medium"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

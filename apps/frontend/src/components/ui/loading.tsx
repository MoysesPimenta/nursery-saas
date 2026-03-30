import React from 'react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        className
      )}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-4 bg-slate-200 rounded dark:bg-slate-800 animate-pulse', className)}
      role="status"
    />
  );
}

export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <SkeletonLoader className="h-10 w-10 rounded" />
          <SkeletonLoader className="h-10 flex-1" />
          <SkeletonLoader className="h-10 w-32" />
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner className="h-8 w-8" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

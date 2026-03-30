'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
  disabled = false,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-slate-900 dark:text-slate-50">{label}</label>}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-slate-600 dark:text-slate-400">From</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm',
                'bg-white text-slate-900 placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-0',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder-slate-600 dark:focus:ring-slate-300'
              )}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-slate-600 dark:text-slate-400">To</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm',
                'bg-white text-slate-900 placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-0',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder-slate-600 dark:focus:ring-slate-300'
              )}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onStartDateChange(today);
            onEndDateChange(today);
          }}
          disabled={disabled}
        >
          Today
        </Button>
      </div>
    </div>
  );
}

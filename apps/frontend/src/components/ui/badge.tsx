import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300',
  {
    variants: {
      variant: {
        default:
          'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50',
        secondary:
          'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800',
        destructive:
          'border border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900 dark:text-red-50',
        outline: 'text-slate-950 dark:text-slate-50',
        success:
          'border border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900 dark:text-green-50',
        warning:
          'border border-yellow-200 bg-yellow-100 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-50',
        info:
          'border border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-50',
        purple:
          'border border-purple-200 bg-purple-100 text-purple-900 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-50',
        // Visit type variants
        authorization:
          'border border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-50',
        walk_in:
          'border border-gray-200 bg-gray-100 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50',
        scheduled:
          'border border-purple-200 bg-purple-100 text-purple-900 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-50',
        emergency:
          'border border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900 dark:text-red-50',
        // Priority variants
        normal:
          'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50',
        urgent:
          'border border-red-300 bg-red-200 text-red-900 font-bold dark:border-red-700 dark:bg-red-800 dark:text-red-50 animate-pulse',
        // Disposition variants
        returned_to_class:
          'border border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900 dark:text-green-50',
        sent_home:
          'border border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-50',
        referred:
          'border border-yellow-200 bg-yellow-100 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-50',
        hospitalized:
          'border border-red-300 bg-red-200 text-red-900 dark:border-red-700 dark:bg-red-800 dark:text-red-50',
        // Status variants
        accepted:
          'border border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900 dark:text-green-50',
        rejected:
          'border border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900 dark:text-red-50',
        pending:
          'border border-yellow-200 bg-yellow-100 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

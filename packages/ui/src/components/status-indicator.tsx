import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const statusIndicatorVariants = cva(
  'inline-flex items-center justify-center rounded-full',
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        busy: 'bg-red-500',
        away: 'bg-yellow-500',
        idle: 'bg-orange-500',
      },
      size: {
        xs: 'h-2 w-2',
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
        xl: 'h-6 w-6',
      },
      pulse: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      status: 'offline',
      size: 'md',
      pulse: false,
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {}

/**
 * StatusIndicator component for displaying online/offline/busy status
 *
 * @example
 * <StatusIndicator status="online" size="md" pulse />
 * <StatusIndicator status="busy" size="lg" />
 * <StatusIndicator status="away" size="sm" />
 */
function StatusIndicator({
  className,
  status,
  size,
  pulse,
  ...props
}: StatusIndicatorProps) {
  return (
    <div
      className={cn(statusIndicatorVariants({ status, size, pulse }), className)}
      role="status"
      aria-label={status ? `Status: ${status}` : undefined}
      {...props}
    />
  );
}

export { StatusIndicator, statusIndicatorVariants };

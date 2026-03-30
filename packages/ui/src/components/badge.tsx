import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        pending:
          'border border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        accepted:
          'border border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        rejected:
          'border border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        cancelled:
          'border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
        mild: 'border border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
        moderate:
          'border border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        severe:
          'border border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200',
        life_threatening:
          'border border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        info: 'border border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
        warning:
          'border border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200',
        success:
          'border border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
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

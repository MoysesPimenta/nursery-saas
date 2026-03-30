import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

export interface EmptyStateProps {
  /** Icon component to display */
  icon?: LucideIcon;
  /** Icon color class (e.g., 'text-blue-500') */
  iconColor?: string;
  /** Icon size in pixels */
  iconSize?: number;
  /** Main title/heading */
  title: string;
  /** Subtitle or description */
  description?: string;
  /** Optional action button text */
  actionLabel?: string;
  /** Optional action button click handler */
  onAction?: () => void;
  /** Optional secondary action button text */
  secondaryActionLabel?: string;
  /** Optional secondary action button click handler */
  onSecondaryAction?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Additional classes for the container */
  containerClassName?: string;
}

/**
 * EmptyState component for displaying empty states with icon, title, description, and actions
 *
 * @example
 * <EmptyState
 *   icon={InboxIcon}
 *   title="No visits logged"
 *   description="Start by logging your first visit"
 *   actionLabel="Log Visit"
 *   onAction={() => handleLogVisit()}
 * />
 */
function EmptyState({
  icon: Icon,
  iconColor = 'text-gray-400',
  iconSize = 48,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  containerClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        containerClassName
      )}
    >
      <div className={cn('mb-4', className)}>
        {Icon && (
          <Icon
            size={iconSize}
            className={cn('mx-auto', iconColor)}
            strokeWidth={1.5}
          />
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
          {description}
        </p>
      )}

      <div className="flex gap-3">
        {actionLabel && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export { EmptyState };

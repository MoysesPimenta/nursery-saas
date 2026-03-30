import React from 'react';
import { DataTableSkeleton } from './loading';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  rowKey?: (item: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
  rowKey = (item, index) => index,
}: DataTableProps<T>) {
  const [rowIndex, setRowIndex] = React.useState(0);

  const getRowKey = (item: T, index: number) => {
    const key = rowKey(item);
    return typeof key === 'string' ? key : `${key}-${index}`;
  };

  if (loading) {
    return <DataTableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300',
                    column.width
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b border-slate-200 dark:border-slate-800',
                  onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('px-6 py-4 text-sm text-slate-900 dark:text-slate-50', column.width)}
                  >
                    {column.render
                      ? column.render(item[column.key as keyof T], item)
                      : item[column.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(0, pagination.page - 1))}
              disabled={pagination.page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.min(totalPages - 1, pagination.page + 1))}
              disabled={pagination.page === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

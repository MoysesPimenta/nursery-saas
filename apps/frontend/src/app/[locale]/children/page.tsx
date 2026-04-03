'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useApiQuery } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, Baby } from 'lucide-react';
import { motion } from 'framer-motion';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  className?: string;
  allergies?: string[];
  status: 'active' | 'inactive';
}

interface ChildrenResponse {
  data: Child[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function ChildrenPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: response, loading, error } = useApiQuery<ChildrenResponse>(
    `/api/v1/children?page=${page}&limit=10&search=${debouncedSearch}`
  );

  const columns = [
    {
      key: 'firstName' as const,
      label: 'Name',
      render: (value: string, item: Child) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {item.firstName[0]}{item.lastName[0]}
          </div>
          <span className="font-medium">{item.firstName} {item.lastName}</span>
        </div>
      ),
    },
    {
      key: 'dateOfBirth' as const,
      label: 'Date of Birth',
      render: (value: string) => (
        <span className="text-muted-foreground">{new Date(value).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'className' as const,
      label: 'Class',
      render: (value: string) => value || <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: 'allergies' as const,
      label: 'Allergies',
      render: (value: string[] | undefined) => {
        const count = value?.length || 0;
        return count > 0 ? (
          <Badge variant="warning">{count} alert{count > 1 ? 's' : ''}</Badge>
        ) : (
          <span className="text-muted-foreground/50">None</span>
        );
      },
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Children</h1>
          <p className="text-muted-foreground mt-1">Manage children enrolled in your nursery</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/children/new`)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-indigo-600" />
                All Children
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} children registered
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-center">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Failed to load children. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                onRowClick={(child) => router.push(`/${locale}/children/${child.id}`)}
                emptyMessage="No children found"
                rowKey={(child) => child.id}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

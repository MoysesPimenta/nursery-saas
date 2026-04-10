'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useApiQuery } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department_id?: string;
  hire_date?: string;
  is_archived: boolean;
  email?: string;
}

interface EmployeesResponse {
  data: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export default function EmployeesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { data: response, loading, error } = useApiQuery<EmployeesResponse>(
    `/api/v1/employees?page=${page}&limit=10&search=${search}`
  );

  const columns = [
    {
      key: 'first_name' as const,
      label: 'Name',
      render: (value: string, item: Employee) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {item.first_name?.[0]}{item.last_name?.[0]}
          </div>
          <div>
            <p className="font-medium">{item.first_name} {item.last_name}</p>
            {item.email && <p className="text-xs text-muted-foreground">{item.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'position' as const,
      label: 'Position',
      render: (value: string) => <span className="text-sm capitalize">{value || '—'}</span>,
    },
    {
      key: 'hire_date' as const,
      label: 'Hire Date',
      render: (value: string) => (
        <span className="text-muted-foreground">{value ? new Date(value).toLocaleDateString() : '—'}</span>
      ),
    },
    {
      key: 'is_archived' as const,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={!value ? 'success' : 'secondary'}>
          {value ? 'Archived' : 'Active'}
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
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/employees/new`)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                All Employees
              </CardTitle>
              <CardDescription>
                {response?.pagination?.total || 0} team members
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
                placeholder="Search by name, position, or department..."
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
                  Failed to load employees. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={response?.data || []}
                loading={loading}
                pagination={response?.pagination}
                onPageChange={setPage}
                onRowClick={(employee) => router.push(`/${locale}/employees/${employee.id}`)}
                emptyMessage="No employees found"
                rowKey={(employee) => employee.id}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

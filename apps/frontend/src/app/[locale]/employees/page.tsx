'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useApiQuery } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  hireDate: string;
  status: 'active' | 'inactive';
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

  const { data: response, loading } = useApiQuery<EmployeesResponse>(
    `/api/v1/employees?page=${page}&limit=10&search=${search}`
  );

  const columns = [
    {
      key: 'firstName' as const,
      label: 'Name',
      render: (value: string, item: Employee) => `${item.firstName} ${item.lastName}`,
      width: '20%',
    },
    {
      key: 'position' as const,
      label: 'Position',
      width: '20%',
    },
    {
      key: 'department' as const,
      label: 'Department',
      width: '20%',
    },
    {
      key: 'hireDate' as const,
      label: 'Hire Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
      width: '15%',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={
            value === 'active'
              ? 'success'
              : 'secondary'
          }
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
      width: '15%',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your team members
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/employees/new`)}
          className="bg-green-500 hover:bg-green-600 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees List</CardTitle>
          <CardDescription>All staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

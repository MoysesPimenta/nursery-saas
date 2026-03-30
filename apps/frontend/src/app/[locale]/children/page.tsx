'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { useApiQuery } from '@/lib/hooks/use-api';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
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
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { data: response, loading } = useApiQuery<ChildrenResponse>(
    `/api/v1/children?page=${page}&limit=10&search=${search}`
  );

  const columns = [
    {
      key: 'firstName' as const,
      label: 'Name',
      render: (value: string, item: Child) => `${item.firstName} ${item.lastName}`,
      width: '30%',
    },
    {
      key: 'dateOfBirth' as const,
      label: 'Date of Birth',
      render: (value: string) => new Date(value).toLocaleDateString(),
      width: '20%',
    },
    {
      key: 'className' as const,
      label: 'Class',
      width: '15%',
    },
    {
      key: 'allergies' as const,
      label: 'Allergies',
      render: (value: string[] | undefined) => value?.length || 0,
      width: '15%',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
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
          <h1 className="text-3xl font-bold tracking-tight">Children</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage children in your nursery
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/children/new`)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Children List</CardTitle>
          <CardDescription>View and manage all children</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

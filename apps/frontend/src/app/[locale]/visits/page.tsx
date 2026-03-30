'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Plus, Search, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Visit {
  id: string;
  childName: string;
  employeeName?: string;
  visitType: 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
  chiefComplaint: string;
  disposition: 'returned_to_class' | 'sent_home' | 'referred' | 'hospitalized';
  startTime: string;
  endTime?: string;
  createdAt: string;
}

interface VisitsResponse {
  data: Visit[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

const visitTypeConfig = {
  authorization: { label: 'Authorization', color: 'authorization' as const },
  walk_in: { label: 'Walk-in', color: 'walk_in' as const },
  scheduled: { label: 'Scheduled', color: 'scheduled' as const },
  emergency: { label: 'Emergency', color: 'emergency' as const },
};

const dispositionConfig = {
  returned_to_class: { label: 'Returned to Class', color: 'returned_to_class' as const },
  sent_home: { label: 'Sent Home', color: 'sent_home' as const },
  referred: { label: 'Referred', color: 'referred' as const },
  hospitalized: { label: 'Hospitalized', color: 'hospitalized' as const },
};

export default function VisitsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [visitType, setVisitType] = useState<string>('all');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Build query params
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (visitType !== 'all') queryParams.append('visitType', visitType);
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  queryParams.append('page', page.toString());
  queryParams.append('limit', '20');

  const { data: visitsData, loading } = useApiQuery<VisitsResponse>(
    `/api/v1/visits?${queryParams.toString()}`
  );

  const visits = visitsData?.data || [];
  const stats = visitsData?.stats || { total: 0, byType: {} };

  const columns = [
    {
      key: 'startTime' as const,
      label: 'Date/Time',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-slate-600 dark:text-slate-400">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
      width: '15%',
    },
    {
      key: 'childName' as const,
      label: 'Child Name',
      render: (value: string) => <div className="font-medium">{value}</div>,
      width: '15%',
    },
    {
      key: 'visitType' as const,
      label: 'Visit Type',
      render: (value: string) => (
        <Badge variant={visitTypeConfig[value as keyof typeof visitTypeConfig]?.color || 'default'}>
          {visitTypeConfig[value as keyof typeof visitTypeConfig]?.label || value}
        </Badge>
      ),
      width: '15%',
    },
    {
      key: 'chiefComplaint' as const,
      label: 'Complaint',
      render: (value: string) => <div className="text-sm truncate">{value}</div>,
      width: '25%',
    },
    {
      key: 'disposition' as const,
      label: 'Disposition',
      render: (value: string) => (
        <Badge variant={dispositionConfig[value as keyof typeof dispositionConfig]?.color || 'default'}>
          {dispositionConfig[value as keyof typeof dispositionConfig]?.label || value}
        </Badge>
      ),
      width: '15%',
    },
    {
      key: 'id' as const,
      label: 'Duration',
      render: (value: string, item: Visit) => {
        if (!item.endTime) return <span className="text-slate-500">Ongoing</span>;
        const duration = Math.round(
          (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000
        );
        return <span className="text-sm">{duration} min</span>;
      },
      width: '10%',
    },
  ];

  const statsCards = [
    {
      label: 'Total Visits',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'From Authorization',
      value: stats.byType?.authorization || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Walk-in',
      value: stats.byType?.walk_in || 0,
      icon: Calendar,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900',
    },
    {
      label: 'Emergency',
      value: stats.byType?.emergency || 0,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visits</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track and manage all child visits
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/visits/new`)}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Search Child
              </label>
              <div className="mt-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Visit Type */}
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Visit Type
              </label>
              <select
                value={visitType}
                onChange={(e) => {
                  setVisitType(e.target.value);
                  setPage(0);
                }}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="all">All Types</option>
                <option value="authorization">From Authorization</option>
                <option value="walk_in">Walk-in</option>
                <option value="scheduled">Scheduled</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Date Range (simplified) */}
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Date Range
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(0);
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
                />
                <span className="flex items-center text-slate-400 dark:text-slate-600">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(0);
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Records</CardTitle>
          <CardDescription>All visits within the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={visits}
            loading={loading}
            emptyMessage="No visits found"
            onRowClick={(visit) => router.push(`/${locale}/visits/${visit.id}`)}
            rowKey={(visit) => visit.id}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Plus, Search, Activity, Calendar, AlertTriangle, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

interface Visit {
  id: string;
  child_id: string;
  employee_id?: string;
  visit_type: 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
  chief_complaint: string;
  disposition: 'returned_to_class' | 'sent_home' | 'referred' | 'hospitalized';
  started_at: string;
  ended_at?: string;
  created_at: string;
}

interface VisitsResponse {
  data: Visit[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

const visitTypeConfig: Record<string, { label: string; color: any }> = {
  authorization: { label: 'Authorization', color: 'authorization' },
  walk_in: { label: 'Walk-in', color: 'walk_in' },
  scheduled: { label: 'Scheduled', color: 'scheduled' },
  emergency: { label: 'Emergency', color: 'emergency' },
};

const dispositionConfig: Record<string, { label: string; color: any }> = {
  returned_to_class: { label: 'Returned to Class', color: 'returned_to_class' },
  sent_home: { label: 'Sent Home', color: 'sent_home' },
  referred: { label: 'Referred', color: 'referred' },
  hospitalized: { label: 'Hospitalized', color: 'hospitalized' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function VisitsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visitType, setVisitType] = useState<string>('all');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query params
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  if (visitType !== 'all') queryParams.append('visitType', visitType);
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  queryParams.append('page', page.toString());
  queryParams.append('limit', '20');

  const { data: visitsData, loading, error } = useApiQuery<VisitsResponse>(
    `/api/v1/visits?${queryParams.toString()}`
  );

  const visits = visitsData?.data || [];
  const stats = visitsData?.stats || { total: 0, byType: {} };

  const columns = [
    {
      key: 'started_at' as const,
      label: 'Date/Time',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div>
            <div className="font-medium text-sm">{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      key: 'child_id' as const,
      label: 'Child',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'visit_type' as const,
      label: 'Type',
      render: (value: string) => (
        <Badge variant={visitTypeConfig[value]?.color || 'default'}>
          {visitTypeConfig[value]?.label || value}
        </Badge>
      ),
    },
    {
      key: 'chief_complaint' as const,
      label: 'Complaint',
      render: (value: string) => <div className="text-sm truncate max-w-[200px]">{value}</div>,
    },
    {
      key: 'disposition' as const,
      label: 'Disposition',
      render: (value: string) => (
        <Badge variant={dispositionConfig[value]?.color || 'default'}>
          {dispositionConfig[value]?.label || value}
        </Badge>
      ),
    },
    {
      key: 'id' as const,
      label: 'Duration',
      render: (_: string, item: Visit) => {
        if (!item.ended_at) return <Badge variant="info">Ongoing</Badge>;
        const duration = Math.round(
          (new Date(item.ended_at).getTime() - new Date(item.started_at).getTime()) / 60000
        );
        return <span className="text-sm text-muted-foreground">{duration} min</span>;
      },
    },
  ];

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visits</h1>
          <p className="text-muted-foreground mt-1">Track and manage all child visits</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/visits/new`)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          <Plus className="w-4 h-4" />
          New Visit
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Visits" value={stats.total} icon={<Activity className="w-5 h-5" />} />
        <StatCard title="Authorized" value={stats.byType?.authorization || 0} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Walk-ins" value={stats.byType?.walk_in || 0} icon={<Stethoscope className="w-5 h-5" />} />
        <StatCard title="Emergency" value={stats.byType?.emergency || 0} icon={<AlertTriangle className="w-5 h-5" />} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search child..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-10"
                />
              </div>
              <select
                value={visitType}
                onChange={(e) => { setVisitType(e.target.value); setPage(0); }}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
              >
                <option value="all">All Types</option>
                <option value="authorization">Authorization</option>
                <option value="walk_in">Walk-in</option>
                <option value="scheduled">Scheduled</option>
                <option value="emergency">Emergency</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              Visit Records
            </CardTitle>
            <CardDescription>All visits within the selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-center">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Failed to load visits. Please try again.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={visits}
                loading={loading}
                emptyMessage="No visits found"
                onRowClick={(visit) => router.push(`/${locale}/visits/${visit.id}`)}
                rowKey={(visit) => visit.id}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

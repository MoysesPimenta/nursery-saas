'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useApiQuery } from '@/lib/hooks/use-api';
import { ChevronDown, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const entityTypeColors: Record<string, string> = {
  child: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50',
  employee: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-50',
  authorization: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-50',
  visit: 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-50',
  user: 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build query
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (entityType) queryParams.append('entityType', entityType);
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  queryParams.append('page', page.toString());
  queryParams.append('limit', '20');

  const { data: logsData, loading } = useApiQuery<AuditLogsResponse>(
    `/api/v1/audit-logs?${queryParams.toString()}`
  );

  const logs = logsData?.data || [];

  const columns = [
    {
      key: 'timestamp' as const,
      label: 'Timestamp',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
      width: '15%',
    },
    {
      key: 'userName' as const,
      label: 'User',
      render: (value: string) => <div className="text-sm font-medium">{value}</div>,
      width: '15%',
    },
    {
      key: 'action' as const,
      label: 'Action',
      render: (value: string) => <div className="text-sm capitalize">{value}</div>,
      width: '15%',
    },
    {
      key: 'entityType' as const,
      label: 'Entity Type',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            entityTypeColors[value] ||
            'bg-muted text-foreground'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
      width: '12%',
    },
    {
      key: 'entityId' as const,
      label: 'Entity ID',
      render: (value: string) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {value.substring(0, 12)}...
        </code>
      ),
      width: '20%',
    },
    {
      key: 'id' as const,
      label: 'Details',
      render: (value: string) => (
        <button
          onClick={() => setExpandedId(expandedId === value ? null : value)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedId === value ? 'rotate-180' : ''
            }`}
          />
        </button>
      ),
      width: '8%',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          View all system events and user actions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Search */}
            <div>
              <label className="text-sm font-medium text-foreground">
                User Name
              </label>
              <div className="mt-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Entity Type */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Entity Type
              </label>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(0);
                }}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="">All Types</option>
                <option value="child">Child</option>
                <option value="employee">Employee</option>
                <option value="authorization">Authorization</option>
                <option value="visit">Visit</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => {
              setStartDate(date);
              setPage(0);
            }}
            onEndDateChange={(date) => {
              setEndDate(date);
              setPage(0);
            }}
            label="Date Range"
          />
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>All system events and modifications</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            pagination={logsData?.pagination}
            onPageChange={setPage}
            emptyMessage="No audit logs found"
            rowKey={(log) => log.id}
          />

          {/* Expanded Details */}
          {expandedId && (
            <motion.div
              className="mt-6 pt-6 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {logs
                .filter((log) => log.id === expandedId)
                .map((log) => (
                  <div key={log.id} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          User ID
                        </p>
                        <p className="font-mono text-sm text-foreground">
                          {log.userId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          IP Address
                        </p>
                        <p className="font-mono text-sm text-foreground">
                          {log.ipAddress || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {log.changesBefore && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Changes
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Before
                            </p>
                            <pre className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-2 overflow-auto">
                              {JSON.stringify(log.changesBefore, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              After
                            </p>
                            <pre className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2 overflow-auto">
                              {JSON.stringify(log.changesAfter, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

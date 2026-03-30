'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, AlertTriangle, FileText, Settings, LogOut } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useApiQuery } from '@/lib/hooks/use-api';

interface AdminStats {
  totalUsers: number;
  activeChildren: number;
  activeEmployees: number;
  visitsThisMonth: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Fetch admin dashboard stats
  const { data: statsData } = useApiQuery<{ data: AdminStats }>('/api/v1/dashboard');
  const stats = statsData?.data || {
    totalUsers: 0,
    activeChildren: 0,
    activeEmployees: 0,
    visitsThisMonth: 0,
  };

  const adminStats = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Active Children',
      value: stats.activeChildren,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Visits This Month',
      value: stats.visitsThisMonth,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  const quickLinks = [
    {
      icon: Users,
      label: 'User Management',
      href: `/${locale}/admin/users`,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Settings,
      label: 'Tenant Settings',
      href: `/${locale}/admin/tenants`,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: FileText,
      label: 'Audit Logs',
      href: `/${locale}/admin/audit-logs`,
      color: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          System administration and monitoring dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        {adminStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={index} variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
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

      {/* Quick Links */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Common administration tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => router.push(link.href)}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <Icon className={`w-6 h-6 ${link.color}`} />
                    <span className="text-sm text-center">{link.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Overview of system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Healthy
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Healthy
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="mb-4">No recent critical events. System operating normally.</p>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/audit-logs`)}
              >
                View All Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

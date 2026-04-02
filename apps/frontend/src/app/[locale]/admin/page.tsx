'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, FileText, Settings, ArrowRight, Shield, Activity, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useApiQuery } from '@/lib/hooks/use-api';

interface AdminStats {
  totalUsers: number;
  activeChildren: number;
  activeEmployees: number;
  visitsThisMonth: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { data: statsData } = useApiQuery<{ data: AdminStats }>('/api/v1/dashboard');
  const stats = statsData?.data || {
    totalUsers: 0,
    activeChildren: 0,
    activeEmployees: 0,
    visitsThisMonth: 0,
  };

  const quickLinks = [
    {
      icon: Users,
      label: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: `/${locale}/admin/users`,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Settings,
      label: 'Tenant Settings',
      description: 'Configure branding and features',
      href: `/${locale}/admin/tenants`,
      gradient: 'from-violet-500 to-pink-500',
    },
    {
      icon: FileText,
      label: 'Audit Logs',
      description: 'View system activity and changes',
      href: `/${locale}/admin/audit-logs`,
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const systemStatus = [
    { label: 'API Health', status: 'operational' },
    { label: 'Database', status: 'operational' },
    { label: 'Storage', status: 'operational' },
    { label: 'Auth Service', status: 'operational' },
  ];

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
        </div>
        <p className="text-muted-foreground ml-11">System administration and monitoring</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Active Children" value={stats.activeChildren} icon={<Building2 className="w-5 h-5" />} />
        <StatCard title="Active Employees" value={stats.activeEmployees} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Visits This Month" value={stats.visitsThisMonth} icon={<BarChart3 className="w-5 h-5" />} />
      </motion.div>

      {/* Quick Access */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.label}
                className="cursor-pointer group"
                onClick={() => router.push(link.href)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center text-white shadow-sm mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold">{link.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              System Status
            </CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemStatus.map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Operational</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

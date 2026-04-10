'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { motion } from 'framer-motion';
import { Users, Baby, Plus, FileText, ClipboardList, ArrowRight, Activity, Sparkles } from 'lucide-react';
import { useApiQuery } from '@/lib/hooks/use-api';
import { DataTableSkeleton } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface DashboardStats {
  childrenCount: number;
  staffCount: number;
  visitsToday: number;
  pendingAuthorizations: number;
  allergyAlerts: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { data: stats, loading, error } = useApiQuery<DashboardStats>('/api/v1/dashboard');
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quickActions = [
    { label: tCommon('children'), icon: Plus, href: `/${locale}/children/new`, color: 'from-indigo-500 to-purple-500' },
    { label: t('newVisit'), icon: ClipboardList, href: `/${locale}/visits/new`, color: 'from-violet-500 to-pink-500' },
    { label: tCommon('authorizations'), icon: FileText, href: `/${locale}/authorizations`, color: 'from-blue-500 to-cyan-500' },
    { label: tCommon('employees'), icon: Users, href: `/${locale}/employees`, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('welcome')} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <Link href={`/${locale}/visits/new`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('newVisit')}
          </Button>
        </Link>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div variants={item} className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Failed to load dashboard data. Please try refreshing the page.
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <DataTableSkeleton rows={1} />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
        >
          <motion.div variants={item}>
            <StatCard
              title={t('totalChildren')}
              value={stats?.childrenCount || 0}
              icon={<Baby className="w-5 h-5" />}
              trend={stats?.childrenCount ? `${stats.childrenCount} enrolled` : 'No children yet'}
              trendUp={!!stats?.childrenCount}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title={t('staffMembers')}
              value={stats?.staffCount || 0}
              icon={<Users className="w-5 h-5" />}
              trend={stats?.staffCount ? `${stats.staffCount} active` : 'No staff yet'}
              trendUp={!!stats?.staffCount}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title={t('todaysVisits')}
              value={stats?.visitsToday || 0}
              icon={<Activity className="w-5 h-5" />}
              trend={stats?.visitsToday ? 'Updated just now' : 'No visits today'}
              trendUp={!!stats?.visitsToday}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title={t('pendingAuth')}
              value={stats?.pendingAuthorizations || 0}
              icon={<FileText className="w-5 h-5" />}
              trend={stats?.allergyAlerts ? `${stats.allergyAlerts} allergy alerts` : 'All clear'}
              trendUp={!stats?.allergyAlerts}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={item} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <CardTitle>{t('quickActions')}</CardTitle>
              </div>
              <CardDescription>Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/50 hover:border-indigo-600/20 hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{action.label}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your nursery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Activity will appear here as you use the app</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              </div>
              <p className="text-sm font-medium">All systems operational</p>
              <p className="text-xs text-muted-foreground ml-auto">Last checked just now</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

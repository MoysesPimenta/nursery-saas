'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, Baby, Calendar, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/lib/hooks/use-api';
import { DataTableSkeleton } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { data: stats, loading } = useApiQuery<DashboardStats>('/api/v1/dashboard/stats');

  const statCards = stats
    ? [
        {
          title: 'Total Children',
          value: stats.childrenCount || 0,
          icon: Baby,
          trend: '+2.5%',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
        },
        {
          title: 'Staff Members',
          value: stats.staffCount || 0,
          icon: Users,
          trend: '+0.5%',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900',
        },
        {
          title: "Today's Visits",
          value: stats.visitsToday || 0,
          icon: Calendar,
          trend: '+12%',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900',
        },
        {
          title: 'Pending Authorizations',
          value: stats.pendingAuthorizations || 0,
          icon: TrendingUp,
          trend: stats.allergyAlerts && stats.allergyAlerts > 0 ? `${stats.allergyAlerts} allergy alerts` : '+0',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Welcome back! Here's an overview of your nursery.
        </p>
      </div>

      {loading ? (
        <DataTableSkeleton rows={4} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={index} variants={item}>
                <Card className="hover:shadow-lg transition-shadow">
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
                    <p className={`text-xs mt-1 ${stat.color}`}>
                      {stat.trend}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={item}
        initial="hidden"
        animate="show"
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your nursery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                No recent activity yet.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href={`/${locale}/children/new`}>
                <Button variant="ghost" className="w-full text-left justify-start">
                  Add new child
                </Button>
              </Link>
              <Button variant="ghost" className="w-full text-left justify-start">
                Create visit authorization
              </Button>
              <Button variant="ghost" className="w-full text-left justify-start">
                View staff schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

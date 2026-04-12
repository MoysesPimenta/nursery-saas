'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, FileText, Settings, ArrowRight, Shield, Activity, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/hooks/use-api';

interface AdminStats {
  childrenCount: number;
  staffCount: number;
  visitsToday: number;
  pendingAuthorizations: number;
  allergyAlerts: number;
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
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { data: stats } = useApiQuery<AdminStats>('/api/v1/dashboard');
  const statsData = stats || {
    childrenCount: 0,
    staffCount: 0,
    visitsToday: 0,
    pendingAuthorizations: 0,
    allergyAlerts: 0,
  };

  const quickLinks = [
    {
      icon: Users,
      label: t('users'),
      description: t('manageUsersRoles'),
      href: `/${locale}/admin/users`,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Settings,
      label: t('tenantSettings'),
      description: t('configureBranding'),
      href: `/${locale}/admin/tenants`,
      gradient: 'from-violet-500 to-pink-500',
    },
    {
      icon: FileText,
      label: t('auditLogs'),
      description: t('viewSystemActivity'),
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
          <h1 className="text-2xl font-bold tracking-tight">{t('adminConsole')}</h1>
        </div>
        <p className="text-muted-foreground ml-11">{t('systemAdministration')}</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('activeChildren')} value={statsData.childrenCount} icon={<Building2 className="w-5 h-5" />} />
        <StatCard title={t('activeEmployees')} value={statsData.staffCount} icon={<Users className="w-5 h-5" />} />
        <StatCard title={t('todaysVisits')} value={statsData.visitsToday} icon={<BarChart3 className="w-5 h-5" />} />
        <StatCard title={t('pendingAuth')} value={statsData.pendingAuthorizations} icon={<FileText className="w-5 h-5" />} />
      </motion.div>

      {/* Quick Access */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-3">{t('quickAccess')}</h2>
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
              {t('systemStatus')}
            </CardTitle>
            <CardDescription>{t('allSystemsOperational')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemStatus.map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('operational')}</span>
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

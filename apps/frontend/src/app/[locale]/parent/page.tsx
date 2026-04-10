'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChildCard } from '@/components/child-card';
import { motion } from 'framer-motion';
import { Users, AlertCircle, Loader } from 'lucide-react';
import { Child, Allergy } from '@nursery-saas/shared';
import { apiGet } from '@/lib/api';
import { useParams } from 'next/navigation';

interface ChildWithAllergies extends Child {
  allergies: Allergy[];
  lastVisitDate?: string;
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

export default function ParentPortalPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [children, setChildren] = useState<ChildWithAllergies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentName, setParentName] = useState('Parent');

  useEffect(() => {
    async function loadChildren() {
      try {
        setLoading(true);
        setError(null);

        const response = await apiGet<{ data: Child[] }>('/api/v1/children');
        const childrenData = response.data;

        // Enrich children with allergies and last visit info
        const enrichedChildren = await Promise.all(
          childrenData.map(async (child) => {
            let allergies: any[] = [];
            let lastVisitDate: string | undefined;

            // Get child details which should include allergies
            try {
              const childDetails = await apiGet<any>(
                `/api/v1/children/${child.id}`
              );
              allergies = childDetails.allergies || [];
            } catch (err) {
              console.error(`Failed to load details for child ${child.id}:`, err);
              allergies = [];
            }

            // Get latest visit
            try {
              const visitsResponse = await apiGet<{ data: any[] }>(
                `/api/v1/visits?child_id=${child.id}&limit=1`
              );
              lastVisitDate = visitsResponse.data?.[0]?.startedAt;
            } catch (err) {
              console.error(`Failed to load visits for child ${child.id}:`, err);
              lastVisitDate = undefined;
            }

            return {
              ...child,
              allergies,
              lastVisitDate,
            };
          })
        );

        setChildren(enrichedChildren);

        // Try to load parent name from dashboard
        try {
          const dashboard = await apiGet<any>('/api/v1/dashboard');
          if (dashboard.user?.fullName) {
            setParentName(dashboard.user.fullName.split(' ')[0]);
          }
        } catch {
          // Dashboard not available, use default
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('parent.errorLoadingChildren')
        );
      } finally {
        setLoading(false);
      }
    }

    loadChildren();
  }, [t]);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {t('parent.welcomeBack', { name: parentName })}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('parent.viewChildHealth')}
          </p>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  {t('parent.errorLoadingChildren')}
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading state */}
      {loading ? (
        <motion.div variants={itemVariants} className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      ) : children.length === 0 ? (
        /* Empty state */
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Users className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {t('parent.noChildrenLinked')}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {t('parent.noChildrenLinked')}
                  </p>
                </div>
                <Button
                  variant="default"
                  className="mt-4"
                  disabled
                >
                  {t('parent.linkChild')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Children grid */
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {children.map((child) => (
            <motion.div key={child.id} variants={itemVariants}>
              <ChildCard
                child={child}
                allergies={child.allergies}
                lastVisitDate={child.lastVisitDate}
                locale={locale}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick info section */}
      {children.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('parent.quickLinks')}</CardTitle>
              <CardDescription>
                {t('parent.quickAccess')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('parent.clickCardInfo')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

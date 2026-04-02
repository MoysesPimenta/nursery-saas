'use client';

import React, { useEffect, useState } from 'react';
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

        const childrenData = await apiGet<Child[]>('/api/v1/children');

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
              const visits = await apiGet<any[]>(
                `/api/v1/visits?child_id=${child.id}&limit=1`
              );
              lastVisitDate = visits?.[0]?.startedAt;
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
          err instanceof Error ? err.message : 'Failed to load children'
        );
      } finally {
        setLoading(false);
      }
    }

    loadChildren();
  }, []);

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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome back, {parentName}!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            View your child's health information and visit history.
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
                  Error loading children
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
          <Loader className="w-8 h-8 animate-spin text-green-600" />
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
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50 mb-1">
                    No Children Registered
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    You don't have any children linked to your account yet. Contact your nursery administrator to get started.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="mt-4"
                  disabled
                >
                  Link Child
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
              <CardTitle className="text-lg">Quick Links</CardTitle>
              <CardDescription>
                Quick access to common actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click on any child card above to view detailed health information, visit history, medications, and allergies.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AllergyBadge } from '@/components/allergy-badge';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface ChildMedicationRow {
  medications: {
    id: string;
    name: string;
    dosage_form?: string;
    default_dosage?: string;
  };
}

interface ChildAllergyRow {
  allergies: {
    id: string;
    name: string;
    severity_level: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    description?: string;
    created_at: string;
  };
}

interface DetailedChild {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  class_id?: string;
  photo_url?: string;
  blood_type?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  allergies: ChildAllergyRow['allergies'][];
  medications: ChildMedicationRow['medications'][];
  visits: any[];
  lastVisit?: any;
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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ChildDetailPage() {
  const t = useTranslations('children');
  const params = useParams();
  const childId = params.id as string;
  const locale = params.locale as string;
  const [child, setChild] = useState<DetailedChild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChild() {
      try {
        setLoading(true);
        setError(null);

        const childData = await apiGet<DetailedChild>(`/api/v1/children/${childId}`);
        const visitsResponse = await apiGet<{ data: any[] }>(
          `/api/v1/visits?child_id=${childId}&limit=10`
        );
        const visitsData = visitsResponse?.data || [];

        setChild({
          ...childData,
          visits: visitsData,
          lastVisit: visitsData[0],
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load child details'
        );
      } finally {
        setLoading(false);
      }
    }

    loadChild();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/parent`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('backToChildren')}
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-900 dark:text-red-100">
              {error || 'Child not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = calculateAge(child.date_of_birth);
  const initials = getInitials(child.first_name, child.last_name);
  const recentVisits = (child.visits || []).slice(0, 5);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back button */}
      <motion.div variants={itemVariants}>
        <Link href={`/${locale}/parent`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('backToChildren')}
          </Button>
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar
                initials={initials}
                src={child.photo_url}
                colorSeed={child.first_name + child.last_name}
                size="lg"
                alt={`${child.first_name} ${child.last_name}`}
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {child.first_name} {child.last_name}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Age
                    </span>
                    <p className="font-semibold text-foreground">
                      {age} years
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Class
                    </span>
                    <p className="font-semibold text-foreground">
                      {child.class_id || 'Not assigned'}
                    </p>
                  </div>
                  {child.blood_type && (
                    <div>
                      <span className="text-muted-foreground">
                        Blood Type
                      </span>
                      <p className="font-semibold text-foreground">
                        {child.blood_type}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      Date of Birth
                    </span>
                    <p className="font-semibold text-foreground">
                      {formatDate(child.date_of_birth)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-3">
                {t('emergencyContact')}
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">
                    {t('name')}:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergency_contact_name}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t('relation')}:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergency_contact_relation}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t('phone')}:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergency_contact_phone}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="visits">{t('visits')}</TabsTrigger>
            <TabsTrigger value="medications">{t('medications')}</TabsTrigger>
            <TabsTrigger value="allergies">{t('allergies')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('totalVisits')}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {child.visits?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('lastVisit')}
                  </div>
                  <div className="font-semibold text-foreground">
                    {child.lastVisit
                      ? formatDate(child.lastVisit.started_at)
                      : t('none')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('medications')}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {child.medications?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('allergies')}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {child.allergies?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {recentVisits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('recentActivity')}
                  </CardTitle>
                  <CardDescription>
                    Last {recentVisits.length} visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentVisits.map((visit: any) => (
                      <div key={visit.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {visit.started_at ? formatDate(visit.started_at) : 'Unknown date'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                              {(visit.visit_type || 'unknown').replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {visit.chief_complaint || 'No complaint recorded'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visit History Tab */}
          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('visitHistory')}</CardTitle>
                <CardDescription>
                  Complete timeline of all visits to the health office
                </CardDescription>
              </CardHeader>
              <CardContent>
                {child.visits && child.visits.length > 0 ? (
                  <div className="space-y-3">
                    {child.visits.map((visit: any) => (
                      <div key={visit.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {visit.started_at ? formatDate(visit.started_at) : 'Unknown date'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                              {(visit.visit_type || 'unknown').replace('_', ' ')}
                            </span>
                          </div>
                          {visit.disposition && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                              {visit.disposition.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-2">
                          {visit.chief_complaint || 'No complaint recorded'}
                        </p>
                        {visit.assessment && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Assessment:</span> {visit.assessment}
                          </p>
                        )}
                        {visit.treatment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Treatment:</span> {visit.treatment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No visits recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('medications')}</CardTitle>
                <CardDescription>
                  Current and past medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {child.medications && child.medications.length > 0 ? (
                  <div className="space-y-3">
                    {child.medications.map((med: any) => (
                      <div key={med.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{med.name}</h4>
                            {med.dosage_form && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Form: {med.dosage_form}
                              </p>
                            )}
                            {med.default_dosage && (
                              <p className="text-sm text-muted-foreground">
                                Default dosage: {med.default_dosage}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No medications recorded.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('knownAllergies')}</CardTitle>
                <CardDescription>
                  Allergen information and severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {child.allergies && child.allergies.length > 0 ? (
                  <div className="space-y-3">
                    {child.allergies.map((allergy) => (
                      <Card key={allergy.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              {allergy.name}
                            </h4>
                            {allergy.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {allergy.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Diagnosed:{' '}
                              {formatDate(allergy.created_at)}
                            </p>
                          </div>
                          <AllergyBadge
                            severity={allergy.severity_level}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No known allergies recorded.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

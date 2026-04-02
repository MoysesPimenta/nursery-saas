'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VisitTimeline } from '@/components/visit-timeline';
import { MedicationList } from '@/components/medication-list';
import { AllergyBadge } from '@/components/allergy-badge';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { Child, Visit, Allergy } from '@nursery-saas/shared';
import { apiGet } from '@/lib/api';

interface ChildMedication {
  id: string;
  medicationId: string;
  childId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface DetailedChild extends Child {
  allergies: Allergy[];
  medications: ChildMedication[];
  visits: Visit[];
  lastVisit?: Visit;
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

        const childData = await apiGet<any>(`/api/v1/children/${childId}`);
        const visitsData = await apiGet<Visit[]>(
          `/api/v1/visits?child_id=${childId}`
        );

        setChild({
          ...childData,
          visits: visitsData || [],
          lastVisit: visitsData?.[0],
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
            Back to Children
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

  const age = calculateAge(child.dateOfBirth);
  const initials = getInitials(child.firstName, child.lastName);
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
            Back to Children
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
                src={child.photoUrl}
                colorSeed={child.firstName + child.lastName}
                size="lg"
                alt={`${child.firstName} ${child.lastName}`}
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {child.firstName} {child.lastName}
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
                      {child.classId || 'Not assigned'}
                    </p>
                  </div>
                  {child.bloodType && (
                    <div>
                      <span className="text-muted-foreground">
                        Blood Type
                      </span>
                      <p className="font-semibold text-foreground">
                        {child.bloodType}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      Date of Birth
                    </span>
                    <p className="font-semibold text-foreground">
                      {formatDate(child.dateOfBirth)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-3">
                Emergency Contact
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">
                    Name:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergencyContactName}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Relation:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergencyContactRelation}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Phone:
                  </span>
                  <span className="ml-2 font-medium">
                    {child.emergencyContactPhone}
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Visits
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {child.visits?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Last Visit
                  </div>
                  <div className="font-semibold text-foreground">
                    {child.lastVisit
                      ? formatDate(child.lastVisit.startedAt)
                      : 'None'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Medications
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {child.medications?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Allergies
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
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Last {recentVisits.length} visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VisitTimeline visits={recentVisits} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visit History Tab */}
          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visit History</CardTitle>
                <CardDescription>
                  Complete timeline of all visits to the health office
                </CardDescription>
              </CardHeader>
              <CardContent>
                {child.visits && child.visits.length > 0 ? (
                  <VisitTimeline visits={child.visits} />
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
                <CardTitle>Medications</CardTitle>
                <CardDescription>
                  Current and past medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {child.medications && child.medications.length > 0 ? (
                  <MedicationList medications={child.medications} />
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
                <CardTitle>Known Allergies</CardTitle>
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
                              {formatDate(allergy.createdAt)}
                            </p>
                          </div>
                          <AllergyBadge
                            severity={allergy.severityLevel}
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

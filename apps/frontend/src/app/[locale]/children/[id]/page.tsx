'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/modal';

// API returns snake_case from Supabase
interface ChildDetail {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id?: string;
  blood_type?: string;
  allergies: Array<{ name: string }> | string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('children');
  const locale = params.locale as string;
  const childId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: child, loading } = useApiQuery<ChildDetail>(`/api/v1/children/${childId}`);
  const { execute: deleteChild, loading: deleting } = useApiMutation(
    `/api/v1/children/${childId}`,
    'DELETE'
  );

  const handleDelete = async () => {
    try {
      await deleteChild();
      router.push(`/${locale}/children`);
    } catch (error) {
      console.error('Failed to delete child:', error);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Child not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/children`)}
          className="mt-4"
        >
          Back to Children
        </Button>
      </div>
    );
  }

  // Calculate age correctly, handling timezone issues
  const calculateAge = (dateStr: string): number => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(child.date_of_birth);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/children`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {child.first_name} {child.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Age: {age} years • {(child as Record<string, unknown>).class_name ? String((child as Record<string, unknown>).class_name) : 'No class assigned'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/children/${childId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t('firstName')}</p>
                  <p className="text-lg font-semibold">
                    {child.first_name} {child.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dateOfBirth')}</p>
                  <p className="text-lg font-semibold">
                    {(() => {
                      const dateStr = child.date_of_birth;
                      if (!dateStr) return '—';
                      const [year, month, day] = dateStr.split('T')[0].split('-');
                      return `${month}/${day}/${year}`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('gender')}</p>
                  <p className="text-lg font-semibold capitalize">{child.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('bloodType')}</p>
                  <p className="text-lg font-semibold">{child.blood_type || t('notSpecified')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('medicalInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('allergies')}</p>
                  {child.allergies && child.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {child.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded text-sm"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('noAllergiesRecorded')}</p>
                  )}
                </div>
                {child.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('additionalNotes')}</p>
                    <p className="text-foreground">{child.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{t('emergencyContact')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t('name')}</p>
                  <p className="text-lg font-semibold">{child.emergency_contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('relationship')}</p>
                  <p className="text-lg font-semibold">
                    {child.emergency_contact_relation || t('notSpecified')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">{t('phone')}</p>
                  <p className="text-lg font-semibold">{child.emergency_contact_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  !child.is_archived
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-muted text-foreground'
                }`}
              >
                {child.is_archived ? t('archived') : t('active')}
              </span>
            </CardContent>
          </Card>

          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('class')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{child.class_id ? t('assigned') : t('notAssigned')}</p>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recordDates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t('created')}</p>
                <p>{new Date(child.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('lastUpdated')}</p>
                <p>{new Date(child.updated_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteChild')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmation', { name: `${child.first_name} ${child.last_name}` })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

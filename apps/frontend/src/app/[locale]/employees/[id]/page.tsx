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
import { Badge } from '@/components/ui/badge';

// API returns snake_case from Supabase
interface EmployeeDetail {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department_id?: string;
  hire_date?: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('employees');
  const locale = params.locale as string;
  const employeeId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: employee, loading } = useApiQuery<EmployeeDetail>(
    `/api/v1/employees/${employeeId}`
  );
  const { execute: deleteEmployee, loading: deleting } = useApiMutation(
    `/api/v1/employees/${employeeId}`,
    'DELETE'
  );

  const handleDelete = async () => {
    try {
      await deleteEmployee();
      router.push(`/${locale}/employees`);
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Employee not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/employees`)}
          className="mt-4"
        >
          Back to Employees
        </Button>
      </div>
    );
  }

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
            onClick={() => router.push(`/${locale}/employees`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {employee.position || 'No position'} • {employee.department_id ? 'Department assigned' : 'No department assigned'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/employees/${employeeId}/edit`)}
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
                    {employee.first_name} {employee.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('position')}</p>
                  <p className="text-lg font-semibold capitalize">{employee.position || t('notSet')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('email')}</p>
                  <p className="text-lg font-semibold">{employee.email || t('notProvided')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('phone')}</p>
                  <p className="text-lg font-semibold">{employee.phone || t('notProvided')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('employmentInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('department')}</p>
                  <p className="text-lg font-semibold">{employee.department_id ? t('assigned') : t('notAssigned')}</p>
                </div>
                {employee.hire_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('hireDate')}</p>
                    <p className="text-lg font-semibold">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={!employee.is_archived ? 'success' : 'secondary'}>
                {employee.is_archived ? t('archived') : t('active')}
              </Badge>
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
                <p>{new Date(employee.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('lastUpdated')}</p>
                <p>{new Date(employee.updated_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteEmployee')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmation', { name: `${employee.first_name} ${employee.last_name}` })}
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

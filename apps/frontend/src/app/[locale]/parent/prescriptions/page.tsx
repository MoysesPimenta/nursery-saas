'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface Prescription {
  child_medication_id: string;
  child_id: string;
  child_name: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
  instructions?: string;
  dosage_form?: string;
  notes?: string;
  consent_status: 'pending' | 'approved' | 'rejected';
  consent_date?: string;
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

export default function ParentPrescriptionsPage() {
  const t = useTranslations('parent');
  const params = useParams();
  const locale = params.locale as string;

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  // Fetch prescriptions
  const { data: prescriptionsData, loading, refetch, error } = useApiQuery<{
    data: Prescription[];
  }>('/api/v1/parent/prescriptions');

  const prescriptions = prescriptionsData?.data || [];

  // Filter prescriptions by consent status
  const pendingPrescriptions = prescriptions.filter((p) => p.consent_status === 'pending');
  const approvedPrescriptions = prescriptions.filter((p) => p.consent_status === 'approved');
  const rejectedPrescriptions = prescriptions.filter((p) => p.consent_status === 'rejected');

  const getFilteredPrescriptions = () => {
    switch (activeTab) {
      case 'pending':
        return pendingPrescriptions;
      case 'approved':
        return approvedPrescriptions;
      case 'rejected':
        return rejectedPrescriptions;
      default:
        return [];
    }
  };

  const filteredPrescriptions = getFilteredPrescriptions();

  const handleApprove = async (id: string) => {
    setConfirmingId(id);
    setConfirmAction('approve');
  };

  const handleReject = async (id: string) => {
    setConfirmingId(id);
    setConfirmAction('reject');
  };

  const confirmConsent = async () => {
    if (!confirmingId || !confirmAction) return;

    setProcessingId(confirmingId);
    try {
      await api('/api/v1/parent/prescriptions', {
        method: 'PATCH',
        body: JSON.stringify({
          child_medication_id: confirmingId,
          consent_status: confirmAction,
        }),
      });
      await refetch();
      setConfirmingId(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to update consent:', error);
      setProcessingId(null);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">{t('prescriptions')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('medicationsRequiringConsent')}
          </p>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load prescriptions. Please try again.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <motion.div variants={itemVariants} className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      )}

      {!loading && prescriptions.length === 0 ? (
        /* Empty state */
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {t('noChildMedications')}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {t('noChildMedications')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Stats */}
          {pendingPrescriptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10">
                <CardContent className="pt-6 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      {pendingPrescriptions.length} {pendingPrescriptions.length === 1 ? 'medication' : 'medications'} {t('consentRequired')}
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Please review and approve or reject
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  {t('pendingConsent')} {pendingPrescriptions.length > 0 && `(${pendingPrescriptions.length})`}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  {t('approvedPrescriptions')} {approvedPrescriptions.length > 0 && `(${approvedPrescriptions.length})`}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  {t('rejectedPrescriptions')} {rejectedPrescriptions.length > 0 && `(${rejectedPrescriptions.length})`}
                </TabsTrigger>
              </TabsList>

              {['pending', 'approved', 'rejected'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  {filteredPrescriptions.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                          <h3 className="font-semibold text-foreground mb-1">
                            {tab === 'pending'
                              ? t('noPendingConsents')
                              : `No ${tab} medications`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tab === 'pending'
                              ? 'All medications have been reviewed'
                              : `No ${tab} prescriptions to display`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredPrescriptions.map((prescription, idx) => {
                        const statusIcon = {
                          pending: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                          approved: <CheckCircle className="w-5 h-5 text-green-600" />,
                          rejected: <XCircle className="w-5 h-5 text-red-600" />,
                        }[prescription.consent_status];

                        const statusColor = {
                          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
                          approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
                          rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
                        }[prescription.consent_status];

                        return (
                          <motion.div
                            key={prescription.child_medication_id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  {/* Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        {statusIcon}
                                        <h3 className="font-semibold text-lg">
                                          {prescription.medication_name}
                                        </h3>
                                        <Badge className={statusColor}>
                                          {prescription.consent_status === 'pending'
                                            ? t('consentRequired')
                                            : prescription.consent_status === 'approved'
                                            ? t('consentGiven')
                                            : t('consentRejected')}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {t('dosageInfo')}: {prescription.dosage}
                                        {prescription.frequency && ` - ${prescription.frequency}`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Details */}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">{t('medicationName')}</p>
                                      <p className="font-medium">{prescription.medication_name}</p>
                                    </div>
                                    {prescription.prescribed_by && (
                                      <div>
                                        <p className="text-muted-foreground">{t('prescribedBy')}</p>
                                        <p className="font-medium">{prescription.prescribed_by}</p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-muted-foreground">Child</p>
                                      <p className="font-medium">{prescription.child_name}</p>
                                    </div>
                                    {prescription.start_date && (
                                      <div>
                                        <p className="text-muted-foreground">Start Date</p>
                                        <p className="font-medium">
                                          {new Date(prescription.start_date).toLocaleDateString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {prescription.instructions && (
                                    <div className="bg-muted p-3 rounded-lg text-sm">
                                      <p className="text-muted-foreground mb-1">Instructions</p>
                                      <p>{prescription.instructions}</p>
                                    </div>
                                  )}

                                  {prescription.consent_date && (
                                    <div className="text-xs text-muted-foreground">
                                      {t('consentDate')}: {new Date(prescription.consent_date).toLocaleDateString()}
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {prescription.consent_status === 'pending' && (
                                    <div className="flex gap-2 justify-end pt-4 border-t">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReject(prescription.child_medication_id)}
                                        disabled={processingId === prescription.child_medication_id}
                                      >
                                        {processingId === prescription.child_medication_id
                                          ? 'Rejecting...'
                                          : t('reject')}
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApprove(prescription.child_medication_id)}
                                        disabled={processingId === prescription.child_medication_id}
                                      >
                                        {processingId === prescription.child_medication_id
                                          ? 'Approving...'
                                          : t('approve')}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmingId}
        onOpenChange={(open) => !open && (setConfirmingId(null), setConfirmAction(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' ? 'Approve Prescription' : 'Reject Prescription'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction === 'approve' ? 'approve' : 'reject'} this
              prescription? This action will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmingId(null);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmConsent}
              disabled={processingId === confirmingId}
              variant={confirmAction === 'reject' ? 'destructive' : 'default'}
            >
              {processingId === confirmingId
                ? confirmAction === 'approve'
                  ? 'Approving...'
                  : 'Rejecting...'
                : confirmAction === 'approve'
                ? 'Approve'
                : 'Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

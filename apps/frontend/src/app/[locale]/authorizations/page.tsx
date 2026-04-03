'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AuthorizationCard } from '@/components/authorization-card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Authorization {
  id: string;
  childId: string;
  childName: string;
  symptoms: string;
  priority: 'normal' | 'urgent';
  teacherName: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function AuthorizationsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected' | 'all'>(
    'pending'
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch authorizations
  const { data: authorizationsData, loading, refetch } = useApiQuery<{
    data: Authorization[];
  }>(`/api/v1/authorizations?status=${activeTab === 'all' ? '' : activeTab}`);

  const authorizations = authorizationsData?.data || [];

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await api(`/api/v1/authorizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
      });
      await refetch();
      // Redirect to create visit with authorization
      router.push(`/${locale}/visits/new?authorizationId=${id}`);
    } catch (error) {
      console.error('Failed to accept authorization:', error);
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;

    setProcessingId(rejectingId);
    try {
      await api(`/api/v1/authorizations/${rejectingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectReason,
        }),
      });
      await refetch();
      setRejectingId(null);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject authorization:', error);
      setProcessingId(null);
    }
  };

  // Sort authorizations: urgent first, then pending
  const sortedAuthorizations = [...authorizations].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = authorizations.filter((a) => a.status === 'pending').length;
  const urgentCount = authorizations.filter(
    (a) => a.status === 'pending' && a.priority === 'urgent'
  ).length;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authorization Queue</h1>
          <p className="text-muted-foreground mt-1">
            Manage parent authorization requests for pickup
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/authorizations/new`)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {pendingCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentCount > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="border-2 border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-50">Urgent Authorizations</h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {urgentCount} urgent request{urgentCount !== 1 ? 's' : ''} awaiting action
                </p>
              </div>
            </motion.div>
          )}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-lg p-4"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-50">Pending Requests</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingCount}</p>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* Content */}
        {['pending', 'accepted', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading...</div>
                  </div>
                </CardContent>
              </Card>
            ) : sortedAuthorizations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">
                      No {tab === 'all' ? 'authorizations' : tab} authorizations
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tab === 'pending' ? 'Check back soon for new requests' : 'Nothing to show here'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedAuthorizations.map((auth, idx) => (
                  <motion.div
                    key={auth.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <AuthorizationCard
                      id={auth.id}
                      childName={auth.childName}
                      symptoms={auth.symptoms}
                      priority={auth.priority}
                      teacherName={auth.teacherName}
                      timestamp={auth.createdAt}
                      onAccept={handleAccept}
                      onReject={(id) => setRejectingId(id)}
                      loading={processingId === auth.id}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Reject Modal */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Authorization</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this authorization request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for rejection (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectingId(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={processingId === rejectingId}
                variant="destructive"
              >
                {processingId === rejectingId ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

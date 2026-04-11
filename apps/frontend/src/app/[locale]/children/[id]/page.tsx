'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageLoading } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Plus, X } from 'lucide-react';
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
interface AllergyDetail {
  id: string;
  name: string;
  severity_level: string;
  description?: string;
}

interface MedicationDetail {
  id: string;
  name: string;
  dosage: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
  notes?: string;
  due_date?: string;
  reminder_sent?: boolean;
  prescription_document_url?: string;
}

interface ChildDetail {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id?: string;
  blood_type?: string;
  allergies: AllergyDetail[];
  medications: MedicationDetail[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface AvailableAllergy {
  id: string;
  name: string;
  severity_level: string;
  description?: string;
}

interface AvailableMedication {
  id: string;
  name: string;
  dosage_form?: string;
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('children');
  const locale = params.locale as string;
  const childId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAllergyDialog, setShowAddAllergyDialog] = useState(false);
  const [showAddMedicationDialog, setShowAddMedicationDialog] = useState(false);
  const [selectedAllergyId, setSelectedAllergyId] = useState<string>('');
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('');
  const [medicationForm, setMedicationForm] = useState({
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescribed_by: '',
    notes: '',
    due_date: '',
    prescription_document_url: '',
  });
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [medicationError, setMedicationError] = useState<string | null>(null);

  const { data: child, loading, refetch } = useApiQuery<ChildDetail>(`/api/v1/children/${childId}`);
  const { data: allergiesResponse } = useApiQuery<{ data: AvailableAllergy[] }>(`/api/v1/allergies`);
  const availableAllergies = allergiesResponse?.data || [];
  const { data: medicationsResponse } = useApiQuery<{ data: AvailableMedication[] }>(`/api/v1/medications/catalog`);
  const availableMedications = medicationsResponse?.data || [];

  const { execute: deleteChild, loading: deleting } = useApiMutation(
    `/api/v1/children/${childId}`,
    'DELETE'
  );

  const { execute: addAllergy, loading: addingAllergy } = useApiMutation(
    `/api/v1/children/${childId}/allergies`,
    'POST'
  );

  const { execute: removeAllergy, loading: removingAllergy } = useApiMutation(
    `/api/v1/children/${childId}/allergies`,
    'DELETE'
  );

  const { execute: addMedication, loading: addingMedication } = useApiMutation(
    `/api/v1/children/${childId}/medications`,
    'POST'
  );

  const { execute: removeMedication, loading: removingMedication } = useApiMutation(
    `/api/v1/children/${childId}/medications`,
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

  const handleAddAllergy = async () => {
    if (!selectedAllergyId) return;
    setAllergyError(null);
    try {
      await addAllergy({ allergy_id: selectedAllergyId });
      setShowAddAllergyDialog(false);
      setSelectedAllergyId('');
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add allergy';
      setAllergyError(msg);
    }
  };

  const handleRemoveAllergy = async (allergyId: string) => {
    try {
      await removeAllergy(undefined, `/api/v1/children/${childId}/allergies?allergy_id=${allergyId}`);
      refetch();
    } catch (error) {
      console.error('Failed to remove allergy:', error);
    }
  };

  const handleAddMedication = async () => {
    if (!selectedMedicationId || !medicationForm.dosage) return;
    setMedicationError(null);
    try {
      await addMedication({
        medication_id: selectedMedicationId,
        dosage: medicationForm.dosage,
        ...(medicationForm.frequency && { frequency: medicationForm.frequency }),
        ...(medicationForm.start_date && { start_date: medicationForm.start_date }),
        ...(medicationForm.end_date && { end_date: medicationForm.end_date }),
        ...(medicationForm.prescribed_by && { prescribed_by: medicationForm.prescribed_by }),
        ...(medicationForm.notes && { notes: medicationForm.notes }),
        ...(medicationForm.due_date && { due_date: medicationForm.due_date }),
        ...(medicationForm.prescription_document_url && { prescription_document_url: medicationForm.prescription_document_url }),
      });
      setShowAddMedicationDialog(false);
      setSelectedMedicationId('');
      setMedicationForm({
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        prescribed_by: '',
        notes: '',
        due_date: '',
        prescription_document_url: '',
      });
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add medication';
      setMedicationError(msg);
    }
  };

  const handleRemoveMedication = async (medicationId: string) => {
    try {
      await removeMedication(undefined, `/api/v1/children/${childId}/medications?medication_id=${medicationId}`);
      refetch();
    } catch (error) {
      console.error('Failed to remove medication:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moderate':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200';
      case 'severe':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'life_threatening':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPrescriptionStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return { status: 'expired', label: t('expired'), color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' };
    } else if (daysUntilDue <= 30) {
      return { status: 'expiring', label: t('expiringSoon'), color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' };
    }
    return null;
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

          {/* Medical Information - Allergies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('allergies')}</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddAllergyDialog(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {child.allergies && child.allergies.length > 0 ? (
                <div className="space-y-2">
                  {child.allergies.map((allergy) => (
                    <motion.div
                      key={allergy.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{allergy.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(allergy.severity_level)}`}>
                            {allergy.severity_level || 'Unknown'}
                          </span>
                        </div>
                        {allergy.description && (
                          <p className="text-xs text-muted-foreground mt-1">{allergy.description}</p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveAllergy(allergy.id)}
                        disabled={removingAllergy}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('noAllergiesRecorded')}</p>
              )}
            </CardContent>
          </Card>

          {/* Medications/Prescriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medications & Prescriptions</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddMedicationDialog(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {child.medications && child.medications.length > 0 ? (
                <div className="space-y-3">
                  {child.medications.map((med) => {
                    const isContinuous = !med.end_date;
                    const prescriptionStatus = getPrescriptionStatus(med.due_date);
                    return (
                      <motion.div
                        key={med.id}
                        className="border rounded-lg p-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{med.name}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isContinuous
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                              }`}>
                                {isContinuous ? 'Continuous' : 'Temporary'}
                              </span>
                              {prescriptionStatus && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${prescriptionStatus.color}`}>
                                  {prescriptionStatus.label}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Dosage</p>
                                <p className="font-medium">{med.dosage}</p>
                              </div>
                              {med.frequency && (
                                <div>
                                  <p className="text-muted-foreground">Frequency</p>
                                  <p className="font-medium">{med.frequency}</p>
                                </div>
                              )}
                            </div>
                            {(med.start_date || med.end_date || med.due_date) && (
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                {med.start_date && (
                                  <div>
                                    <p className="text-muted-foreground">Start Date</p>
                                    <p className="font-medium">{new Date(med.start_date).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {med.end_date && (
                                  <div>
                                    <p className="text-muted-foreground">End Date</p>
                                    <p className="font-medium">{new Date(med.end_date).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {med.due_date && (
                                  <div>
                                    <p className="text-muted-foreground">{t('expiringOn')}</p>
                                    <p className="font-medium">{new Date(med.due_date).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {med.prescribed_by && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">Prescribed By</p>
                                <p className="font-medium">{med.prescribed_by}</p>
                              </div>
                            )}
                            {med.notes && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">Notes</p>
                                <p className="font-medium">{med.notes}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveMedication(med.id)}
                            disabled={removingMedication}
                            className="text-destructive hover:text-destructive mt-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No medications recorded</p>
              )}
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

      {/* Add Allergy Dialog */}
      <Dialog open={showAddAllergyDialog} onOpenChange={setShowAddAllergyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allergy</DialogTitle>
            <DialogDescription>
              Select an allergy from the available catalog to add to {child.first_name}'s record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allergyError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded text-sm">
                {allergyError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Allergy</label>
              <Select
                value={selectedAllergyId}
                onChange={(e) => setSelectedAllergyId(e.target.value)}
              >
                <option value="">Select an allergy...</option>
                {availableAllergies?.map((allergy) => (
                  <option key={allergy.id} value={allergy.id}>
                    {allergy.name} ({allergy.severity_level || 'Unknown'})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddAllergyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAllergy}
              disabled={addingAllergy || !selectedAllergyId}
            >
              {addingAllergy ? 'Adding...' : 'Add Allergy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={showAddMedicationDialog} onOpenChange={setShowAddMedicationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>
              Add a medication or prescription to {child.first_name}'s record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {medicationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded text-sm">
                {medicationError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Medication *</label>
              <Select
                value={selectedMedicationId}
                onChange={(e) => setSelectedMedicationId(e.target.value)}
              >
                <option value="">Select a medication...</option>
                {availableMedications?.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name} {med.dosage_form ? `(${med.dosage_form})` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Dosage *</label>
              <Input
                placeholder="e.g., 10mg, 2 puffs"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Frequency</label>
              <Input
                placeholder="e.g., 3 times daily"
                value={medicationForm.frequency}
                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Start Date</label>
                <Input
                  type="date"
                  value={medicationForm.start_date}
                  onChange={(e) => setMedicationForm({ ...medicationForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">End Date</label>
                <Input
                  type="date"
                  value={medicationForm.end_date}
                  onChange={(e) => setMedicationForm({ ...medicationForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Prescribed By</label>
              <Input
                placeholder="Doctor name"
                value={medicationForm.prescribed_by}
                onChange={(e) => setMedicationForm({ ...medicationForm, prescribed_by: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <Input
                placeholder="Any additional notes"
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Prescription Expiry Date</label>
              <Input
                type="date"
                value={medicationForm.due_date}
                onChange={(e) => setMedicationForm({ ...medicationForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Prescription Document URL</label>
              <Input
                placeholder="https://..."
                value={medicationForm.prescription_document_url}
                onChange={(e) => setMedicationForm({ ...medicationForm, prescription_document_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMedicationDialog(false);
                setSelectedMedicationId('');
                setMedicationForm({
                  dosage: '',
                  frequency: '',
                  start_date: '',
                  end_date: '',
                  prescribed_by: '',
                  notes: '',
                  due_date: '',
                  prescription_document_url: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMedication}
              disabled={addingMedication || !selectedMedicationId || !medicationForm.dosage}
            >
              {addingMedication ? 'Adding...' : 'Add Medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

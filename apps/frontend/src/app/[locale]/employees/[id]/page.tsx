'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';

interface AllergyDetail {
  id: string;
  name: string;
  severity_level: string;
  description?: string;
  reaction_description?: string;
}

interface MedicationDetail {
  id: string;
  name: string;
  dosage_form?: string;
  dosage: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
  notes?: string;
  due_date?: string;
}

interface AvailableAllergy {
  id: string;
  name: string;
  severity_level: string;
}

interface AvailableMedication {
  id: string;
  name: string;
  dosage_form?: string;
}

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
  allergies: AllergyDetail[];
  medications: MedicationDetail[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('employees');
  const locale = params.locale as string;
  const employeeId = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAllergyDialog, setShowAddAllergyDialog] = useState(false);
  const [showAddMedicationDialog, setShowAddMedicationDialog] = useState(false);
  const [selectedAllergyId, setSelectedAllergyId] = useState('');
  const [selectedMedicationId, setSelectedMedicationId] = useState('');
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [medicationError, setMedicationError] = useState<string | null>(null);
  const [medicationForm, setMedicationForm] = useState({
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescribed_by: '',
    notes: '',
    due_date: '',
  });

  const { data: employee, loading, refetch } = useApiQuery<EmployeeDetail>(
    `/api/v1/employees/${employeeId}`
  );
  const { data: allergiesResponse } = useApiQuery<{ data: AvailableAllergy[] }>('/api/v1/allergies');
  const availableAllergies = allergiesResponse?.data || [];
  const { data: medicationsResponse } = useApiQuery<{ data: AvailableMedication[] }>('/api/v1/medications/catalog');
  const availableMedications = medicationsResponse?.data || [];

  const { execute: deleteEmployee, loading: deleting } = useApiMutation(
    `/api/v1/employees/${employeeId}`,
    'DELETE'
  );
  const { execute: addAllergy, loading: addingAllergy } = useApiMutation(
    `/api/v1/employees/${employeeId}/allergies`,
    'POST'
  );
  const { execute: removeAllergy } = useApiMutation(
    `/api/v1/employees/${employeeId}/allergies`,
    'DELETE'
  );
  const { execute: addMedication, loading: addingMedication } = useApiMutation(
    `/api/v1/employees/${employeeId}/medications`,
    'POST'
  );
  const { execute: removeMedication } = useApiMutation(
    `/api/v1/employees/${employeeId}/medications`,
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

  const handleAddAllergy = async () => {
    if (!selectedAllergyId) return;
    setAllergyError(null);
    try {
      await addAllergy({ allergy_id: selectedAllergyId });
      setShowAddAllergyDialog(false);
      setSelectedAllergyId('');
      refetch();
    } catch (error) {
      setAllergyError(error instanceof Error ? error.message : 'Failed to add allergy');
    }
  };

  const handleRemoveAllergy = async (allergyId: string) => {
    try {
      await removeAllergy(undefined, `/api/v1/employees/${employeeId}/allergies?allergy_id=${allergyId}`);
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
      });
      setShowAddMedicationDialog(false);
      setSelectedMedicationId('');
      setMedicationForm({ dosage: '', frequency: '', start_date: '', end_date: '', prescribed_by: '', notes: '', due_date: '' });
      refetch();
    } catch (error) {
      setMedicationError(error instanceof Error ? error.message : 'Failed to add medication');
    }
  };

  const handleRemoveMedication = async (medicationId: string) => {
    try {
      await removeMedication(undefined, `/api/v1/employees/${employeeId}/medications?medication_id=${medicationId}`);
      refetch();
    } catch (error) {
      console.error('Failed to remove medication:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'mild': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moderate': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200';
      case 'severe': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'life_threatening': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) return <PageLoading />;

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="outline" onClick={() => router.push(`/${locale}/employees`)} className="mt-4">
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/employees`)}>
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
          <Button variant="outline" onClick={() => router.push(`/${locale}/employees/${employeeId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader><CardTitle>{t('personalInfo')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t('firstName')}</p>
                  <p className="text-lg font-semibold">{employee.first_name} {employee.last_name}</p>
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
            <CardHeader><CardTitle>{t('employmentInfo')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('department')}</p>
                  <p className="text-lg font-semibold">{employee.department_id ? t('assigned') : t('notAssigned')}</p>
                </div>
                {employee.hire_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('hireDate')}</p>
                    <p className="text-lg font-semibold">{new Date(employee.hire_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Allergies</CardTitle>
              <Button size="sm" onClick={() => setShowAddAllergyDialog(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {employee.allergies && employee.allergies.length > 0 ? (
                <div className="space-y-2">
                  {employee.allergies.map((allergy) => (
                    <motion.div key={allergy.id} className="flex items-center justify-between p-3 border rounded-lg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{allergy.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(allergy.severity_level)}`}>
                            {allergy.severity_level || 'Unknown'}
                          </span>
                        </div>
                        {allergy.description && <p className="text-xs text-muted-foreground mt-1">{allergy.description}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveAllergy(allergy.id)} className="text-destructive hover:text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No allergies recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medications & Prescriptions</CardTitle>
              <Button size="sm" onClick={() => setShowAddMedicationDialog(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {employee.medications && employee.medications.length > 0 ? (
                <div className="space-y-3">
                  {employee.medications.map((med) => (
                    <motion.div key={`${med.id}-${med.dosage}`} className="border rounded-lg p-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{med.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${!med.end_date ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'}`}>
                              {!med.end_date ? 'Continuous' : 'Temporary'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div><p className="text-muted-foreground">Dosage</p><p className="font-medium">{med.dosage}</p></div>
                            {med.frequency && <div><p className="text-muted-foreground">Frequency</p><p className="font-medium">{med.frequency}</p></div>}
                          </div>
                          {med.prescribed_by && (
                            <div className="mt-2 text-sm"><p className="text-muted-foreground">Prescribed By</p><p className="font-medium">{med.prescribed_by}</p></div>
                          )}
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveMedication(med.id)} className="text-destructive hover:text-destructive mt-1">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No medications recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {employee.notes && (
            <Card>
              <CardHeader><CardTitle>{t('notes')}</CardTitle></CardHeader>
              <CardContent><p className="text-foreground whitespace-pre-wrap">{employee.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('status')}</CardTitle></CardHeader>
            <CardContent>
              <Badge variant={!employee.is_archived ? 'success' : 'secondary'}>
                {employee.is_archived ? t('archived') : t('active')}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('recordDates')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-muted-foreground">{t('created')}</p><p>{new Date(employee.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-muted-foreground">{t('lastUpdated')}</p><p>{new Date(employee.updated_at).toLocaleDateString()}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Allergy Dialog */}
      <Dialog open={showAddAllergyDialog} onOpenChange={setShowAddAllergyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allergy</DialogTitle>
            <DialogDescription>Select an allergy to add to {employee.first_name}'s record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allergyError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded text-sm">{allergyError}</div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Allergy</label>
              <Select value={selectedAllergyId} onChange={(e) => setSelectedAllergyId(e.target.value)}>
                <option value="">Select an allergy...</option>
                {availableAllergies?.map((allergy) => (
                  <option key={allergy.id} value={allergy.id}>{allergy.name} ({allergy.severity_level || 'Unknown'})</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAllergyDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAllergy} disabled={addingAllergy || !selectedAllergyId}>
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
            <DialogDescription>Add a medication to {employee.first_name}'s record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {medicationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded text-sm">{medicationError}</div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Medication *</label>
              <Select value={selectedMedicationId} onChange={(e) => setSelectedMedicationId(e.target.value)}>
                <option value="">Select a medication...</option>
                {availableMedications?.map((med) => (
                  <option key={med.id} value={med.id}>{med.name} {med.dosage_form ? `(${med.dosage_form})` : ''}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Dosage *</label>
              <Input placeholder="e.g., 10mg, 2 puffs" value={medicationForm.dosage} onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Frequency</label>
              <Input placeholder="e.g., 3 times daily" value={medicationForm.frequency} onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Start Date</label>
                <Input type="date" value={medicationForm.start_date} onChange={(e) => setMedicationForm({ ...medicationForm, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">End Date</label>
                <Input type="date" value={medicationForm.end_date} onChange={(e) => setMedicationForm({ ...medicationForm, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Prescribed By</label>
              <Input placeholder="Doctor name" value={medicationForm.prescribed_by} onChange={(e) => setMedicationForm({ ...medicationForm, prescribed_by: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <Input placeholder="Any additional notes" value={medicationForm.notes} onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Prescription Expiry Date</label>
              <Input type="date" value={medicationForm.due_date} onChange={(e) => setMedicationForm({ ...medicationForm, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMedicationDialog(false); setSelectedMedicationId(''); setMedicationForm({ dosage: '', frequency: '', start_date: '', end_date: '', prescribed_by: '', notes: '', due_date: '' }); }}>Cancel</Button>
            <Button onClick={handleAddMedication} disabled={addingMedication || !selectedMedicationId || !medicationForm.dosage}>
              {addingMedication ? 'Adding...' : 'Add Medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteEmployee')}</DialogTitle>
            <DialogDescription>{t('deleteConfirmation', { name: `${employee.first_name} ${employee.last_name}` })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? t('deleting') : t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

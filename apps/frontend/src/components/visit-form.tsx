'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { VitalsForm, type Vitals } from '@/components/vitals-form';
import {
  MedicationAdminForm,
  type MedicationAdministration,
} from '@/components/medication-admin-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Pill } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { calculateAgeInMonths } from '@/lib/vitals-evaluation';

export interface VisitFormData {
  childId: string;
  employeeId?: string;
  authorizationId?: string;
  visitType: 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
  chiefComplaint: string;
  vitals: Vitals;
  assessment: string;
  treatment: string;
  medications: MedicationAdministration[];
  disposition: 'returned_to_class' | 'sent_home' | 'referred' | 'hospitalized';
  notifyParent: boolean;
}

interface ChildOption {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
}

interface ChildAllergyMedication {
  allergies: Array<{
    name: string;
    severity_level: string;
    reaction_description: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date: string | null;
  }>;
}

interface VisitFormProps {
  onSubmit: (data: VisitFormData) => Promise<void>;
  initialValues?: Partial<VisitFormData>;
  childName?: string;
  loading?: boolean;
  availableMedications?: Array<{ id: string; name: string }>;
  availableChildren?: ChildOption[];
  readOnly?: boolean;
}

const defaultVitals: Vitals = {
  temperature: null,
  temperatureUnit: 'C',
  systolicBP: null,
  diastolicBP: null,
  heartRate: null,
  weight: null,
  weightUnit: 'kg',
};

export function VisitForm({
  onSubmit,
  initialValues,
  childName,
  loading = false,
  availableMedications = [],
  availableChildren = [],
  readOnly = false,
}: VisitFormProps) {
  const [formData, setFormData] = useState<VisitFormData>({
    childId: initialValues?.childId ?? '',
    employeeId: initialValues?.employeeId,
    authorizationId: initialValues?.authorizationId,
    visitType: initialValues?.visitType ?? 'walk_in',
    chiefComplaint: initialValues?.chiefComplaint ?? '',
    vitals: initialValues?.vitals ?? defaultVitals,
    assessment: initialValues?.assessment ?? '',
    treatment: initialValues?.treatment ?? '',
    medications: initialValues?.medications ?? [],
    disposition: initialValues?.disposition ?? 'returned_to_class',
    notifyParent: initialValues?.notifyParent ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [childSummary, setChildSummary] = useState<ChildAllergyMedication | null>(null);
  const [loadingChildSummary, setLoadingChildSummary] = useState(false);
  const [childAgeInMonths, setChildAgeInMonths] = useState<number | undefined>(undefined);

  // Fetch child allergies and medications when childId changes
  useEffect(() => {
    if (!formData.childId) {
      setChildSummary(null);
      setChildAgeInMonths(undefined);
      return;
    }

    const fetchChildSummary = async () => {
      setLoadingChildSummary(true);
      try {
        const summary = await apiGet<{ data: ChildAllergyMedication & { date_of_birth?: string } }>(
          `/api/v1/children/${formData.childId}/summary`
        );

        if (summary.data) {
          setChildSummary({
            allergies: summary.data.allergies || [],
            medications: summary.data.medications || [],
          });

          // Calculate age in months if date_of_birth is available
          if (summary.data.date_of_birth) {
            const ageInMonths = calculateAgeInMonths(summary.data.date_of_birth);
            setChildAgeInMonths(ageInMonths);
          }
        }
      } catch (error) {
        console.error('Failed to fetch child summary:', error);
        setChildSummary(null);
      } finally {
        setLoadingChildSummary(false);
      }
    };

    fetchChildSummary();
  }, [formData.childId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Either child_id or employee_id must be provided
    if (!formData.childId?.trim() && !formData.employeeId?.trim()) {
      newErrors.child = 'Child or employee must be selected';
    }

    // Chief complaint is required
    if (!formData.chiefComplaint?.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }

    // Assessment is required
    if (!formData.assessment?.trim()) {
      newErrors.assessment = 'Assessment is required';
    }

    // Treatment is required
    if (!formData.treatment?.trim()) {
      newErrors.treatment = 'Treatment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof VisitFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors below before submitting
          </AlertDescription>
        </Alert>
      )}

      {/* Visit Type */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
          <CardDescription>Basic visit details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Child *
            </label>
            {childName ? (
              <div className="mt-1 p-2 bg-muted rounded-md text-foreground">
                {childName}
              </div>
            ) : (
              <select
                value={formData.childId}
                onChange={(e) => handleFieldChange('childId', e.target.value)}
                disabled={readOnly}
                className={`w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950 ${errors.child ? 'border-red-500' : ''}`}
              >
                <option value="">Select a child...</option>
                {availableChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.child && (
              <p className="text-xs text-red-600 mt-1">{errors.child}</p>
            )}
          </div>

          {/* Child Allergies & Medications */}
          {!childName && formData.childId && (
            <>
              {loadingChildSummary && (
                <div className="text-sm text-muted-foreground">
                  Loading child information...
                </div>
              )}

              {/* Allergies Alert */}
              {childSummary && childSummary.allergies && childSummary.allergies.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Allergies</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      {childSummary.allergies.map((allergy, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{allergy.name}</p>
                            {allergy.reaction_description && (
                              <p className="text-sm opacity-90">
                                Reaction: {allergy.reaction_description}
                              </p>
                            )}
                          </div>
                          <Badge variant="destructive">
                            {allergy.severity_level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Medications Alert */}
              {childSummary && childSummary.medications && childSummary.medications.length > 0 && (
                <Alert className="mt-4 bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800">
                  <Pill className="h-4 w-4" />
                  <AlertTitle className="text-sky-900 dark:text-sky-200">
                    Active Medications
                  </AlertTitle>
                  <AlertDescription className="text-sky-800 dark:text-sky-300">
                    <div className="space-y-2 mt-2">
                      {childSummary.medications.map((med, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{med.name}</p>
                          <p className="opacity-90">
                            {med.dosage} - {med.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">
              Visit Type *
            </label>
            <select
              value={formData.visitType}
              onChange={(e) =>
                handleFieldChange('visitType', e.target.value)
              }
              disabled={readOnly}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="authorization">From Authorization</option>
              <option value="walk_in">Walk-in</option>
              <option value="scheduled">Scheduled</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Chief Complaint *
            </label>
            <Textarea
              placeholder="Describe the child's main complaint or concern"
              value={formData.chiefComplaint}
              onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
              disabled={readOnly}
              className={errors.chiefComplaint ? 'border-red-500' : ''}
            />
            {errors.chiefComplaint && (
              <p className="text-xs text-red-600 mt-1">{errors.chiefComplaint}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs</CardTitle>
          <CardDescription>Physical measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <VitalsForm
            initialValues={formData.vitals}
            onChange={(vitals) => handleFieldChange('vitals', vitals)}
            readOnly={readOnly}
            childAgeInMonths={childAgeInMonths}
          />
        </CardContent>
      </Card>

      {/* Assessment & Treatment */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment & Treatment</CardTitle>
          <CardDescription>Medical findings and interventions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Assessment *
            </label>
            <Textarea
              placeholder="Clinical assessment and findings"
              value={formData.assessment}
              onChange={(e) => handleFieldChange('assessment', e.target.value)}
              disabled={readOnly}
              rows={4}
              className={errors.assessment ? 'border-red-500' : ''}
            />
            {errors.assessment && (
              <p className="text-xs text-red-600 mt-1">{errors.assessment}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Treatment *
            </label>
            <Textarea
              placeholder="Treatment provided or recommended"
              value={formData.treatment}
              onChange={(e) => handleFieldChange('treatment', e.target.value)}
              disabled={readOnly}
              rows={4}
              className={errors.treatment ? 'border-red-500' : ''}
            />
            {errors.treatment && (
              <p className="text-xs text-red-600 mt-1">{errors.treatment}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
          <CardDescription>Medications administered during visit</CardDescription>
        </CardHeader>
        <CardContent>
          <MedicationAdminForm
            medications={formData.medications}
            onMedicationsChange={(meds) =>
              handleFieldChange('medications', meds)
            }
            availableMedications={availableMedications}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>

      {/* Disposition & Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Disposition</CardTitle>
          <CardDescription>Next steps and parent notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Disposition *
            </label>
            <select
              value={formData.disposition || 'returned_to_class'}
              onChange={(e) =>
                handleFieldChange('disposition', e.target.value as any)
              }
              disabled={readOnly}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="returned_to_class">Returned to Class</option>
              <option value="sent_home">Sent Home</option>
              <option value="referred">Referred</option>
              <option value="hospitalized">Hospitalized</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notifyParent"
              checked={formData.notifyParent}
              onChange={(e) =>
                handleFieldChange('notifyParent', e.target.checked)
              }
              disabled={readOnly}
              className="rounded border-border"
            />
            <label
              htmlFor="notifyParent"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Notify Parent
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {!readOnly && (
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Visit'}
          </Button>
        </div>
      )}
    </form>
  );
}

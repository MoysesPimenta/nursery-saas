'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VitalsForm, type Vitals } from '@/components/vitals-form';
import {
  MedicationAdminForm,
  type MedicationAdministration,
} from '@/components/medication-admin-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

interface VisitFormProps {
  onSubmit: (data: VisitFormData) => Promise<void>;
  initialValues?: Partial<VisitFormData>;
  childName?: string;
  loading?: boolean;
  availableMedications?: Array<{ id: string; name: string }>;
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.childId && !formData.employeeId) {
      newErrors.child = 'Child or employee must be selected';
    }
    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }
    if (!formData.assessment.trim()) {
      newErrors.assessment = 'Assessment is required';
    }
    if (!formData.treatment.trim()) {
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
              Child Name
            </label>
            {childName ? (
              <div className="mt-1 p-2 bg-muted rounded-md text-foreground">
                {childName}
              </div>
            ) : (
              <Input
                type="text"
                placeholder="Enter child name"
                disabled={readOnly}
              />
            )}
          </div>

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
            onSubmit={(vitals) => handleFieldChange('vitals', vitals)}
            readOnly={readOnly}
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
              value={formData.disposition}
              onChange={(e) =>
                handleFieldChange('disposition', e.target.value)
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

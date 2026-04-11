'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { z } from 'zod';

interface AllergyItem {
  id: string;
  name: string;
}

interface MedicationItem {
  id: string;
  name: string;
}

interface SelectedMedication {
  medicationId: string;
  dosage: string;
  frequency?: string;
}

const childSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  classId: z.string().optional(),
  bloodType: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelation: z.string().optional(),
  notes: z.string().optional(),
});

type ChildFormData = z.infer<typeof childSchema>;

export default function NewChildPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<ChildFormData>>({
    gender: 'M',
  });
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);
  const [medicationForm, setMedicationForm] = useState({ medicationId: '', dosage: '', frequency: '' });

  const { execute: createChild, loading } = useApiMutation<{ id: string }>(
    '/api/v1/children',
    'POST'
  );

  const { execute: addAllergy } = useApiMutation(
    '/api/v1/children/{id}/allergies',
    'POST'
  );

  const { execute: addMedication } = useApiMutation(
    '/api/v1/children/{id}/medications',
    'POST'
  );

  // Fetch classes from API instead of hardcoding
  const { data: classesData } = useApiQuery<{ data: Array<{ id: string; name: string }> }>(
    '/api/v1/classes'
  );
  const classes = classesData?.data || [];

  // Fetch allergies catalog (paginated)
  const { data: allergiesData } = useApiQuery<{ data: AllergyItem[] }>(
    '/api/v1/allergies'
  );
  const allergies = allergiesData?.data || [];

  // Fetch medications catalog (returns { data: [...] })
  const { data: medicationsResponse } = useApiQuery<{ data: MedicationItem[] }>(
    '/api/v1/medications/catalog'
  );
  const medications = medicationsResponse?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    } else if (step === 1) {
      if (!formData.emergencyContactName)
        newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone)
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAllergy = (allergyId: string) => {
    if (allergyId && !selectedAllergies.includes(allergyId)) {
      setSelectedAllergies([...selectedAllergies, allergyId]);
    }
  };

  const handleRemoveAllergy = (allergyId: string) => {
    setSelectedAllergies(selectedAllergies.filter((id) => id !== allergyId));
  };

  const handleAddMedication = () => {
    if (medicationForm.medicationId && medicationForm.dosage) {
      setSelectedMedications([
        ...selectedMedications,
        {
          medicationId: medicationForm.medicationId,
          dosage: medicationForm.dosage,
          frequency: medicationForm.frequency,
        },
      ]);
      setMedicationForm({ medicationId: '', dosage: '', frequency: '' });
    }
  };

  const handleRemoveMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      // Convert camelCase form fields to snake_case for the API
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        class_id: formData.classId || undefined,
        blood_type: formData.bloodType || undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relation: formData.emergencyContactRelation || undefined,
        notes: formData.notes || undefined,
      };
      const result = await createChild(payload);
      const childId = result.id;

      // Submit allergies
      for (const allergyId of selectedAllergies) {
        await addAllergy({ allergy_id: allergyId }, `/api/v1/children/${childId}/allergies`);
      }

      // Submit medications
      for (const medication of selectedMedications) {
        await addMedication(
          {
            medication_id: medication.medicationId,
            dosage: medication.dosage,
            frequency: medication.frequency || undefined,
          },
          `/api/v1/children/${childId}/medications`
        );
      }

      router.push(`/${locale}/children/${childId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create child';
      setErrors({ submit: message });
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Child</h1>
        <p className="text-muted-foreground mt-1">
          Create a new child profile in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step + 1} of 3</CardTitle>
          <CardDescription>
            {step === 0
              ? 'Personal Information'
              : step === 1
              ? 'Emergency Contact Information'
              : 'Medical Information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            {step === 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" error={errors.firstName} required>
                    <Input
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                    />
                  </FormField>
                  <FormField label="Last Name" error={errors.lastName} required>
                    <Input
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField label="Date of Birth" error={errors.dateOfBirth} required>
                  <Input
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Gender" error={errors.gender} required>
                  <Select
                    name="gender"
                    value={formData.gender || 'M'}
                    onChange={handleChange}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Select>
                </FormField>

                <FormField label="Class">
                  <Select name="classId" value={formData.classId || ''} onChange={handleChange}>
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Blood Type">
                  <Select name="bloodType" value={formData.bloodType || ''} onChange={handleChange}>
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Select>
                </FormField>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FormField
                  label="Emergency Contact Name"
                  error={errors.emergencyContactName}
                  required
                >
                  <Input
                    name="emergencyContactName"
                    placeholder="Parent/Guardian Name"
                    value={formData.emergencyContactName || ''}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField
                  label="Emergency Contact Phone"
                  error={errors.emergencyContactPhone}
                  required
                >
                  <PhoneInput
                    name="emergencyContactPhone"
                    placeholder="11 99999-9999"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, emergencyContactPhone: value }));
                      if (errors.emergencyContactPhone) {
                        setErrors((prev) => ({ ...prev, emergencyContactPhone: '' }));
                      }
                    }}
                  />
                </FormField>

                <FormField label="Relationship">
                  <Input
                    name="emergencyContactRelation"
                    placeholder="e.g., Mother, Father, Guardian"
                    value={formData.emergencyContactRelation || ''}
                    onChange={handleChange}
                  />
                </FormField>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FormField label="Allergies">
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAllergy(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select an allergy to add...</option>
                    {allergies
                      .filter((allergy) => !selectedAllergies.includes(allergy.id))
                      .map((allergy) => (
                        <option key={allergy.id} value={allergy.id}>
                          {allergy.name}
                        </option>
                      ))}
                  </Select>
                </FormField>

                {selectedAllergies.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergies.map((allergyId) => {
                        const allergy = allergies.find((a) => a.id === allergyId);
                        return (
                          <Badge key={allergyId} variant="secondary" className="flex items-center gap-1">
                            {allergy?.name}
                            <button
                              onClick={() => handleRemoveAllergy(allergyId)}
                              className="ml-1 hover:opacity-70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <label className="text-sm font-medium block mb-4">Continuous Medications</label>

                  <div className="space-y-4 mb-4">
                    <FormField label="Medication">
                      <Select
                        value={medicationForm.medicationId}
                        onChange={(e) =>
                          setMedicationForm((prev) => ({ ...prev, medicationId: e.target.value }))
                        }
                      >
                        <option value="">Select a medication...</option>
                        {medications.map((med) => (
                          <option key={med.id} value={med.id}>
                            {med.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Dosage (e.g., 500mg, 1 tablet)">
                      <Input
                        type="text"
                        placeholder="500mg"
                        value={medicationForm.dosage}
                        onChange={(e) =>
                          setMedicationForm((prev) => ({ ...prev, dosage: e.target.value }))
                        }
                      />
                    </FormField>

                    <FormField label="Frequency (Optional)">
                      <Input
                        type="text"
                        placeholder="e.g., Twice daily, Every 8 hours"
                        value={medicationForm.frequency}
                        onChange={(e) =>
                          setMedicationForm((prev) => ({ ...prev, frequency: e.target.value }))
                        }
                      />
                    </FormField>

                    <Button
                      onClick={handleAddMedication}
                      disabled={!medicationForm.medicationId || !medicationForm.dosage}
                      variant="outline"
                      className="w-full"
                    >
                      Add Medication
                    </Button>
                  </div>

                  {selectedMedications.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Added Medications</label>
                      <div className="space-y-2">
                        {selectedMedications.map((med, index) => {
                          const medication = medications.find((m) => m.id === med.medicationId);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded"
                            >
                              <div>
                                <p className="font-medium text-sm">{medication?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {med.dosage}
                                  {med.frequency && ` • ${med.frequency}`}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveMedication(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <FormField label="Additional Notes">
                  <Textarea
                    name="notes"
                    placeholder="Any additional medical information or special notes..."
                    value={formData.notes || ''}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </FormField>
              </motion.div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 0 || loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {step < 2 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Child'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

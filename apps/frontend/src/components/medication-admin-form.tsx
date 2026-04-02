'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

export interface MedicationAdministration {
  id?: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  time: string;
  notes?: string;
}

interface MedicationAdminFormProps {
  medications: MedicationAdministration[];
  onMedicationsChange: (medications: MedicationAdministration[]) => void;
  availableMedications: Array<{ id: string; name: string }>;
  readOnly?: boolean;
}

export function MedicationAdminForm({
  medications,
  onMedicationsChange,
  availableMedications,
  readOnly = false,
}: MedicationAdminFormProps) {
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddMedication = () => {
    if (!selectedMedId || !dosage || !time) {
      alert('Please fill in all required fields');
      return;
    }

    const med = availableMedications.find((m) => m.id === selectedMedId);
    if (!med) return;

    const newMedication: MedicationAdministration = {
      id: Date.now().toString(),
      medicationId: selectedMedId,
      medicationName: med.name,
      dosage,
      time,
      notes: notes || undefined,
    };

    onMedicationsChange([...medications, newMedication]);

    // Reset form
    setSelectedMedId('');
    setDosage('');
    setTime('');
    setNotes('');
  };

  const handleRemoveMedication = (id: string | undefined) => {
    if (!id) return;
    onMedicationsChange(medications.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-semibold text-foreground">
        Medication Administration
      </h3>

      {/* Add Medication Section */}
      {!readOnly && (
        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Medication *
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Select medication...</option>
                {availableMedications.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Dosage *
              </label>
              <Input
                type="text"
                placeholder="e.g., 5ml, 2 tablets"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Time *
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <Input
                type="text"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddMedication}
            className="w-full"
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>
      )}

      {/* Medications List */}
      {medications.length > 0 ? (
        <div className="space-y-2">
          {medications.map((med) => (
            <div
              key={med.id}
              className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg bg-white dark:bg-slate-950"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {med.medicationName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {med.dosage} at {med.time}
                  {med.notes && ` - ${med.notes}`}
                </div>
              </div>
              {!readOnly && (
                <button
                  onClick={() => handleRemoveMedication(med.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          No medications administered yet
        </div>
      )}
    </div>
  );
}

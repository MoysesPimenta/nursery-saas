'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Thermometer } from 'lucide-react';

interface VitalsFormProps {
  onSubmit?: (vitals: Vitals) => void;
  initialValues?: Partial<Vitals>;
  readOnly?: boolean;
}

export interface Vitals {
  temperature: number | null;
  temperatureUnit: 'C' | 'F';
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  weightUnit: 'kg' | 'lb';
}

export function VitalsForm({
  onSubmit,
  initialValues,
  readOnly = false,
}: VitalsFormProps) {
  const [vitals, setVitals] = useState<Vitals>({
    temperature: initialValues?.temperature ?? null,
    temperatureUnit: initialValues?.temperatureUnit ?? 'C',
    systolicBP: initialValues?.systolicBP ?? null,
    diastolicBP: initialValues?.diastolicBP ?? null,
    heartRate: initialValues?.heartRate ?? null,
    weight: initialValues?.weight ?? null,
    weightUnit: initialValues?.weightUnit ?? 'kg',
  });

  const handleChange = (field: keyof Vitals, value: any) => {
    setVitals((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(vitals);
  };

  const convertTemperature = (value: number, to: 'C' | 'F'): string => {
    if (!value) return '';
    if (vitals.temperatureUnit === to) return value.toFixed(1);
    if (to === 'F') return ((value * 9) / 5 + 32).toFixed(1);
    return (((value - 32) * 5) / 9).toFixed(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Temperature
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder={`Enter temp (${vitals.temperatureUnit})`}
              value={vitals.temperature ?? ''}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              disabled={readOnly}
              className="flex-1"
            />
            <select
              value={vitals.temperatureUnit}
              onChange={(e) => handleChange('temperatureUnit', e.target.value)}
              disabled={readOnly}
              className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="C">°C</option>
              <option value="F">°F</option>
            </select>
          </div>
          {vitals.temperature && (
            <div className="text-xs text-slate-600 dark:text-slate-400">
              = {convertTemperature(vitals.temperature, vitals.temperatureUnit === 'C' ? 'F' : 'C')}°
              {vitals.temperatureUnit === 'C' ? 'F' : 'C'}
            </div>
          )}
        </div>

        {/* Blood Pressure */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
            Blood Pressure (mmHg)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Systolic"
              value={vitals.systolicBP ?? ''}
              onChange={(e) => handleChange('systolicBP', parseInt(e.target.value))}
              disabled={readOnly}
              className="flex-1"
            />
            <span className="flex items-center text-slate-400 dark:text-slate-600">/</span>
            <Input
              type="number"
              placeholder="Diastolic"
              value={vitals.diastolicBP ?? ''}
              onChange={(e) => handleChange('diastolicBP', parseInt(e.target.value))}
              disabled={readOnly}
              className="flex-1"
            />
          </div>
        </div>

        {/* Heart Rate */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
            Heart Rate (bpm)
          </label>
          <Input
            type="number"
            placeholder="Enter heart rate"
            value={vitals.heartRate ?? ''}
            onChange={(e) => handleChange('heartRate', parseInt(e.target.value))}
            disabled={readOnly}
          />
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-50">Weight</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Enter weight"
              value={vitals.weight ?? ''}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
              disabled={readOnly}
              className="flex-1"
            />
            <select
              value={vitals.weightUnit}
              onChange={(e) => handleChange('weightUnit', e.target.value)}
              disabled={readOnly}
              className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
      </div>

      {onSubmit && (
        <Button
          type="submit"
          disabled={readOnly}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Save Vitals
        </Button>
      )}
    </form>
  );
}

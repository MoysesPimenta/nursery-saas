'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Thermometer } from 'lucide-react';

interface VitalsFormProps {
  onSubmit?: (vitals: Vitals) => void;
  onChange?: (vitals: Vitals) => void;
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
  onChange,
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
    const updated = {
      ...vitals,
      [field]: value === '' ? null : value,
    };
    setVitals(updated);
    // Notify parent immediately when used inline (onChange mode)
    onChange?.(updated);
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

  // Validation ranges
  const validateTemperature = (value: number): boolean => {
    // Convert to Celsius if needed for validation
    const tempC = vitals.temperatureUnit === 'F' ? ((value - 32) * 5) / 9 : value;
    return tempC >= 35.0 && tempC <= 42.0;
  };

  const validateHeartRate = (value: number): boolean => value >= 40 && value <= 200;
  const validateSystolicBP = (value: number): boolean => value >= 60 && value <= 250;
  const validateDiastolicBP = (value: number): boolean => value >= 30 && value <= 150;
  const validateWeight = (value: number): boolean => value >= 1 && value <= 300;

  const isTemperatureUnusual = vitals.temperature !== null && !validateTemperature(vitals.temperature);
  const isHeartRateUnusual = vitals.heartRate !== null && !validateHeartRate(vitals.heartRate);
  const isSystolicBPUnusual = vitals.systolicBP !== null && !validateSystolicBP(vitals.systolicBP);
  const isDiastolicBPUnusual = vitals.diastolicBP !== null && !validateDiastolicBP(vitals.diastolicBP);
  const isWeightUnusual = vitals.weight !== null && !validateWeight(vitals.weight);

  const Wrapper = onChange ? 'div' : 'form';
  const wrapperProps = onChange ? {} : { onSubmit: handleSubmit };

  return (
    <Wrapper {...wrapperProps as any} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
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
              className={`flex-1 ${isTemperatureUnusual ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            />
            <select
              value={vitals.temperatureUnit}
              onChange={(e) => handleChange('temperatureUnit', e.target.value)}
              disabled={readOnly}
              className="px-3 py-2 border border-border rounded-md bg-white text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="C">°C</option>
              <option value="F">°F</option>
            </select>
          </div>
          {vitals.temperature && (
            <div className="text-xs text-muted-foreground">
              = {convertTemperature(vitals.temperature, vitals.temperatureUnit === 'C' ? 'F' : 'C')}°
              {vitals.temperatureUnit === 'C' ? 'F' : 'C'}
            </div>
          )}
          {isTemperatureUnusual && (
            <div className="text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
              Warning: Temperature outside normal range (35.0-42.0°C)
            </div>
          )}
        </div>

        {/* Blood Pressure */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Blood Pressure (mmHg)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Systolic"
              value={vitals.systolicBP ?? ''}
              onChange={(e) => handleChange('systolicBP', parseInt(e.target.value))}
              disabled={readOnly}
              className={`flex-1 ${isSystolicBPUnusual ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            />
            <span className="flex items-center text-muted-foreground">/</span>
            <Input
              type="number"
              placeholder="Diastolic"
              value={vitals.diastolicBP ?? ''}
              onChange={(e) => handleChange('diastolicBP', parseInt(e.target.value))}
              disabled={readOnly}
              className={`flex-1 ${isDiastolicBPUnusual ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            />
          </div>
          {(isSystolicBPUnusual || isDiastolicBPUnusual) && (
            <div className="text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
              Warning: Blood pressure outside normal ranges (Systolic: 60-250, Diastolic: 30-150)
            </div>
          )}
        </div>

        {/* Heart Rate */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Heart Rate (bpm)
          </label>
          <Input
            type="number"
            placeholder="Enter heart rate"
            value={vitals.heartRate ?? ''}
            onChange={(e) => handleChange('heartRate', parseInt(e.target.value))}
            disabled={readOnly}
            className={`${isHeartRateUnusual ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
          />
          {isHeartRateUnusual && (
            <div className="text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
              Warning: Heart rate outside normal range (40-200 bpm)
            </div>
          )}
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Weight</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Enter weight"
              value={vitals.weight ?? ''}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
              disabled={readOnly}
              className={`flex-1 ${isWeightUnusual ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            />
            <select
              value={vitals.weightUnit}
              onChange={(e) => handleChange('weightUnit', e.target.value)}
              disabled={readOnly}
              className="px-3 py-2 border border-border rounded-md bg-white text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
          {isWeightUnusual && (
            <div className="text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
              Warning: Weight outside normal range (1-300 kg)
            </div>
          )}
        </div>
      </div>

      {onSubmit && !onChange && (
        <Button
          type="submit"
          disabled={readOnly}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Save Vitals
        </Button>
      )}
    </Wrapper>
  );
}

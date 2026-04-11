'use client';

import React from 'react';
import PhoneInputLib from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className,
  disabled,
  defaultCountry = 'BR',
}: PhoneInputProps) {
  return (
    <PhoneInputLib
      international
      defaultCountry={defaultCountry as any}
      value={value}
      onChange={(val) => onChange(val || '')}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    />
  );
}

export default PhoneInput;

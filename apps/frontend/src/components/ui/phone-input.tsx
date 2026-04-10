'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  name?: string;
}

// Country data with flag emoji and code
const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
];

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, name, placeholder, className, disabled, ...props }, ref) => {
    // Parse the initial value to extract country code and phone number
    const [countryCode, setCountryCode] = React.useState<string>('+1');
    const [phoneNumber, setPhoneNumber] = React.useState<string>('');

    // Initialize on mount from the value prop
    React.useEffect(() => {
      if (value) {
        const parsed = parsePhoneValue(value);
        setCountryCode(parsed.code);
        setPhoneNumber(parsed.number);
      }
    }, []);

    const parsePhoneValue = (val: string): { code: string; number: string } => {
      const trimmed = val.trim();
      for (const country of COUNTRIES) {
        if (trimmed.startsWith(country.code)) {
          const number = trimmed.substring(country.code.length).trim();
          return { code: country.code, number };
        }
      }
      return { code: '+1', number: trimmed };
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCode = e.target.value;
      setCountryCode(newCode);
      const fullValue = `${newCode} ${phoneNumber}`.trim();
      onChange(fullValue);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value;
      setPhoneNumber(newNumber);
      const fullValue = `${countryCode} ${newNumber}`.trim();
      onChange(fullValue);
    };

    const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

    return (
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative w-24">
          <select
            value={countryCode}
            onChange={handleCountryChange}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
              'text-center'
            )}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Phone Number Input */}
        <input
          ref={ref}
          type="tel"
          placeholder={placeholder || 'Enter phone number'}
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
          name={name}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };

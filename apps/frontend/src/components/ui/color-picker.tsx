'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
];

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ value = '#10b981', onChange, className }, ref) => {
    const [customColor, setCustomColor] = React.useState(value);
    const [showCustom, setShowCustom] = React.useState(
      !PRESET_COLORS.includes(value)
    );

    const handlePresetClick = (color: string) => {
      setCustomColor(color);
      setShowCustom(false);
      onChange?.(color);
    };

    const handleCustomChange = (newColor: string) => {
      setCustomColor(newColor);
      onChange?.(newColor);
    };

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handlePresetClick(color)}
              className={cn(
                'h-10 w-10 rounded-lg border-2 transition-all',
                customColor === color
                  ? 'border-slate-900 dark:border-slate-50'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              title={color}
            />
          ))}
        </div>

        {showCustom && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={customColor}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="#000000"
              className="font-mono text-sm"
            />
            <div
              className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700"
              style={{ backgroundColor: customColor }}
            />
          </div>
        )}

        {!showCustom && (
          <button
            onClick={() => setShowCustom(true)}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
          >
            Enter custom color
          </button>
        )}
      </div>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };

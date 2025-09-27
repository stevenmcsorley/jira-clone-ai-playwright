/**
 * Time Estimate Input Component
 *
 * Allows input in multiple formats:
 * - "1h 30m" or "1h30m"
 * - "45m" or "45 minutes"
 * - "2h" or "2 hours"
 * - "1:30" (hour:minute format)
 * - "1.5" (decimal hours)
 */

import React, { useState, useEffect } from 'react';
import { hoursToTimeInput, timeInputToHours, formatTimeInput, parseTimeString, type TimeInput } from '../../utils/timeFormat';

interface TimeEstimateInputProps {
  value?: number; // value in decimal hours
  onChange: (hours: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const TimeEstimateInput: React.FC<TimeEstimateInputProps> = ({
  value,
  onChange,
  placeholder = "e.g., 1h 30m, 45m, 2h, 1:30",
  className = "",
  disabled = false,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [preview, setPreview] = useState("");

  // Initialize input value from prop
  useEffect(() => {
    if (value && value > 0) {
      const timeInput = hoursToTimeInput(value);
      setInputValue(formatTimeInput(timeInput));
    } else {
      setInputValue("");
    }
  }, [value]);

  const validateAndPreview = (input: string) => {
    if (!input.trim()) {
      setIsValid(true);
      setPreview("");
      return;
    }

    try {
      const parsed = parseTimeString(input);
      const totalHours = timeInputToHours(parsed);

      if (totalHours > 0) {
        setIsValid(true);
        setPreview(formatTimeInput(parsed));
      } else {
        setIsValid(false);
        setPreview("");
      }
    } catch {
      setIsValid(false);
      setPreview("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    validateAndPreview(newValue);
  };

  const handleBlur = () => {
    if (!inputValue.trim()) {
      onChange(undefined);
      setPreview("");
      return;
    }

    try {
      const parsed = parseTimeString(inputValue);
      const totalHours = timeInputToHours(parsed);

      if (totalHours > 0) {
        onChange(totalHours);
        // Update input to standardized format
        setInputValue(formatTimeInput(parsed));
        setPreview("");
      } else {
        setIsValid(false);
      }
    } catch {
      setIsValid(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const baseClassName = `
    w-full px-3 py-2 border rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500
    transition-colors duration-200
    ${!isValid
      ? 'border-red-300 bg-red-50 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
  `.trim();

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${baseClassName} ${className}`}
        disabled={disabled}
        required={required}
      />

      {/* Preview/Status */}
      <div className="min-h-[1.25rem] text-xs">
        {!isValid && inputValue.trim() && (
          <span className="text-red-600">
            Invalid format. Try: 1h 30m, 45m, 2h, or 1:30
          </span>
        )}

        {isValid && preview && preview !== inputValue && (
          <span className="text-gray-500">
            Will be saved as: {preview}
          </span>
        )}

        {isValid && value && !preview && (
          <span className="text-gray-500">
            Current: {formatTimeInput(hoursToTimeInput(value))} ({value}h)
          </span>
        )}
      </div>

      {/* Format Examples */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>Examples:</div>
        <div className="grid grid-cols-2 gap-2 text-gray-500">
          <span>• 10m = 10 minutes</span>
          <span>• 1h = 1 hour</span>
          <span>• 1h 30m = 1.5 hours</span>
          <span>• 1:30 = 1.5 hours</span>
          <span>• 2.5 = 2.5 hours</span>
          <span>• 90m = 1h 30m</span>
        </div>
      </div>
    </div>
  );
};
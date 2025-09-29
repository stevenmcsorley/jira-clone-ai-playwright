/**
 * Story Point Input Component
 *
 * Allows estimation using different scales:
 * - Fibonacci: 1, 2, 3, 5, 8, 13, 21...
 * - T-Shirt: XS, S, M, L, XL, XXL
 * - Linear: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
 * - Powers of 2: 1, 2, 4, 8, 16, 32
 */

import React, { useState } from 'react'

export type EstimationScale = 'fibonacci' | 'tshirt' | 'linear' | 'power_of_2' | 'hours' | 'days'

export interface EstimationOption {
  value: string | number
  label: string
  description?: string
}

interface StoryPointInputProps {
  value?: string | number
  onChange: (value: string | number | undefined) => void
  scale?: EstimationScale
  onScaleChange?: (scale: EstimationScale) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showScaleSelector?: boolean
}

const ESTIMATION_SCALES: Record<EstimationScale, EstimationOption[]> = {
  fibonacci: [
    { value: 0, label: '0', description: 'No effort required' },
    { value: 0.5, label: '½', description: 'Minimal effort' },
    { value: 1, label: '1', description: 'Very small effort' },
    { value: 2, label: '2', description: 'Small effort' },
    { value: 3, label: '3', description: 'Small-medium effort' },
    { value: 5, label: '5', description: 'Medium effort' },
    { value: 8, label: '8', description: 'Large effort' },
    { value: 13, label: '13', description: 'Very large effort' },
    { value: 21, label: '21', description: 'Extra large effort' },
    { value: '?', label: '?', description: 'Need more information' },
  ],

  tshirt: [
    { value: 'XS', label: 'XS', description: 'Extra Small - Quick fix' },
    { value: 'S', label: 'S', description: 'Small - Minor feature' },
    { value: 'M', label: 'M', description: 'Medium - Standard feature' },
    { value: 'L', label: 'L', description: 'Large - Major feature' },
    { value: 'XL', label: 'XL', description: 'Extra Large - Complex feature' },
    { value: 'XXL', label: 'XXL', description: 'Huge - Consider breaking down' },
    { value: '?', label: '?', description: 'Unknown size' },
  ],

  linear: [
    { value: 1, label: '1', description: 'Trivial' },
    { value: 2, label: '2', description: 'Very easy' },
    { value: 3, label: '3', description: 'Easy' },
    { value: 4, label: '4', description: 'Straightforward' },
    { value: 5, label: '5', description: 'Medium' },
    { value: 6, label: '6', description: 'Moderate complexity' },
    { value: 7, label: '7', description: 'Complex' },
    { value: 8, label: '8', description: 'Very complex' },
    { value: 9, label: '9', description: 'Extremely complex' },
    { value: 10, label: '10', description: 'Maximum complexity' },
  ],

  power_of_2: [
    { value: 1, label: '1', description: 'Minimal' },
    { value: 2, label: '2', description: 'Small' },
    { value: 4, label: '4', description: 'Medium' },
    { value: 8, label: '8', description: 'Large' },
    { value: 16, label: '16', description: 'Very large' },
    { value: 32, label: '32', description: 'Extremely large' },
    { value: '?', label: '?', description: 'Need more info' },
  ],

  hours: [
    { value: 0.25, label: '15m', description: '15 minutes' },
    { value: 0.5, label: '30m', description: '30 minutes' },
    { value: 1, label: '1h', description: '1 hour' },
    { value: 2, label: '2h', description: '2 hours' },
    { value: 4, label: '4h', description: '4 hours' },
    { value: 8, label: '1d', description: '1 day (8 hours)' },
    { value: 16, label: '2d', description: '2 days' },
    { value: 24, label: '3d', description: '3 days' },
  ],

  days: [
    { value: 0.5, label: '½d', description: 'Half day' },
    { value: 1, label: '1d', description: '1 day' },
    { value: 2, label: '2d', description: '2 days' },
    { value: 3, label: '3d', description: '3 days' },
    { value: 5, label: '1w', description: '1 week' },
    { value: 10, label: '2w', description: '2 weeks' },
    { value: 20, label: '1m', description: '1 month' },
  ],
}

const SCALE_NAMES: Record<EstimationScale, string> = {
  fibonacci: 'Fibonacci',
  tshirt: 'T-Shirt Sizes',
  linear: 'Linear (1-10)',
  power_of_2: 'Powers of 2',
  hours: 'Time (Hours)',
  days: 'Time (Days)',
}

export const StoryPointInput: React.FC<StoryPointInputProps> = ({
  value,
  onChange,
  scale = 'fibonacci',
  onScaleChange,
  placeholder,
  className = '',
  disabled = false,
  showScaleSelector = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const options = ESTIMATION_SCALES[scale]
  const selectedOption = options.find(opt => opt.value === value)

  const handleOptionSelect = (optionValue: string | number) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setIsOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Scale Selector */}
      {showScaleSelector && onScaleChange && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estimation Scale
          </label>
          <select
            value={scale}
            onChange={(e) => onScaleChange(e.target.value as EstimationScale)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            {Object.entries(SCALE_NAMES).map(([scaleKey, scaleName]) => (
              <option key={scaleKey} value={scaleKey}>
                {scaleName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Story Point Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Story Points ({SCALE_NAMES[scale]})
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-white hover:bg-gray-50'
          } ${className}`}
        >
          {selectedOption ? (
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="font-medium">{selectedOption.label}</span>
                {selectedOption.description && (
                  <span className="text-gray-500 text-sm">- {selectedOption.description}</span>
                )}
              </span>
              <span className="text-gray-400">×</span>
            </span>
          ) : (
            <span className="text-gray-500">
              {placeholder || `Select ${SCALE_NAMES[scale].toLowerCase()} estimate...`}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {/* Clear option */}
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-500 text-sm"
              >
                <em>No estimate</em>
              </button>

              {/* Estimation options */}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                    value === option.value ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-gray-500 text-sm">{option.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="text-xs text-gray-500">
        {scale === 'fibonacci' && "📊 Story points for sprint planning & velocity (not actual time)"}
        {scale === 'tshirt' && "📊 T-shirt sizes for relative complexity (not actual time)"}
        {scale === 'linear' && "📊 Simple complexity scale (not actual time)"}
        {scale === 'power_of_2' && "📊 Exponential complexity scale (not actual time)"}
        {scale === 'hours' && "⚠️ Time estimates - consider abstract story points instead"}
        {scale === 'days' && "⚠️ Time estimates - consider abstract story points instead"}
      </div>
    </div>
  )
}
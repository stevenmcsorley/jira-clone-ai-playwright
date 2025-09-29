import { useState } from 'react'
import { TimeTrackingService } from '../../../services/api/time-tracking.service'

interface TimeInputProps {
  value?: number
  onChange: (hours: number | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  label?: string
  helperText?: string
}

export const TimeInput = ({
  value,
  onChange,
  placeholder = "e.g., 2h 30m, 1.5h, 90m",
  className = "",
  disabled = false,
  required = false,
  label,
  helperText
}: TimeInputProps) => {
  const [timeStr, setTimeStr] = useState(() => {
    if (value !== undefined && value !== null && value > 0) {
      return TimeTrackingService.formatTime(value)
    }
    return ''
  })
  const [parseError, setParseError] = useState('')

  const handleChange = (inputValue: string) => {
    setTimeStr(inputValue)
    setParseError('')

    if (!inputValue.trim()) {
      onChange(undefined)
      return
    }

    try {
      const parsedHours = TimeTrackingService.parseTimeInput_client(inputValue)
      onChange(parsedHours)
    } catch (error) {
      if (error instanceof Error) {
        setParseError(error.message)
      }
      onChange(undefined)
    }
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      <input
        type="text"
        value={timeStr}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      {parseError && (
        <p className="text-red-600 text-sm mt-1">{parseError}</p>
      )}
      {helperText && !parseError && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}
      {!helperText && !parseError && (
        <p className="text-gray-500 text-xs mt-1">
          Formats: "2h 30m", "1.5h", "90m", "2h", "30m"
        </p>
      )}
    </div>
  )
}
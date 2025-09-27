/**
 * Utility functions for converting between hours and time formats
 */

export interface TimeInput {
  hours: number;
  minutes: number;
}

/**
 * Convert decimal hours to hours and minutes
 */
export const hoursToTimeInput = (totalHours: number): TimeInput => {
  if (!totalHours || totalHours <= 0) {
    return { hours: 0, minutes: 0 };
  }

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  return { hours, minutes };
};

/**
 * Convert hours and minutes to decimal hours
 */
export const timeInputToHours = (timeInput: TimeInput): number => {
  return timeInput.hours + (timeInput.minutes / 60);
};

/**
 * Format time input for display
 */
export const formatTimeInput = (timeInput: TimeInput): string => {
  const { hours, minutes } = timeInput;

  if (hours === 0 && minutes === 0) {
    return '0 min';
  }

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
};

/**
 * Parse time string like "1h 30m", "45m", "2h" to TimeInput
 */
export const parseTimeString = (timeStr: string): TimeInput => {
  const cleanStr = timeStr.toLowerCase().trim();

  // Match patterns like "1h 30m", "45m", "2h", "1:30", "0:45"
  const colonFormatRegex = /^(\d+):(\d+)$/;
  const hourMinuteRegex = /^(\d+)h\s*(\d+)m$/;
  const minutesOnlyRegex = /^(\d+)m$/;
  const hoursOnlyRegex = /^(\d+)h$/;
  const justMinutesRegex = /^(\d+)\s*min(utes?)?$/i;
  const justHoursRegex = /^(\d+)\s*h(ours?)?$/i;

  let hours = 0;
  let minutes = 0;

  if (colonFormatRegex.test(cleanStr)) {
    // Handle "1:30" format
    const match = cleanStr.match(colonFormatRegex);
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
    }
  } else if (hourMinuteRegex.test(cleanStr)) {
    // Handle "1h 30m" format
    const match = cleanStr.match(hourMinuteRegex);
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
    }
  } else if (minutesOnlyRegex.test(cleanStr)) {
    // Handle "45m" format
    const match = cleanStr.match(minutesOnlyRegex);
    if (match) {
      minutes = parseInt(match[1]);
    }
  } else if (justMinutesRegex.test(cleanStr)) {
    // Handle "45 minutes" or "10min" format
    const match = cleanStr.match(justMinutesRegex);
    if (match) {
      minutes = parseInt(match[1]);
    }
  } else if (hoursOnlyRegex.test(cleanStr)) {
    // Handle "2h" format
    const match = cleanStr.match(hoursOnlyRegex);
    if (match) {
      hours = parseInt(match[1]);
    }
  } else if (justHoursRegex.test(cleanStr)) {
    // Handle "2 hours" format
    const match = cleanStr.match(justHoursRegex);
    if (match) {
      hours = parseInt(match[1]);
    }
  } else {
    // Try to parse as plain number (assume hours)
    const num = parseFloat(cleanStr);
    if (!isNaN(num)) {
      return hoursToTimeInput(num);
    }
  }

  // Normalize minutes (convert 60+ minutes to hours)
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  return { hours, minutes };
};
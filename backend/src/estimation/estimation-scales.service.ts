import { Injectable } from '@nestjs/common'
import { EstimationScale } from './entities/estimation-session.entity'

export interface EstimationScaleOption {
  value: string | number
  label: string
  description?: string
}

export interface EstimationScaleDefinition {
  name: string
  description: string
  options: EstimationScaleOption[]
  unit?: string
  type: 'numeric' | 'categorical' | 'time'
}

@Injectable()
export class EstimationScalesService {
  private readonly scales: Record<EstimationScale, EstimationScaleDefinition> = {
    [EstimationScale.FIBONACCI]: {
      name: 'Fibonacci Sequence',
      description: 'Classic agile estimation using fibonacci numbers',
      type: 'numeric',
      unit: 'story points',
      options: [
        { value: 0, label: '0', description: 'No effort required' },
        { value: 0.5, label: '½', description: 'Minimal effort' },
        { value: 1, label: '1', description: 'Very small effort' },
        { value: 2, label: '2', description: 'Small effort' },
        { value: 3, label: '3', description: 'Small-medium effort' },
        { value: 5, label: '5', description: 'Medium effort' },
        { value: 8, label: '8', description: 'Large effort' },
        { value: 13, label: '13', description: 'Very large effort' },
        { value: 21, label: '21', description: 'Extra large effort' },
        { value: 34, label: '34', description: 'Massive effort - consider splitting' },
        { value: '?', label: '?', description: 'Need more information' },
        { value: '☕', label: '☕', description: 'Need a break' },
      ],
    },

    [EstimationScale.MODIFIED_FIBONACCI]: {
      name: 'Modified Fibonacci',
      description: 'Modified fibonacci with additional values for better granularity',
      type: 'numeric',
      unit: 'story points',
      options: [
        { value: 0, label: '0', description: 'No effort' },
        { value: 0.5, label: '½', description: 'Minimal effort' },
        { value: 1, label: '1', description: 'Very small' },
        { value: 2, label: '2', description: 'Small' },
        { value: 3, label: '3', description: 'Small-medium' },
        { value: 5, label: '5', description: 'Medium' },
        { value: 8, label: '8', description: 'Large' },
        { value: 13, label: '13', description: 'Very large' },
        { value: 20, label: '20', description: 'Extra large' },
        { value: 40, label: '40', description: 'XXL - should be split' },
        { value: 100, label: '100', description: 'Massive - needs breakdown' },
        { value: '?', label: '?', description: 'Unknown complexity' },
      ],
    },

    [EstimationScale.LINEAR]: {
      name: 'Linear Scale',
      description: 'Simple linear scale from 1 to 10',
      type: 'numeric',
      unit: 'points',
      options: [
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
    },

    [EstimationScale.POWER_OF_2]: {
      name: 'Powers of 2',
      description: 'Exponential scale using powers of 2',
      type: 'numeric',
      unit: 'story points',
      options: [
        { value: 0, label: '0', description: 'No effort' },
        { value: 1, label: '1', description: 'Minimal' },
        { value: 2, label: '2', description: 'Small' },
        { value: 4, label: '4', description: 'Medium' },
        { value: 8, label: '8', description: 'Large' },
        { value: 16, label: '16', description: 'Very large' },
        { value: 32, label: '32', description: 'Extremely large' },
        { value: '?', label: '?', description: 'Need more info' },
      ],
    },

    [EstimationScale.TSHIRT]: {
      name: 'T-Shirt Sizes',
      description: 'Relative sizing using familiar t-shirt sizes',
      type: 'categorical',
      options: [
        { value: 'XS', label: 'XS', description: 'Extra Small - Quick fix' },
        { value: 'S', label: 'S', description: 'Small - Minor feature' },
        { value: 'M', label: 'M', description: 'Medium - Standard feature' },
        { value: 'L', label: 'L', description: 'Large - Major feature' },
        { value: 'XL', label: 'XL', description: 'Extra Large - Complex feature' },
        { value: 'XXL', label: 'XXL', description: 'Huge - Consider breaking down' },
        { value: '?', label: '?', description: 'Unknown size' },
      ],
    },

    [EstimationScale.HOURS]: {
      name: 'Time in Hours',
      description: 'Direct time estimation in hours',
      type: 'time',
      unit: 'hours',
      options: [
        { value: 0.25, label: '15m', description: '15 minutes' },
        { value: 0.5, label: '30m', description: '30 minutes' },
        { value: 1, label: '1h', description: '1 hour' },
        { value: 2, label: '2h', description: '2 hours' },
        { value: 4, label: '4h', description: '4 hours' },
        { value: 8, label: '1d', description: '1 day (8 hours)' },
        { value: 16, label: '2d', description: '2 days' },
        { value: 24, label: '3d', description: '3 days' },
        { value: 40, label: '1w', description: '1 week (5 days)' },
        { value: 80, label: '2w', description: '2 weeks' },
        { value: '?', label: '?', description: 'Time unknown' },
      ],
    },

    [EstimationScale.DAYS]: {
      name: 'Time in Days',
      description: 'Direct time estimation in working days',
      type: 'time',
      unit: 'days',
      options: [
        { value: 0.125, label: '1h', description: '1 hour' },
        { value: 0.25, label: '2h', description: '2 hours' },
        { value: 0.5, label: '½d', description: 'Half day' },
        { value: 1, label: '1d', description: '1 day' },
        { value: 2, label: '2d', description: '2 days' },
        { value: 3, label: '3d', description: '3 days' },
        { value: 5, label: '1w', description: '1 week' },
        { value: 10, label: '2w', description: '2 weeks' },
        { value: 15, label: '3w', description: '3 weeks' },
        { value: 20, label: '1m', description: '1 month' },
        { value: '?', label: '?', description: 'Duration unknown' },
      ],
    },

    [EstimationScale.STORY_POINTS]: {
      name: 'Story Points',
      description: 'Abstract story points for relative sizing',
      type: 'numeric',
      unit: 'story points',
      options: [
        { value: 0, label: '0', description: 'No development needed' },
        { value: 1, label: '1', description: 'Trivial change' },
        { value: 2, label: '2', description: 'Minor change' },
        { value: 3, label: '3', description: 'Small story' },
        { value: 5, label: '5', description: 'Medium story' },
        { value: 8, label: '8', description: 'Large story' },
        { value: 13, label: '13', description: 'Very large story' },
        { value: 21, label: '21', description: 'Epic-sized - consider splitting' },
        { value: '∞', label: '∞', description: 'Too large to estimate' },
        { value: '?', label: '?', description: 'Need more information' },
      ],
    },
  }

  /**
   * Get all available estimation scales
   */
  getAllScales(): Record<EstimationScale, EstimationScaleDefinition> {
    return this.scales
  }

  /**
   * Get definition for a specific scale
   */
  getScale(scale: EstimationScale): EstimationScaleDefinition | null {
    return this.scales[scale] || null
  }

  /**
   * Get voting options for a specific scale
   */
  getScaleOptions(scale: EstimationScale): EstimationScaleOption[] {
    const scaleDefinition = this.getScale(scale)
    return scaleDefinition?.options || []
  }

  /**
   * Validate if a vote value is valid for a given scale
   */
  isValidVote(scale: EstimationScale, value: string | number): boolean {
    const options = this.getScaleOptions(scale)
    return options.some(option => option.value === value)
  }

  /**
   * Convert a vote value to a numeric value for calculations
   * Returns null for non-numeric votes (?, ☕, etc.)
   */
  getNumericValue(scale: EstimationScale, value: string | number): number | null {
    if (typeof value === 'number') return value

    // Handle special cases
    if (value === '?' || value === '☕' || value === '∞') return null

    // Try to parse as number
    const parsed = parseFloat(value as string)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Get the display label for a vote value
   */
  getDisplayLabel(scale: EstimationScale, value: string | number): string {
    const options = this.getScaleOptions(scale)
    const option = options.find(opt => opt.value === value)
    return option?.label || String(value)
  }

  /**
   * Get recommended scales for different team preferences
   */
  getRecommendedScales(): {
    beginner: EstimationScale[]
    experienced: EstimationScale[]
    timeBased: EstimationScale[]
    abstract: EstimationScale[]
  } {
    return {
      beginner: [EstimationScale.TSHIRT, EstimationScale.LINEAR],
      experienced: [EstimationScale.FIBONACCI, EstimationScale.MODIFIED_FIBONACCI],
      timeBased: [EstimationScale.HOURS, EstimationScale.DAYS],
      abstract: [EstimationScale.STORY_POINTS, EstimationScale.POWER_OF_2],
    }
  }
}
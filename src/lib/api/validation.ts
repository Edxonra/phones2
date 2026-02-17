/**
 * Central validation utilities for API requests
 */

export interface ValidationError {
  field: string
  message: string
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed')
  }
}

/**
 * Validate if a value is a positive number
 */
export function validatePositiveNumber(
  value: any,
  fieldName: string = 'value'
): value is number {
  const num = Number(value)
  if (isNaN(num) || num <= 0) {
    throw new ValidationException([
      { field: fieldName, message: `${fieldName} must be a positive number` },
    ])
  }
  return true
}

/**
 * Validate if a value is a non-negative number
 */
export function validateNonNegativeNumber(
  value: any,
  fieldName: string = 'value'
): value is number {
  const num = Number(value)
  if (isNaN(num) || num < 0) {
    throw new ValidationException([
      { field: fieldName, message: `${fieldName} must be a non-negative number` },
    ])
  }
  return true
}

/**
 * Validate if a value is a non-empty string
 */
export function validateString(
  value: any,
  fieldName: string = 'value'
): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationException([
      { field: fieldName, message: `${fieldName} is required and must be a string` },
    ])
  }
  return true
}

/**
 * Validate if a value exists in enum options
 */
export function validateEnum(
  value: any,
  options: readonly string[],
  fieldName: string = 'value'
): boolean {
  if (!options.includes(value)) {
    throw new ValidationException([
      {
        field: fieldName,
        message: `${fieldName} must be one of: ${options.join(', ')}`,
      },
    ])
  }
  return true
}

/**
 * Validate required fields in an object
 */
export function validateRequired(
  obj: Record<string, any>,
  requiredFields: string[]
): boolean {
  const missing = requiredFields.filter((field) => {
    const value = obj[field]
    if (value === undefined || value === null) return true
    if (typeof value === 'string' && value.trim() === '') return true
    return false
  })
  if (missing.length > 0) {
    throw new ValidationException(
      missing.map((field) => ({
        field,
        message: `${field} is required`,
      }))
    )
  }
  return true
}

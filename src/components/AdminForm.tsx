'use client'

import React from 'react'
import Image from 'next/image'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'file' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  value?: unknown
  onChange?: (value: unknown) => void
  error?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  accept?: string
}

interface AdminFormProps {
  fields: FormField[]
  initialValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  isEditing?: boolean
}

export default function AdminForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel: _onCancel, // eslint-disable-line @typescript-eslint/no-unused-vars
  submitLabel = 'Guardar',
  cancelLabel: _cancelLabel = 'Cancelar', // eslint-disable-line @typescript-eslint/no-unused-vars
  loading = false,
  isEditing: _isEditing = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: AdminFormProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const lastInitialRef = React.useRef<string>('')

  React.useEffect(() => {
    const currentKey = JSON.stringify(initialValues || {})
    if (currentKey === lastInitialRef.current) return
    lastInitialRef.current = currentKey
    const initialData: Record<string, unknown> = {}
    fields.forEach((field) => {
      const valueFromInitials = initialValues[field.name]
      initialData[field.name] = valueFromInitials ?? field.value ?? ''
    })
    setFormData(initialData)
  }, [initialValues, fields])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement

    let newValue: unknown = value
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value)
    } else if (type === 'file') {
      newValue = (e.target as HTMLInputElement).files?.[0] || null
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    const fieldDef = fields.find((f) => f.name === name)
    if (fieldDef?.onChange) {
      fieldDef.onChange(newValue)
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      const value = formData[field.name]
      const isEmptyString = typeof value === 'string' && value.trim() === ''
      const isNullish = value === undefined || value === null
      const isInvalidNumber = field.type === 'number' && (value === '' || value === undefined || value === null || Number.isNaN(value))
      const isUnchecked = field.type === 'checkbox' && value !== true

      if (field.required && (isNullish || isEmptyString || isInvalidNumber || isUnchecked)) {
        newErrors[field.name] = `${field.label} es obligatorio`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        {fields.map((field) => {
          const key = field.name
          const error = errors[key]

          if (field.type === 'textarea') {
            return (
              <div key={key} className="form-group">
                <label>{field.label} {field.required && '*'}</label>
                <textarea
                  name={key}
                  value={String(formData[key] ?? '')}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={field.rows || 4}
                  className={error ? 'error' : ''}
                />
                {error && <span className="error-text">{error}</span>}
              </div>
            )
          }

          if (field.type === 'select') {
            return (
              <div key={key} className="form-group">
                <label>{field.label} {field.required && '*'}</label>
                <select
                  name={key}
                  value={String(formData[key] ?? '')}
                  onChange={handleChange}
                  className={error ? 'error' : ''}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {error && <span className="error-text">{error}</span>}
              </div>
            )
          }

          if (field.type === 'file') {
            return (
              <div key={key} className="form-group">
                <label>{field.label} {field.required && '*'}</label>
                {typeof formData[key] === 'string' && formData[key] && (
                  <div className="file-preview">
                    <Image
                      src={formData[key]}
                      alt="preview"
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover' }}
                    />
                    <small>Imagen actual</small>
                  </div>
                )}
                <input
                  type="file"
                  name={key}
                  onChange={handleChange}
                  accept={field.accept}
                  className={error ? 'error' : ''}
                />
                {error && <span className="error-text">{error}</span>}
              </div>
            )
          }

          if (field.type === 'checkbox') {
            return (
              <div key={key} className="form-group checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name={key}
                    checked={!!formData[key]}
                    onChange={handleChange}
                    className={error ? 'error' : ''}
                  />
                  <span>{field.label} {field.required && '*'}</span>
                </label>
                {error && <span className="error-text">{error}</span>}
              </div>
            )
          }

          return (
            <div key={key} className="form-group">
              <label>{field.label} {field.required && '*'}</label>
              <input
                type={field.type}
                name={key}
                value={typeof formData[key] === 'number' ? formData[key] : String(formData[key] ?? '')}
                onChange={handleChange}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                className={error ? 'error' : ''}
              />
              {error && <span className="error-text">{error}</span>}
            </div>
          )
        })}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="admin-button-success"
        >
          {loading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

import { useState, useCallback } from 'react'

export interface CrudState<T> {
  items: T[]
  loading: boolean
  error: string | null
  success: string | null
}

export interface UseCrudReturn<T> extends CrudState<T> {
  fetch: () => Promise<void>
  create: (data: Record<string, unknown> | FormData) => Promise<boolean>
  update: (id: string, data: Record<string, unknown> | FormData) => Promise<boolean>
  delete: (id: string) => Promise<boolean>
  clearMessages: () => void
}

function getApiErrorMessage(result: unknown, fallback: string) {
  const parsedResult =
    result && typeof result === 'object' ? (result as { error?: string; errors?: Array<{ field?: string; message?: string }> }) : null

  if (parsedResult?.error) return parsedResult.error
  if (Array.isArray(parsedResult?.errors) && parsedResult.errors.length > 0) {
    return parsedResult.errors
      .map((err: { field?: string; message?: string }) => {
        const fieldLabel = getFieldLabel(err?.field)
        const message = getFriendlyMessage(err?.message, fieldLabel)
        if (fieldLabel && message) return `${fieldLabel}: ${message}`
        return message || fieldLabel || 'Error de validacion'
      })
      .join('; ')
  }
  return fallback
}

function getFieldLabel(field?: string) {
  const labels: Record<string, string> = {
    product: 'Producto',
    purchase: 'Compra',
    client: 'Cliente',
    salePrice: 'Precio de venta',
    saleDate: 'Fecha de venta',
    status: 'Estado',
    cost: 'Costo',
    purchaseDate: 'Fecha de compra',
    provider: 'Proveedor',
    notes: 'Notas',
    model: 'Modelo',
  }
  return field ? labels[field] || field : ''
}

function getFriendlyMessage(message?: string, fieldLabel?: string) {
  if (!message) return ''

  const label = fieldLabel || 'El campo'
  if (message.includes('must be a positive number')) {
    return `${label} debe ser un numero mayor que 0`
  }
  if (message.includes('must be a non-negative number')) {
    return `${label} debe ser un numero igual o mayor que 0`
  }
  if (message.includes('is required')) {
    return `${label} es obligatorio`
  }
  if (message.includes('must be one of:')) {
    return `${label} debe ser un valor valido`
  }
  if (message.includes('is required and must be a string')) {
    return `${label} es obligatorio`
  }

  return message
}

export function useCrud<T>(endpoint: string): UseCrudReturn<T> {
  const [state, setState] = useState<CrudState<T>>({
    items: [],
    loading: false,
    error: null,
    success: null,
  })

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
    }))
  }, [])

  const fetchItems = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch(endpoint)
      const result = await response.json()
      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, 'Failed to fetch items'))
      }
      setState((prev) => ({
        ...prev,
        items: result.data || result,
        loading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        loading: false,
      }))
    }
  }, [endpoint])

  const create = useCallback(
    async (data: Record<string, unknown> | FormData) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: data instanceof FormData ? data : JSON.stringify(data),
          headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(getApiErrorMessage(result, 'Failed to create item'))
        }
        setState((prev) => ({
          ...prev,
          items: [...prev.items, result.data || result],
          loading: false,
          success: 'Objeto creado exitosamente',
        }))
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An error occurred',
          loading: false,
        }))
        return false
      }
    },
    [endpoint]
  )

  const update = useCallback(
    async (id: string, data: Record<string, unknown> | FormData) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const response = await fetch(`${endpoint}/${id}`, {
          method: 'PUT',
          body: data instanceof FormData ? data : JSON.stringify(data),
          headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(getApiErrorMessage(result, 'Failed to update item'))
        }
        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) => ((item as { _id: string })._id === id ? result.data || result : item)),
          loading: false,
          success: 'Objeto actualizado exitosamente',
        }))
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An error occurred',
          loading: false,
        }))
        return false
      }
    },
    [endpoint]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const response = await fetch(`${endpoint}/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(getApiErrorMessage(result, 'Failed to delete item'))
        }
        setState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => (item as { _id: string })._id !== id),
          loading: false,
          success: 'Objeto eliminado exitosamente',
        }))
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An error occurred',
          loading: false,
        }))
        return false
      }
    },
    [endpoint]
  )

  return {
    ...state,
    fetch: fetchItems,
    create,
    update,
    delete: deleteItem,
    clearMessages,
  }
}

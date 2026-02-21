'use client'

import React from 'react'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
}

interface AdminTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  onEdit?: (row: T) => void
  onDelete?: (id: string) => void
  onView?: (row: T) => void
  primaryKey?: keyof T | '_id'
  actions?: boolean
  emptyMessage?: string
}

export default function AdminTable<T extends object>({
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onView,
  primaryKey = '_id',
  actions = true,
  emptyMessage = 'No records found',
}: AdminTableProps<T>) {
  if (loading) {
    return <div className="admin-table-loading">Cargando...</div>
  }

  if (!data || data.length === 0) {
    return <div className="admin-table-empty">{emptyMessage}</div>
  }

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
            {actions && (onEdit || onDelete || onView) && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const recordRow = row as Record<string, unknown>
            const rowId = String(recordRow[String(primaryKey)] || recordRow._id)
            return (
              <tr key={rowId}>
                {columns.map((col) => (
                  <td key={`${rowId}-${String(col.key)}`}>
                    {col.render
                      ? col.render(recordRow[String(col.key)], row)
                      : String(recordRow[String(col.key)] ?? '')}
                  </td>
                ))}
                {actions && (onEdit || onDelete || onView) && (
                  <td>
                    <div className="admin-table-actions">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="admin-button-secondary"
                          title="Ver"
                        >
                          👁️
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="admin-button-secondary"
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(rowId)}
                          className="admin-button-danger"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

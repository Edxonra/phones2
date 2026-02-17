'use client'

import React from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  autoClose?: number
}

export default function Alert({ type, message, onClose, autoClose = 5000 }: AlertProps) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const className = `alert alert-${type}`

  return (
    <div className={className} role="alert">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="alert-close">
          ✕
        </button>
      )}
    </div>
  )
}

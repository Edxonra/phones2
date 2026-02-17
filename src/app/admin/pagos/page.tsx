'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'
import { Status, STATUS_OPTIONS } from '@/src/shared/sale.enum'
import { Battery, Color, Storage } from '@/src/shared/product.enum'

interface IPayment {
  _id?: string
  sale: ISale
  amount: number
  paymentDate: string
  notes?: string
}

interface IPaymentForm {
  _id?: string
  sale: string
  amount: number
  paymentDate: string
  notes?: string
}

interface IExpense {
  _id?: string
  sale: ISale
  description: string
  amount: number
  expenseDate: string
}

interface IExpenseForm {
  _id?: string
  sale: string
  description: string
  amount: number
  expenseDate: string
}

interface ISale {
  _id: string
  product: IProductPopulated
  client: string
  salePrice: number
  saleDate: string
  status: Status
  notes?: string
}

interface ISaleForm {
  _id?: string
  product: string
  client: string
  salePrice: number
  saleDate: string
  status: string
  notes?: string
}

interface IProduct {
  _id?: string;
  model: string;
  price: number;
  storage?: Storage;
  color: Color
  stock: number;
  active: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IModel {
  _id: string
  name: string
  brand: string
  category: string
  image: string
}

interface IProductPopulated {
  _id: string
  model: IModel
  price: number
  storage?: Storage
  color: Color
  batteryHealth?: Battery
}

interface ISaleForm {
  product: string
  client: string
  salePrice: number
  saleDate: string
  status: string
  notes?: string
}

export default function PaymentsAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const [sales, setSales] = useState<ISale[]>([])
  const [payments, setPayments] = useState<IPayment[]>([])
  const [expenses, setExpenses] = useState<IExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isExpenseFormVisible, setIsExpenseFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ sale?: string; amount?: string; paymentDate?: string }>({})
  const [expenseFieldErrors, setExpenseFieldErrors] = useState<{ sale?: string; description?: string; amount?: string; expenseDate?: string }>({})

  const scrollToForm = () => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const paymentsBySale = useMemo(() => {
    return payments.reduce((acc: Record<string, number>, payment) => {
      const saleId = payment.sale?._id
      if (!saleId) return acc
      acc[saleId] = (acc[saleId] || 0) + (payment.amount || 0)
      return acc
    }, {})
  }, [payments])

  const [formData, setFormData] = useState<IPaymentForm>({
    sale: '',
    amount: 0,
    paymentDate: '',
    notes: '',
  })

  const [expenseFormData, setExpenseFormData] = useState<IExpenseForm>({
    sale: '',
    description: '',
    amount: 0,
    expenseDate: '',
  })

  useEffect(() => {
    if (isLoading) return

    if (!isAdmin) {
      router.push('/')
      return
    }
    loadSales()
    loadPayments()
    loadExpenses()
  }, [isAdmin, isLoading, router])

  const loadSales = async () => {
    try {
      const response = await fetch('/api/sales')
      const data = await response.json()
      setSales(data?.data ?? data ?? [])
    } catch (err) {
      setError('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      const data = await response.json();
      setPayments(data?.data ?? data ?? []);
    } catch (err) {
      setError("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      setExpenses(data?.data ?? data ?? [])
    } catch (err) {
      setError('Error al cargar gastos extra')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})

    const newErrors: { sale?: string; amount?: string; paymentDate?: string } = {}
    if (!formData.sale) newErrors.sale = 'Venta es obligatoria'
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Abono es obligatorio'
    if (!formData.paymentDate) newErrors.paymentDate = 'Fecha de pago es obligatoria'
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/payments/${editingId}` : '/api/payments'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar pago')
      }

      setSuccess(editingId ? 'Pago actualizado' : 'Pago creado')
      resetForm()
      loadPayments()
    } catch (err) {
      setError('Error al guardar el pago')
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setExpenseFieldErrors({})

    const newErrors: { sale?: string; description?: string; amount?: string; expenseDate?: string } = {}
    if (!expenseFormData.sale) newErrors.sale = 'Venta es obligatoria'
    if (!expenseFormData.description.trim()) newErrors.description = 'Descripción es obligatoria'
    if (!expenseFormData.amount || expenseFormData.amount <= 0) newErrors.amount = 'Monto es obligatorio'
    if (!expenseFormData.expenseDate) newErrors.expenseDate = 'Fecha es obligatoria'
    if (Object.keys(newErrors).length > 0) {
      setExpenseFieldErrors(newErrors)
      return
    }

    try {
      const method = editingExpenseId ? 'PUT' : 'POST'
      const url = editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseFormData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar gasto')
      }

      setSuccess(editingExpenseId ? 'Gasto actualizado' : 'Gasto creado')
      resetExpenseForm()
      loadExpenses()
    } catch (err) {
      setError('Error al guardar el gasto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pago?')) return

    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSuccess('Pago eliminado')
      loadPayments()
    } catch (err) {
      setError('Error al eliminar el pago')
    }
  }

  const handleExpenseDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSuccess('Gasto eliminado')
      loadExpenses()
    } catch (err) {
      setError('Error al eliminar el gasto')
    }
  }

  const handleEdit = (payment: IPayment) => {
    setFormData({
      sale: payment.sale._id,
      amount: payment.amount,
      paymentDate: payment.paymentDate.slice(0, 10),
      notes: payment.notes ?? '',
    })
    setEditingId(payment._id || null)
    setIsFormVisible(true)
    scrollToForm()
  }

  const handleExpenseEdit = (expense: IExpense) => {
    setExpenseFormData({
      sale: expense.sale._id,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate.slice(0, 10),
    })
    setEditingExpenseId(expense._id || null)
    setIsExpenseFormVisible(true)
    scrollToForm()
  }

  const resetForm = () => {
    setFormData({
      sale: '',
      amount: 0,
      paymentDate: '',
      notes: ''
    })
    setEditingId(null)
    setIsFormVisible(false)
  }

  const resetExpenseForm = () => {
    setExpenseFormData({
      sale: '',
      description: '',
      amount: 0,
      expenseDate: '',
    })
    setEditingExpenseId(null)
    setIsExpenseFormVisible(false)
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
    }
    return `₡${price}`
  }

  const parseLocalDate = (value: string) => {
    if (!value) return null
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
  }

  const formatDate = (value: string) => {
    const date = parseLocalDate(value)
    return date ? date.toLocaleDateString('es-CR') : ''
  }

  const formatInvoicePrice = (price: number) => {
    const formatted = formatPrice(price)
    return formatted.replace('₡', 'CRC ')
  }

  const loadImageDataUrl = (src: string) => {
    if (!src) return Promise.resolve<string | null>(null)
    const resolved = src.startsWith('http') ? src : new URL(src, window.location.origin).toString()
    return new Promise<string | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = resolved
    })
  }

  const handleGenerateInvoice = async (payment: IPayment) => {
    try {
      const { jsPDF } = await import('jspdf')
      const logoDataUrl = await loadImageDataUrl('/logo.jpg')
      const sale = payment.sale
      const salePayments = payments
        .filter((item) => item.sale?._id === sale._id)
        .sort(
          (a, b) =>
            (parseLocalDate(a.paymentDate)?.getTime() ?? 0) -
            (parseLocalDate(b.paymentDate)?.getTime() ?? 0)
        )
      const totalPaid = salePayments.reduce((sum, item) => sum + (item.amount || 0), 0)
      const remaining = Math.max(0, sale.salePrice - totalPaid)
      const invoiceNumber = payment._id ? `FAC-${payment._id}` : 'FAC-SIN-ID'
      const productLabel = `${sale.product.model.brand} ${sale.product.model.name} - ${sale.product.color}${sale.product.storage ? ` - ${sale.product.storage}` : ''}`
      const imageDataUrl = await loadImageDataUrl(sale.product.model.image)

      const doc = new jsPDF()
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 24, 24)
      }
      doc.setFontSize(18)
      doc.text('Factura de pago', 42, 20)
      doc.setFontSize(11)
      doc.text(`Factura No: ${invoiceNumber}`, 42, 28)
      doc.text(`Fecha: ${formatDate(payment.paymentDate)}`, 14, 40)
      doc.text(`Cliente: ${sale.client}`, 14, 48)
      doc.text(`Articulo: ${productLabel}`, 14, 56)
      doc.text(`Abono: ${formatInvoicePrice(payment.amount)}`, 14, 64)
      doc.text(`Total venta: ${formatInvoicePrice(sale.salePrice)}`, 14, 72)
      doc.text(`Total pagado: ${formatInvoicePrice(totalPaid)}`, 14, 80)
      doc.text(`Saldo pendiente: ${formatInvoicePrice(remaining)}`, 14, 88)

      if (imageDataUrl) {
        doc.addImage(imageDataUrl, 'PNG', 140, 44, 50, 50)
      }

      let y = 104
      doc.setFontSize(12)
      doc.text('Pagos de la venta', 14, y)
      y += 8
      doc.setFontSize(10)
      doc.text('Fecha', 14, y)
      doc.text('Monto', 70, y)
      y += 4
      doc.line(14, y, 120, y)
      y += 6
      salePayments.forEach((item) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(formatDate(item.paymentDate), 14, y)
        doc.text(formatInvoicePrice(item.amount), 70, y)
        y += 6
      })

      const fileId = payment._id || sale._id
      doc.save(`factura-pago-${fileId}.pdf`)
    } catch (err) {
      setError('No se pudo generar la factura')
    }
  }

  if (loading) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Pagos</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button 
          onClick={() => isFormVisible ? resetForm() : setIsFormVisible(true)}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nuevo Pago'}
        </button>

        {isFormVisible && (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Venta *</label>
                <select value={formData.sale} onChange={(e) => setFormData({ ...formData, sale: e.target.value })}>
                  <option value="" disabled>Seleccionar la venta</option>
                  {sales.map((sale) => (
                    <option key={sale._id} value={sale._id}>
                      {sale.client} - {sale.product.model.name} - {sale.product.color}{sale.product.storage ? ` - ${sale.product.storage}` : ''}{sale.product.batteryHealth ? ` - ${sale.product.batteryHealth}` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.sale && <span className="error-text">{fieldErrors.sale}</span>}
              </div>
              <div className="form-group">
                <label>Abono *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0"
                />
                {fieldErrors.amount && <span className="error-text">{fieldErrors.amount}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de pago *</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                />
                {fieldErrors.paymentDate && <span className="error-text">{fieldErrors.paymentDate}</span>}
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas opcionales"
                />
              </div>
            </div>
            <button type="submit" className="admin-button-success">
              {editingId ? 'Actualizar Pago' : 'Registrar Pago'}
            </button>
          </form>
        )}

        <button
          onClick={() => isExpenseFormVisible ? resetExpenseForm() : setIsExpenseFormVisible(true)}
          className="admin-button-primary"
        >
          {isExpenseFormVisible ? 'Cancelar gasto' : 'Registrar gasto extra'}
        </button>

        {isExpenseFormVisible && (
          <form onSubmit={handleExpenseSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Venta *</label>
                <select
                  value={expenseFormData.sale}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, sale: e.target.value })}
                >
                  <option value="" disabled>Seleccionar la venta</option>
                  {sales.map((sale) => (
                    <option key={sale._id} value={sale._id}>
                      {sale.client} - {sale.product.model.name} - {sale.product.color}{sale.product.storage ? ` - ${sale.product.storage}` : ''}{sale.product.batteryHealth ? ` - ${sale.product.batteryHealth}` : ''}
                    </option>
                  ))}
                </select>
                {expenseFieldErrors.sale && <span className="error-text">{expenseFieldErrors.sale}</span>}
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input
                  type="text"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  placeholder="Ej: Accesorio de cortesía"
                />
                {expenseFieldErrors.description && <span className="error-text">{expenseFieldErrors.description}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  value={expenseFormData.amount}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0"
                />
                {expenseFieldErrors.amount && <span className="error-text">{expenseFieldErrors.amount}</span>}
              </div>
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={expenseFormData.expenseDate}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                />
                {expenseFieldErrors.expenseDate && <span className="error-text">{expenseFieldErrors.expenseDate}</span>}
              </div>
            </div>
            <button type="submit" className="admin-button-success">
              {editingExpenseId ? 'Actualizar gasto' : 'Registrar gasto'}
            </button>
          </form>
        )}

        <div className="products-table">
          <h2>Pagos registrados ({payments.length})</h2>
          {payments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Pago</th>
                  <th>Abono</th>
                  <th>Fecha</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.sale.client} - {payment.sale.product.model.name}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{payment.notes}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(payment)}
                        className="admin-button-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(payment)}
                        className="admin-button-invoice"
                      >
                        Generar factura
                      </button>
                      <button 
                        onClick={() => handleDelete(payment._id || '')}
                        className="admin-button-delete"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-message">No hay pagos registrados</p>
          )}
        </div>

        <div className="products-table">
          <h2>Gastos extra ({expenses.length})</h2>
          {expenses.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.sale.client} - {expense.sale.product.model.name}</td>
                    <td>{expense.description}</td>
                    <td>{formatPrice(expense.amount)}</td>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td>
                      <button
                        onClick={() => handleExpenseEdit(expense)}
                        className="admin-button-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExpenseDelete(expense._id || '')}
                        className="admin-button-delete"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-message">No hay gastos registrados</p>
          )}
        </div>
      </div>
    </div>
  )
}


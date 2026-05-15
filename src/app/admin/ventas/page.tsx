'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'
import { useCrud } from '@/src/hooks/useCrud'
import AdminTable, { TableColumn } from '@/src/components/AdminTable'
import AdminForm, { FormField } from '@/src/components/AdminForm'
import Alert from '@/src/components/Alert'
import { Status } from '@/src/shared/sale.enum'

interface IModel {
  _id: string
  name: string
  brand: string
  category: string
}

interface IProduct {
  _id: string
  model: IModel
  price: number
  storage?: string
  color: string
  stock: number
  active: boolean
  batteryHealth?: string
}

interface ICustomer {
  _id?: string
  name: string
  phone: string
}

interface IPurchase {
  _id: string
  product: IProduct
  purchaseDate: string
  cost: number
}

interface ISale {
  _id?: string
  product: IProduct
  purchase: IPurchase | string
  client: string
  salePrice: number
  saleDate: string
  status: Status
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

interface IPayment {
  _id?: string
  sale: ISale | string
  amount: number
}

export default function SalesAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const { items: sales, loading, error, success, fetch: fetchSales, create, update, delete: deleteItem, clearMessages } = useCrud<ISale>('/api/sales')
  const { items: products, fetch: fetchProducts } = useCrud<IProduct>('/api/products')
  const { items: purchases, fetch: fetchPurchases } = useCrud<IPurchase>('/api/purchases')
  const { items: customers, fetch: fetchCustomers } = useCrud<ICustomer>('/api/customers')
  const { items: payments, fetch: fetchPayments } = useCrud<IPayment>('/api/payments')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string>('')

  const scrollToForm = () => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (isLoading) return
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchSales()
    fetchProducts()
    fetchPurchases()
    fetchCustomers()
    fetchPayments()
  }, [isAdmin, isLoading, router, fetchSales, fetchProducts, fetchPurchases, fetchCustomers, fetchPayments])

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
    }
    return `₡${price}`
  }

  const formatSaleDate = (value: string) => {
    if (!value) return ''
    const [year, month, day] = value.split('T')[0].split('-').map(Number)
    if (!year || !month || !day) return ''
    return new Date(year, month - 1, day).toLocaleDateString('es-CR')
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    const payload = {
      ...data,
      status: data.status ?? selectedSale?.status ?? 'Pendiente',
    }
    if (editingId) {
      const ok = await update(editingId, payload)
      if (!ok) return
    } else {
      const ok = await create(payload)
      if (!ok) return
    }
    resetForm()
    fetchSales()
  }

  const handleEdit = (sale: ISale) => {
    setEditingId(sale._id || null)
    setSelectedSale(sale)
    setSelectedProductId(sale.product?._id || '')
    setIsFormVisible(true)
    scrollToForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) return
    await deleteItem(id)
    fetchSales()
  }

  const formatProductLabel = (product: IProduct) => {
    const details = [product.color, product.storage, product.batteryHealth].filter(Boolean)
    return `${product.model.brand} ${product.model.name}${details.length ? ` - ${details.join(' - ')}` : ''}`
  }

  const formatInvoicePrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `CRC ${thousand % 1 === 0 ? `${thousand} mil` : `${thousand.toFixed(1)} mil`}`
    }
    return `CRC ${price}`
  }

  const loadImageDataUrl = (src: string) => {
    if (typeof window === 'undefined' || !src) return Promise.resolve<string | null>(null)
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

  const handleGenerateInvoice = async (sale: ISale) => {
    try {
      const { jsPDF } = await import('jspdf')
      const logoDataUrl = await loadImageDataUrl('/logo.jpg')
      const imageDataUrl = sale.product.model.image ? await loadImageDataUrl(sale.product.model.image) : null
      const invoiceNumber = sale._id ? `FAC-${sale._id}` : 'FAC-SIN-ID'
      const productLabel = formatProductLabel(sale.product)
      const paid = paymentsBySale[sale._id || ''] || 0
      const pending = Math.max((sale.salePrice || 0) - paid, 0)

      const doc = new jsPDF()
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 24, 24)
      }
      doc.setFontSize(18)
      doc.text('Factura de venta', 42, 20)
      doc.setFontSize(11)
      doc.text(`Factura No: ${invoiceNumber}`, 42, 28)
      doc.text(`Fecha de venta: ${formatSaleDate(sale.saleDate)}`, 14, 40)
      doc.text(`Cliente: ${sale.client}`, 14, 48)
      doc.line(14, 52, 196, 52)

      doc.setFontSize(12)
      doc.text('Detalle del producto', 14, 62)
      doc.setFontSize(10)
      doc.text('Descripción', 14, 70)
      doc.text('Precio', 166, 70, { align: 'right' })
      doc.line(14, 73, 196, 73)
      doc.text(productLabel, 14, 82)
      doc.text(formatInvoicePrice(sale.salePrice), 166, 82, { align: 'right' })
      doc.line(14, 86, 196, 86)

      let y = 102
      doc.setFontSize(12)
      doc.text('Resumen', 14, y)
      y += 8
      doc.setFontSize(10)
      doc.text(`Total venta: ${formatInvoicePrice(sale.salePrice)}`, 14, y)
      y += 6
      doc.text(`Total pagado: ${formatInvoicePrice(paid)}`, 14, y)
      y += 6
      doc.text(`Saldo pendiente: ${formatInvoicePrice(pending)}`, 14, y)
      y += 6
      doc.text(`Estado: ${statusBySale(sale)}`, 14, y)

      if (imageDataUrl) {
        doc.addImage(imageDataUrl, 'PNG', 140, 42, 50, 50)
      }

      const fileId = sale._id || 'sin-id'
      doc.save(`factura-venta-${fileId}.pdf`)
    } catch {
      setError('No se pudo generar la factura de venta')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedSale(null)
    setSelectedProductId('')
    setIsFormVisible(false)
  }

  const normalizeId = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
      return value.toString()
    }
    return ''
  }

  const selectedSalePurchaseId = selectedSale
    ? normalizeId(typeof selectedSale.purchase === 'string' ? selectedSale.purchase : selectedSale.purchase?._id)
    : ''

  const soldPurchaseIds = new Set(
    sales
      .map((sale) => normalizeId(typeof sale.purchase === 'string' ? sale.purchase : sale.purchase?._id))
      .filter(Boolean)
  )

  const availablePurchases = purchases.filter((purchase) => {
    const purchaseId = normalizeId(purchase._id)
    return !soldPurchaseIds.has(purchaseId) || purchaseId === selectedSalePurchaseId
  })

  const purchasesCountByProduct = purchases.reduce<Record<string, number>>((acc, purchase) => {
    const productId = normalizeId(purchase.product?._id ?? purchase.product)
    if (!productId) return acc
    acc[productId] = (acc[productId] || 0) + 1
    return acc
  }, {})

  const salesCountByProduct = sales.reduce<Record<string, number>>((acc, sale) => {
    const productId = normalizeId(sale.product?._id ?? sale.product)
    if (!productId) return acc
    acc[productId] = (acc[productId] || 0) + 1
    return acc
  }, {})

  if (selectedSale?.product?._id) {
    const editingProductId = normalizeId(selectedSale.product._id)
    if (editingProductId) {
      salesCountByProduct[editingProductId] = Math.max((salesCountByProduct[editingProductId] || 0) - 1, 0)
    }
  }

  const availableProductIds = new Set(
    Object.keys(purchasesCountByProduct).filter((productId) => {
      const purchasesCount = purchasesCountByProduct[productId] || 0
      const salesCount = salesCountByProduct[productId] || 0
      return purchasesCount - salesCount > 0
    })
  )

  if (selectedSale?.product?._id) {
    availableProductIds.add(normalizeId(selectedSale.product._id))
  }

  const productsWithAvailablePurchases = products.filter((product) => availableProductIds.has(normalizeId(product._id)))

  const productOptions = productsWithAvailablePurchases.map((p: IProduct) => ({
    value: p._id,
    label: formatProductLabel(p),
  }))

  const filteredPurchases = selectedProductId
    ? availablePurchases.filter((purchase) => normalizeId(purchase.product?._id) === selectedProductId)
    : []

  const purchaseOptions = filteredPurchases.map((purchase: IPurchase) => ({
    value: purchase._id,
    label: `${purchase.product.model.brand} ${purchase.product.model.name} - ${formatSaleDate(purchase.purchaseDate)}`,
  }))

  const formFields: FormField[] = [
    {
      name: 'product',
      label: 'Producto',
      type: 'select',
      required: true,
      options: productOptions,
      onChange: (value) => setSelectedProductId(String(value ?? '')),
    },
    {
      name: 'purchase',
      label: 'Compra',
      type: 'select',
      required: true,
      options: purchaseOptions,
    },
    {
      name: 'client',
      label: 'Cliente',
      type: 'select',
      required: true,
      options: customers.map((c) => ({
        value: c.name,
        label: `${c.name}`,
      })),
    },
    {
      name: 'salePrice',
      label: 'Precio de Venta',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
    },
    {
      name: 'saleDate',
      label: 'Fecha de Venta',
      type: 'date',
      required: true,
    },
    {
      name: 'notes',
      label: 'Notas',
      type: 'text',
      placeholder: 'Notas opcionales',
      required: false,
    },
  ]

  const paymentsBySale = payments.reduce((acc: Record<string, number>, p) => {
    const saleId = typeof p.sale === 'string' ? p.sale : p.sale?._id
    if (!saleId) return acc
    acc[saleId] = (acc[saleId] || 0) + (p.amount || 0)
    return acc
  }, {})

  const pendingBySale = (sale: ISale) => {
    const paid = paymentsBySale[sale._id || ''] || 0
    const pending = (sale.salePrice || 0) - paid
    return pending < 0 ? 0 : pending
  }

  const statusBySale = (sale: ISale): Status => {
    return pendingBySale(sale) === 0 ? 'Cancelado' : 'Pendiente'
  }

  const columns: TableColumn<ISale>[] = [
    {
      key: 'product',
      label: 'Producto',
      render: (value) => {
        const product = value as IProduct
        return formatProductLabel(product)
      },
    },
    {
      key: 'client',
      label: 'Cliente',
    },
    {
      key: 'salePrice',
      label: 'Precio',
      render: (value) => formatPrice(Number(value)),
    },
    {
      key: 'pending',
      label: 'Saldo Pendiente',
      render: (_value, row) => formatPrice(pendingBySale(row)),
    },
    {
      key: 'saleDate',
      label: 'Fecha',
      render: (value) => formatSaleDate(String(value ?? '')),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_value, row) => statusBySale(row),
    },
  ]

  if (loading && sales.length === 0) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Ventas</h1>

        {error && <Alert type="error" message={error} onClose={clearMessages} />}
        {success && <Alert type="success" message={success} onClose={clearMessages} />}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nueva Venta'}
        </button>

        {isFormVisible && (
          <AdminForm
            fields={formFields}
            initialValues={selectedSale ? {
              product: selectedSale.product?._id,
              purchase: typeof selectedSale.purchase === 'string' ? selectedSale.purchase : selectedSale.purchase?._id,
              client: selectedSale.client,
              salePrice: selectedSale.salePrice,
              saleDate: selectedSale.saleDate ? new Date(selectedSale.saleDate).toISOString().split('T')[0] : '',
              notes: selectedSale.notes || '',
            } : {}}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingId}
          />
        )}

        <h2>Ventas Registradas ({sales.length})</h2>
        <AdminTable<ISale>
          columns={columns}
          data={sales}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onInvoice={handleGenerateInvoice}
          emptyMessage="No hay ventas registradas"
        />
      </div>
    </div>
  )
}


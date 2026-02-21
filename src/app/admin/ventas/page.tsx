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

  const resetForm = () => {
    setEditingId(null)
    setSelectedSale(null)
    setSelectedProductId('')
    setIsFormVisible(false)
  }

  const productOptions = products.map((p: IProduct) => ({
    value: p._id,
    label: `${(p.model as IModel).brand} ${(p.model as IModel).name} - ${p.color}${p.storage ? ` - ${p.storage}` : ''}${p.batteryHealth ? ` - ${p.batteryHealth}` : ''}`,
  }))

  const filteredPurchases = selectedProductId
    ? purchases.filter((purchase) => purchase.product?._id === selectedProductId)
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

  const columns: TableColumn<ISale>[] = [
    {
      key: 'product',
      label: 'Producto',
      render: (value) => {
        const product = value as IProduct
        return `${product.model.brand} ${product.model.name}`
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
          emptyMessage="No hay ventas registradas"
        />
      </div>
    </div>
  )
}


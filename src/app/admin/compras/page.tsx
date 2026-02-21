'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'
import { useCrud } from '@/src/hooks/useCrud'
import AdminTable, { TableColumn } from '@/src/components/AdminTable'
import AdminForm, { FormField } from '@/src/components/AdminForm'
import Alert from '@/src/components/Alert'
import { Provider, PROVIDER_OPTIONS } from '@/src/shared/purchase.enum'

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
  batteryHealth: string
}

interface IPurchase {
  _id?: string
  provider: Provider
  product: IProduct
  cost: number
  purchaseDate: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export default function PurchasesAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const { items: purchases, loading, error, success, fetch: fetchPurchases, create, update, delete: deleteItem, clearMessages } = useCrud<IPurchase>('/api/purchases')
  const { items: products, fetch: fetchProducts } = useCrud<IProduct>('/api/products')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<IPurchase | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('')

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
    fetchPurchases()
    fetchProducts()
  }, [isAdmin, isLoading, router, fetchPurchases, fetchProducts])

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

  const formatLocalDate = (value: string) => {
    const date = parseLocalDate(value)
    return date ? date.toLocaleDateString('es-CR') : ''
  }

  const formatDateInput = (value: string) => {
    if (!value) return ''
    return value.split('T')[0]
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editingId) {
      await update(editingId, data)
    } else {
      await create(data)
    }
    resetForm()
    fetchPurchases()
  }

  const handleEdit = (purchase: IPurchase) => {
    setEditingId(purchase._id || null)
    setSelectedPurchase(purchase)
    if (purchase.provider) {
      setSelectedProvider(purchase.provider)
    }
    setIsFormVisible(true)
    scrollToForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta compra?')) return
    await deleteItem(id)
    fetchPurchases()
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedPurchase(null)
    setSelectedProvider('')
    setIsFormVisible(false)
  }

  const providerBrandsMap: Record<string, string[] | null> = {
    Apple: ['Apple'],
    Samsung: ['Samsung'],
    Google: ['Google'],
    BackMarket: null,
    Amazon: null,
  }

  const allowedBrands = selectedProvider ? providerBrandsMap[selectedProvider] : null
  const filteredProducts = selectedProvider
    ? products.filter((p) => (allowedBrands ? allowedBrands.includes(p.model.brand) : true))
    : products

  const productOptions = filteredProducts.map((p: IProduct) => ({
    value: p._id,
    label: `${p.model.brand} ${p.model.name} - ${p.color}${p.storage ? ` - ${p.storage}` : ''}${p.batteryHealth ? ` - ${p.batteryHealth}` : ''}`,
  }))

  const formFields: FormField[] = [
    {
      name: 'provider',
      label: 'Proveedor',
      type: 'select',
      required: true,
      options: PROVIDER_OPTIONS.map((p) => ({ value: p, label: p })),
      onChange: (value) => setSelectedProvider(String(value ?? '')),
    },
    {
      name: 'product',
      label: 'Producto',
      type: 'select',
      required: true,
      options: productOptions,
    },
    {
      name: 'cost',
      label: 'Costo',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
    },
    {
      name: 'purchaseDate',
      label: 'Fecha de Compra',
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

  const columns: TableColumn<IPurchase>[] = [
    {
      key: 'provider',
      label: 'Proveedor',
    },
    {
      key: 'product',
      label: 'Producto',
      render: (value) => {
        const product = value as IProduct | null | undefined
        if (!product?.model) return 'Producto desconocido'
        return `${product.model.brand} ${product.model.name}`
      },
    },
    {
      key: 'cost',
      label: 'Costo',
      render: (value) => formatPrice(Number(value)),
    },
    {
      key: 'purchaseDate',
      label: 'Fecha',
      render: (value) => formatLocalDate(String(value ?? '')),
    },
  ]

  if (loading && purchases.length === 0) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Compras</h1>

        {error && <Alert type="error" message={error} onClose={clearMessages} />}
        {success && <Alert type="success" message={success} onClose={clearMessages} />}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nueva Compra'}
        </button>

        {isFormVisible && (
          <AdminForm
            fields={formFields}
            initialValues={selectedPurchase ? {
              provider: selectedPurchase.provider,
              product: selectedPurchase.product?._id,
              cost: selectedPurchase.cost,
              purchaseDate: formatDateInput(selectedPurchase.purchaseDate),
              notes: selectedPurchase.notes || '',
            } : {}}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingId}
          />
        )}

        <h2>Compras Registradas ({purchases.length})</h2>
        <AdminTable<IPurchase>
          columns={columns}
          data={purchases}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay compras registradas"
        />
      </div>
    </div>
  )
}


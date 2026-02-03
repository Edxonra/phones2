'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'

interface IInventoryPurchase {
  _id?: string
  provider: string
  product: string
  cost: number
  purchaseDate: string
  notes?: string
}

interface IProduct {
  _id?: string;
  model: string;
  price: number;
  storage: "" | "128GB" | "256GB" | "512GB" | "1TB" | "2TB";
  color:
    | ""
    | "Negro Espacial"
    | "Naranja Cósmico"
    | "Gris Espacial"
    | "Grafito"
    | "Plateado"
    | "Azul"
    | "Negro";
  stock: number;
  active: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function PurchasesAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const [purchases, setPurchases] = useState<IInventoryPurchase[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<IInventoryPurchase>({
    provider: '',
    product: '',
    cost: 0,
    purchaseDate: '',
    notes: '',
  })

  useEffect(() => {
    if (isLoading) return

    if (!isAdmin) {
      router.push('/')
      return
    }
    loadPurchases()
    loadProducts()
  }, [isAdmin, isLoading, router])

  const loadPurchases = async () => {
    try {
      const response = await fetch('/api/purchases')
      const data = await response.json()
      setPurchases(data)
    } catch (err) {
      setError('Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.provider || !formData.product || formData.cost <= 0) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/purchases/${editingId}` : '/api/purchases'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar compra')
      }

      setSuccess(editingId ? 'Compra actualizada' : 'Compra creada')
      resetForm()
      loadPurchases()
    } catch (err) {
      setError('Error al guardar la compra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta compra?')) return

    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSuccess('Compra eliminada')
      loadPurchases()
    } catch (err) {
      setError('Error al eliminar la compra')
    }
  }

  const handleEdit = (purchase: IInventoryPurchase) => {
    setFormData(purchase)
    setEditingId(purchase._id || null)
    setIsFormVisible(true)
  }

  const resetForm = () => {
    setFormData({
      provider: '',
      product: '',
      cost: 0,
      purchaseDate: '',
      notes: '',
    })
    setEditingId(null)
    setIsFormVisible(false)
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
    }
    return `₡${price}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR')
  }

  if (loading) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Compras de Inventario</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button 
          onClick={() => isFormVisible ? resetForm() : setIsFormVisible(true)}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nueva Compra'}
        </button>

        {isFormVisible && (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Proveedor *</label>
                <select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })}>
                  <option value="" disabled>Seleccionar proveedor</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="BackMarket">BackMarket</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Google">Google</option>
                </select>
              </div>
              <div className="form-group">
                <label>Producto *</label>
                <select value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })}>
                  <option value="" disabled>Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.model}>
                      {product.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Costo *</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Compra *</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
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
              {editingId ? 'Actualizar Compra' : 'Registrar Compra'}
            </button>
          </form>
        )}

        <div className="products-table">
          <h2>Compras Registradas ({purchases.length})</h2>
          {purchases.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Cantidad</th>
                  <th>Costo Unitario</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase._id}>
                    <td>{purchase.provider}</td>
                    <td>{purchase.product}</td>
                    <td>{formatPrice(purchase.cost)}</td>
                    <td>{formatDate(purchase.purchaseDate)}</td>
                    <td>{purchase.notes}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(purchase)}
                        className="admin-button-edit"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(purchase._id || '')}
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
            <p className="empty-message">No hay compras registradas</p>
          )}
        </div>
      </div>
    </div>
  )
}


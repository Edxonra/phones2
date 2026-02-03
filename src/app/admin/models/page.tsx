'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'

interface IModel {
  _id?: string
  name: string
  brand: '' | 'Apple' | 'Samsung' | 'Google';
  category: '' | 'Smartphone' | 'Watch' | 'Laptop' | 'Tablet' | 'Audio'; 
}


export default function ModelsAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const [models, setModels] = useState<IModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<IModel>({
    name: '',
    brand: '',
    category: '' 
  })

  useEffect(() => {
    if (isLoading) return

    if (!isAdmin) {
      router.push('/')
      return
    }
    loadModels()
  }, [isAdmin, isLoading, router])


  const loadModels = async () => {
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      setModels(data)
    } catch (err) {
      setError('Error al cargar modelos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name || !formData.brand || !formData.category) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/models/${editingId}` : '/api/models'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        throw new Error('Error al guardar modelo')
      }

      setSuccess(editingId ? 'Modelo actualizado' : 'Modelo creado')
      resetForm()
      loadModels()
    } catch (err) {
      setError('Error al guardar el modelo')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este modelo?')) return

    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSuccess('Modelo eliminado')
      loadModels()
    } catch (err) {
      setError('Error al eliminar el modelo')
    }
  }

  const handleEdit = (model: IModel) => {
  setFormData({
    name: model.name,
    brand: model.brand,
    category: model.category,
  })

  setEditingId(model._id || null)
  setIsFormVisible(true)
}


  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
    })
    setEditingId(null)
    setIsFormVisible(false)
  }

  if (loading) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Modelos</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button 
          onClick={() => isFormVisible ? resetForm() : setIsFormVisible(true)}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nuevo Modelo'}
        </button>

        {isFormVisible && (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del modelo"
                />
              </div>
              <div className="form-group">
                <label>Marca *</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value as 'Apple' | 'Samsung' | 'Google' })}
                >
                  <option value='' disabled>Selecciona una marca</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                </select>
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Smartphone' | 'Watch' | 'Laptop' | 'Tablet' | 'Audio'})}
                >
                  <option value='' disabled>Selecciona una categoría</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Watch">Watch</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>
            </div>
            <button type="submit" className="admin-button-success">
              {editingId ? 'Actualizar Modelo' : 'Registrar Modelo'}
            </button>
          </form>
        )}

        <div className="products-table">
          <h2>Modelos Registrados ({models.length})</h2>
          {models.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model._id}>
                    <td>{model.name}</td>
                    <td>{model.brand}</td>
                    <td>{model.category}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(model)}
                        className="admin-button-edit"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(model._id || '')}
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
            <p className="empty-message">No hay modelos registrados</p>
          )}
        </div>
      </div>
    </div>
  )
}


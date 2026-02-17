'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'
import { useCrud } from '@/src/hooks/useCrud'
import AdminTable, { TableColumn } from '@/src/components/AdminTable'
import AdminForm, { FormField } from '@/src/components/AdminForm'
import Alert from '@/src/components/Alert'
import { Brand, BRAND_OPTIONS, Category, CATEGORY_OPTIONS } from '@/src/shared/model.enum'

interface IModel {
  _id?: string
  name: string
  brand: Brand
  category: Category
  image: string
}

export default function ModelsAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useIsAdmin()
  const { items: models, loading, error, success, fetch, create, update, delete: deleteItem, clearMessages } = useCrud<IModel>('/api/models')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<IModel | null>(null)
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

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
    fetch()
  }, [isAdmin, isLoading, router, fetch])

  const handleSubmit = async (data: Record<string, any>) => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('brand', data.brand)
    formData.append('category', data.category)
    if (data.image instanceof File) {
      formData.append('image', data.image)
    }

    if (editingId) {
      await update(editingId, formData)
    } else {
      await create(formData)
    }

    resetForm()
    fetch()
  }

  const handleEdit = (model: IModel) => {
    setEditingId(model._id || null)
    setSelectedModel(model)
    setIsFormVisible(true)
    scrollToForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este modelo?')) return
    await deleteItem(id)
    fetch()
  }

  const filteredModels = models.filter((model) => {
    const brandMatch = brandFilter ? model.brand === brandFilter : true
    const categoryMatch = categoryFilter ? model.category === categoryFilter : true
    return brandMatch && categoryMatch
  })

  const sortedModels = [...filteredModels].sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
  })

  const resetForm = () => {
    setEditingId(null)
    setSelectedModel(null)
    setIsFormVisible(false)
  }

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del modelo',
    },
    {
      name: 'brand',
      label: 'Marca',
      type: 'select',
      required: true,
      options: BRAND_OPTIONS.map((brand) => ({ value: brand, label: brand })),
    },
    {
      name: 'category',
      label: 'Categoría',
      type: 'select',
      required: true,
      options: CATEGORY_OPTIONS.map((cat) => ({ value: cat, label: cat })),
    },
    {
      name: 'image',
      label: 'Imagen del modelo',
      type: 'file',
      required: !editingId,
      accept: 'image/*',
    },
  ]

  const columns: TableColumn<IModel>[] = [
    {
      key: 'image',
      label: 'Imagen',
      width: '80px',
      render: (value) => (
        <img src={value} alt="model" style={{ maxWidth: '60px', maxHeight: '60px' }} />
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
    },
    {
      key: 'brand',
      label: 'Marca',
    },
    {
      key: 'category',
      label: 'Categoría',
    },
  ]

  if (loading && models.length === 0) {
    return <div className="admin-container"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Gestionar Modelos</h1>

        {error && <Alert type="error" message={error} onClose={clearMessages} />}
        {success && <Alert type="success" message={success} onClose={clearMessages} />}

        <button
          onClick={() => (isFormVisible ? resetForm() : setIsFormVisible(true))}
          className="admin-button-primary"
        >
          {isFormVisible ? 'Cancelar' : 'Registrar Nuevo Modelo'}
        </button>

        {isFormVisible && (
          <AdminForm
            fields={formFields.map((field) =>
              editingId && field.name === 'image'
                ? { ...field, required: false }
                : field
            )}
            initialValues={selectedModel ? {
              name: selectedModel.name,
              brand: selectedModel.brand,
              category: selectedModel.category,
              image: selectedModel.image,
            } : {}}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingId}
          />
        )}

        <h2>Modelos Registrados ({filteredModels.length})</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Filtrar por Marca</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Filtrar por Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <AdminTable<IModel>
          columns={columns}
          data={sortedModels}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay modelos registrados"
        />
      </div>
    </div>
  )
}


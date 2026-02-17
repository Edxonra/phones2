'use client'

import { useCart } from '@/src/contexts/CartContext'

interface ProductModel {
  _id?: string
  name?: string
  brand?: string
  category?: string
  image?: string
}

interface ProductVariant {
  _id: string
  price: number
  storage?: string
  color: string
  batteryHealth?: string
  condition?: string
  stock: number
  description?: string
  model?: ProductModel
}

interface ProductVariantsClientProps {
  relatedProducts: ProductVariant[]
}

const formatPrice = (price: number) => {
  if (price >= 1000) {
    const thousand = price / 1000
    return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
  }
  return `₡${price}`
}

export default function ProductVariantsClient({ relatedProducts }: ProductVariantsClientProps) {
  const { addItem } = useCart()

  const handleAddToCart = (item: ProductVariant) => {
    const model = item.model
    addItem({
      productId: item._id,
      productUrl: `/productos/${item._id}`,
      modelName: model?.name || '',
      modelBrand: model?.brand || '',
      modelImage: model?.image,
      storage: item.storage,
      color: item.color,
      batteryHealth: item.batteryHealth,
      condition: item.condition || '',
      price: item.price,
    })
  }

  return (
    <section className="product-variants">
      <h2 className="product-variants-title">Opciones disponibles</h2>
      <div className="product-variants-grid">
        {relatedProducts.map((item) => (
          <div key={item._id} className="product-variant-card">
            <div className="product-variant-header">
              <div className="product-variant-price">{formatPrice(item.price)}</div>
              <div className="product-variant-condition">{item.condition}</div>
            </div>
            <div className="product-variant-rows">
              <div className="product-variant-row">
                <span className="product-variant-label">Almacenamiento</span>
                <span className="product-variant-value">{item.storage || 'No aplica'}</span>
              </div>
              <div className="product-variant-row">
                <span className="product-variant-label">Color</span>
                <span className="product-variant-value">{item.color}</span>
              </div>
              <div className="product-variant-row">
                <span className="product-variant-label">Bateria</span>
                <span className="product-variant-value">{item.batteryHealth || 'No aplica'}</span>
              </div>
              <div className="product-variant-row">
                <span className="product-variant-label">Entrega</span>
                <span className="product-variant-value">
                  {item.stock > 0 ? 'Entrega inmediata' : 'Contra pedido'}
                </span>
              </div>
            </div>
            {item.description && (
              <div className="product-variant-description">
                <span className="product-variant-label">Descripcion</span>
                <span className="product-variant-value">{item.description}</span>
              </div>
            )}
            <button
              onClick={() => handleAddToCart(item)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Añadir al carrito
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

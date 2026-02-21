'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface TopProduct {
  productId: string
  count: number
  product: {
    _id: string
    price: number
    storage?: string
    color: string
    batteryHealth?: string
    condition?: string
  }
  model: {
    _id: string
    name: string
    brand: string
    category: string
    image?: string
  }
}

export default function TopSellersCarousel() {
  const [items, setItems] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await fetch('/api/stats/top-products')
        const data = await res.json()
        setItems((data?.data ?? []).slice(0, 5))
      } catch (e) {
        console.error('Error loading top products:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTop()
  }, [])

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
    }
    return `₡${price}`
  }

  if (loading) {
    return (
      <div className="top-sellers">
        <h2>Más vendidos</h2>
        <p>Cargando...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="top-sellers">
        <h2>Más vendidos</h2>
        <p>No hay datos aún.</p>
      </div>
    )
  }

  return (
    <div className="top-sellers">
      <div className="top-sellers-header">
        <h2>Más vendidos</h2>
      </div>
      <div className="top-sellers-grid">
        {items.map((item) => (
          <Link href={`/productos/${item.productId}`} className="top-seller-card" key={item.productId}>
            <div className="top-seller-image">
              {item.model.image ? (
                <Image
                  src={item.model.image}
                  alt={item.model.name}
                  width={300}
                  height={300}
                />
              ) : (
                <div className="carousel-placeholder">Sin imagen</div>
              )}
            </div>
            <div className="carousel-info">
              <div className="carousel-title">
                {item.model.brand} {item.model.name}
              </div>
              <div className="carousel-subtitle">
                {[item.product.storage, item.product.color, item.product.batteryHealth, item.product.condition]
                  .filter(Boolean)
                  .join(' • ')}
              </div>
              <div className="carousel-meta">
                <span>{formatPrice(item.product.price)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

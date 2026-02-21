'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface SemiNewProduct {
  _id: string
  price: number
  storage?: string
  color: string
  batteryHealth?: string
  condition?: string
  model?: {
    _id?: string
    name?: string
    brand?: string
    category?: string
    image?: string
  }
}

const PAGE_SIZE = 15

const formatPrice = (price: number) => {
  if (price >= 1000) {
    const thousand = price / 1000
    return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
  }
  return `₡${price}`
}

export default function SemiNewSection() {
  const [items, setItems] = useState<SemiNewProduct[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadPage = async (pageToLoad: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      const response = await fetch(
        `/api/stats/semi-new-products?page=${pageToLoad}&limit=${PAGE_SIZE}`
      )
      const result = await response.json()
      const list = result?.data ?? []
      const nextHasMore = Boolean(result?.meta?.hasMore)

      setItems((prev) => (append ? [...prev, ...list] : list))
      setHasMore(nextHasMore)
      setPage(pageToLoad)
    } catch (error) {
      console.error('Error loading seminuevos:', error)
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadPage(1, false)
  }, [])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadPage(page + 1, true)
  }

  return (
    <section className="section">
      <div className="top-sellers">
        <div className="top-sellers-header">
          <h2>Seminuevos</h2>
          <span className="badge">{items.length}</span>
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : items.length === 0 ? (
          <p>No hay productos seminuevos disponibles.</p>
        ) : (
          <>
            <div className="top-sellers-grid">
              {items.map((product) => (
                <Link
                  href={`/productos/${product._id}`}
                  className="top-seller-card"
                  key={product._id}
                >
                  <div className="top-seller-image">
                    {product.model?.image ? (
                      <Image
                        src={product.model.image}
                        alt={product.model?.name || 'Producto'}
                        width={300}
                        height={300}
                      />
                    ) : (
                      <div className="carousel-placeholder">Sin imagen</div>
                    )}
                  </div>
                  <div className="carousel-info">
                    <div className="carousel-title">
                      {product.model?.brand} {product.model?.name}
                    </div>
                    <div className="carousel-subtitle">
                      {[product.storage, product.color, product.batteryHealth, product.condition]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                    <div className="carousel-meta">
                      <span>{formatPrice(product.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="load-more-container">
                <button
                  type="button"
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Cargando...' : 'Cargar mas'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

import Link from 'next/link'
import connectToDatabase from '@/src/lib/mongodb'
import Product from '@/src/lib/models/Product'
import '@/src/lib/models/Model'
import TopSellersCarousel from '@/src/components/TopSellersCarousel'
import SearchSort, { SearchSortOption } from '@/src/components/SearchSort'
import SemiNewSection from '@/src/components/SemiNewSection'

interface PageProps {
  searchParams?: Promise<{ q?: string; sort?: string }>
}

interface SearchProduct {
  _id: string
  price: number
  storage?: string
  color: string
  batteryHealth?: string
  condition?: string
  createdAt?: string
  model?: {
    _id?: string
    name?: string
    brand?: string
    category?: string
    image?: string
  }
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const formatPrice = (price: number) => {
  if (price >= 1000) {
    const thousand = price / 1000
    return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
  }
  return `₡${price}`
}

const renderProductCards = (products: SearchProduct[]) => (
  <div className="top-sellers-grid">
    {products.map((product) => (
      <Link
        href={`/productos/${product._id}`}
        className="top-seller-card"
        key={product._id}
      >
        <div className="top-seller-image">
          {product.model?.image ? (
            <img src={product.model.image} alt={product.model?.name || 'Producto'} />
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
)

const groupByModelLowestPrice = (products: SearchProduct[]) => {
  const map = new Map<string, SearchProduct>()
  products.forEach((product) => {
    const key = product.model?._id ? String(product.model._id) : product._id
    const existing = map.get(key)
    if (!existing || (product.price ?? 0) < (existing.price ?? 0)) {
      map.set(key, product)
    }
  })
  return Array.from(map.values())
}

interface ProductSectionProps {
  title: string
  products: SearchProduct[]
  emptyMessage: string
}

const TopSellersSection = () => (
  <section className="section">
    <TopSellersCarousel />
  </section>
)

const ProductSection = ({ title, products, emptyMessage }: ProductSectionProps) => (
  <section className="section">
    <div className="top-sellers">
      <div className="top-sellers-header">
        <h2>{title}</h2>
        <span className="badge">{products.length}</span>
      </div>
      {products.length === 0 ? <p>{emptyMessage}</p> : renderProductCards(products)}
    </div>
  </section>
)

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const query = (resolvedSearchParams.q ?? '').trim()
  const sort = (resolvedSearchParams.sort ?? 'bestsellers') as SearchSortOption

  await connectToDatabase()

  if (query) {
    const products = (await Product.find({ active: true })
      .populate({ path: 'model', select: 'name brand category image' })
      .lean()) as SearchProduct[]

    const normalizedQuery = normalize(query)
    const results = products.filter((product) => {
      const haystack = normalize(
        `${product.model?.name ?? ''} ${product.model?.brand ?? ''} ${product.model?.category ?? ''} ${product.storage ?? ''} ${product.color ?? ''} ${product.batteryHealth ?? ''} ${product.condition ?? ''}`
      )
      return haystack.includes(normalizedQuery)
    })

    const groupedResults = groupByModelLowestPrice(results)

    const sortedResults = groupedResults.slice().sort((a, b) => {
      if (sort === 'price-asc') {
        return (a.price ?? 0) - (b.price ?? 0)
      }
      if (sort === 'price-desc') {
        return (b.price ?? 0) - (a.price ?? 0)
      }
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })

    return (
      <main className="home">
        <section className="section">
          <div className="top-sellers">
            <div className="top-sellers-header">
              <h2>Resultados para "{query}"</h2>
              <div className="top-sellers-actions">
                <span className="badge">{groupedResults.length}</span>
                <SearchSort query={query} sort={sort} />
              </div>
            </div>
            {groupedResults.length === 0 ? (
              <div>
                <p>No hay productos que coincidan con tu busqueda.</p>
                <p>
                  Contactanos al{' '}
                  <a href="https://wa.me/50661826821" target="_blank" rel="noopener noreferrer">
                    50661826821
                  </a>{' '}
                  para pedir tu producto.
                </p>
              </div>
            ) : (
              renderProductCards(sortedResults)
            )}
          </div>
        </section>
      </main>
    )
  }

  const newProducts = (await Product.find({ active: true, condition: 'Nuevo' })
    .populate({ path: 'model', select: 'name brand category image' })
    .sort({ createdAt: -1 })
    .lean()) as SearchProduct[]

  const immediateProducts = (await Product.find({ active: true, stock: { $gt: 0 } })
    .populate({ path: 'model', select: 'name brand category image' })
    .sort({ createdAt: -1 })
    .lean()) as SearchProduct[]


  const groupedImmediateProducts = groupByModelLowestPrice(immediateProducts).sort(
    (a, b) => (a.price ?? 0) - (b.price ?? 0)
  )
  const groupedNewProducts = groupByModelLowestPrice(newProducts).sort(
    (a, b) => (b.price ?? 0) - (a.price ?? 0)
  )

  return (
    <main className="home">
      <TopSellersSection />
      <ProductSection
        title="Entrega inmediata"
        products={groupedImmediateProducts}
        emptyMessage="No hay productos con entrega inmediata."
      />
      <ProductSection
        title="Nuevos"
        products={groupedNewProducts}
        emptyMessage="No hay productos nuevos disponibles."
      />
      <SemiNewSection />
    </main>
  )
}
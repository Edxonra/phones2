import { notFound } from 'next/navigation'
import connectToDatabase from '@/src/lib/mongodb'
import Product from '@/src/lib/models/Product'
import ProductVariantsClient from '@/src/components/ProductVariantsClient'
import '@/src/lib/models/Model'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ProductDetail {
  _id: string
  price: number
  storage?: string
  color: string
  batteryHealth?: string
  condition?: string
  stock: number
  description?: string
  model?: {
    _id?: string
    name?: string
    brand?: string
    category?: string
    image?: string
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  await connectToDatabase()

  const product = (await Product.findOne({ _id: id, active: true })
    .populate({ path: 'model', select: 'name brand category image' })
    .lean()) as ProductDetail | null

  if (!product) {
    notFound()
  }

  const model = product.model as ProductDetail['model']
  const modelId = model?._id ? String(model._id) : null

  const relatedProducts = modelId
    ? ((await Product.find({ active: true, model: modelId })
        .sort({ price: 1 })
        .lean()) as ProductDetail[])
    : [product]

  // Serialize relatedProducts para pasar a componente cliente
  const serializedRelatedProducts = relatedProducts.map((item) => ({
    _id: item._id.toString(),
    price: item.price,
    storage: item.storage || null,
    color: item.color,
    batteryHealth: item.batteryHealth || null,
    condition: item.condition,
    stock: item.stock,
    description: item.description || null,
    model: {
      _id: item.model?._id?.toString() || null,
      name: item.model?.name || null,
      brand: item.model?.brand || null,
      category: item.model?.category || null,
      image: item.model?.image || null,
    },
  }))

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      const thousand = price / 1000
      return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
    }
    return `₡${price}`
  }

  const lowestPrice = relatedProducts.reduce((min, item) => {
    if (min === null) return item.price
    return item.price < min ? item.price : min
  }, null as number | null)

  return (
    <main className="product-detail">
      <div className="product-detail-card">
        <div className="product-detail-image">
          {model?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={model.image} alt={model?.name || 'Producto'} />
          ) : (
            <div className="product-image-placeholder">Sin imagen</div>
          )}
        </div>
        <div className="product-detail-info">
          <h1>{model?.brand} {model?.name}</h1>
          <p className="product-detail-category">{model?.category}</p>
          {lowestPrice !== null && (
            <div className="product-detail-from">
              Desde {formatPrice(lowestPrice)}
            </div>
          )}
          <div className="product-detail-count">
            {relatedProducts.length} opciones disponibles
          </div>
        </div>
      </div>

      <ProductVariantsClient relatedProducts={serializedRelatedProducts} />
    </main>
  )
}

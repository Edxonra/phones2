import { NextRequest, NextResponse } from 'next/server'
import Products from '@/src/lib/models/Product'
import connectToDatabase from '@/src/lib/mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { id } = await params

    const { model, price, storage, color, stock, description } = body
    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (!model || priceNumber <= 0 || !storage || !color || stockNumber < 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const updatedProduct = await Products.findByIdAndUpdate(
      id,
      {
        model,
        priceNumber,
        storage,
        color,
        stockNumber,
        description,
      },
      { new: true }
    )

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedProduct = await Products.findByIdAndDelete(id)

    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Producto eliminado' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

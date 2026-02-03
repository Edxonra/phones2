import { NextResponse } from 'next/server'
import InventoryPurchase from '@/src/lib/models/Purchase'
import connectToDatabase from '@/src/lib/mongodb'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const { provider, brand, modelName, quantity, costPerUnit, totalCost, purchaseDate, deliveryDate, status, notes } = body

    if (!provider || !brand || !modelName || !quantity || !costPerUnit) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const updatedPurchase = await InventoryPurchase.findByIdAndUpdate(
      id,
      {
        provider,
        brand,
        modelName,
        quantity,
        costPerUnit,
        totalCost,
        purchaseDate,
        deliveryDate,
        status,
        notes,
      },
      { new: true }
    )

    if (!updatedPurchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedPurchase)
  } catch (error) {
    console.error('Error al actualizar compra:', error)
    return NextResponse.json(
      { error: 'Error al actualizar compra' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedPurchase = await InventoryPurchase.findByIdAndDelete(id)

    if (!deletedPurchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Compra eliminada' })
  } catch (error) {
    console.error('Error al eliminar compra:', error)
    return NextResponse.json(
      { error: 'Error al eliminar compra' },
      { status: 500 }
    )
  }
}

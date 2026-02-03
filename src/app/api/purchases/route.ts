import { NextResponse } from 'next/server'
import InventoryPurchase from '@/src/lib/models/Purchase'
import connectToDatabase from '@/src/lib/mongodb'

export async function GET() {
  try {
    await connectToDatabase()
    const purchases = await InventoryPurchase.find().sort({ purchaseDate: -1 })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error al obtener compras:', error)
    return NextResponse.json(
      { error: 'Error al obtener compras' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { provider, brand, modelName, quantity, costPerUnit, totalCost, purchaseDate, deliveryDate, status, notes } = body

    if (!provider || !brand || !modelName || !quantity || !costPerUnit || !purchaseDate) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const purchase = new InventoryPurchase({
      provider,
      brand,
      modelName,
      quantity,
      costPerUnit,
      totalCost,
      purchaseDate,
      deliveryDate,
      status: status || 'pendiente',
      notes,
    })

    await purchase.save()

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Error al crear compra:', error)
    return NextResponse.json(
      { error: 'Error al crear compra' },
      { status: 500 }
    )
  }
}

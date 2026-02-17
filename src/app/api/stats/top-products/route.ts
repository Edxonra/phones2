import { NextResponse } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Sale from '@/src/lib/models/Sale'

export async function GET() {
  try {
    await connectToDatabase()

    const topProducts = await Sale.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.active': true } },
      {
        $group: {
          _id: '$product._id',
          count: { $sum: 1 },
          lastSoldAt: { $max: '$saleDate' },
          product: { $first: '$product' },
        },
      },
      { $sort: { count: -1, lastSoldAt: -1 } },
      {
        $lookup: {
          from: 'models',
          localField: 'product.model',
          foreignField: '_id',
          as: 'model',
        },
      },
      { $unwind: '$model' },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          count: 1,
          product: {
            _id: '$product._id',
            price: '$product.price',
            storage: '$product.storage',
            color: '$product.color',
            batteryHealth: '$product.batteryHealth',
            condition: '$product.condition',
          },
          model: {
            _id: '$model._id',
            name: '$model.name',
            brand: '$model.brand',
            category: '$model.category',
            image: '$model.image',
          },
        },
      },
    ])

    return NextResponse.json({ success: true, data: topProducts })
  } catch (error) {
    console.error('Error al obtener top productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener top productos' },
      { status: 500 }
    )
  }
}

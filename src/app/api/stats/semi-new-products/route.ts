import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Product from '@/src/lib/models/Product'
import '@/src/lib/models/Model'

const DEFAULT_LIMIT = 15
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const pageParam = request.nextUrl.searchParams.get('page')
    const limitParam = request.nextUrl.searchParams.get('limit')

    const page = Math.max(1, Number(pageParam) || 1)
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(limitParam) || DEFAULT_LIMIT))
    const limitPlus = limit + 1
    const skip = (page - 1) * limit

    const items = await Product.aggregate([
      { $match: { active: true, condition: 'Seminuevo' } },
      { $sort: { price: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$model',
          product: { $first: '$$ROOT' },
          lastCreatedAt: { $max: '$createdAt' },
        },
      },
      { $project: { product: 1, lastCreatedAt: 1 } },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ['$product', { lastCreatedAt: '$lastCreatedAt' }] },
        },
      },
      {
        $lookup: {
          from: 'models',
          localField: 'model',
          foreignField: '_id',
          as: 'model',
        },
      },
      { $unwind: '$model' },
      { $sort: { price: -1, lastCreatedAt: -1 } },
      { $skip: skip },
      { $limit: limitPlus },
      {
        $project: {
          _id: 1,
          price: 1,
          storage: 1,
          color: 1,
          batteryHealth: 1,
          condition: 1,
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

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items

    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error al obtener seminuevos:', error)
    return NextResponse.json(
      { error: 'Error al obtener seminuevos' },
      { status: 500 }
    )
  }
}

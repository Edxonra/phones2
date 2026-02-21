import { NextResponse } from 'next/server'
import Purchase from '@/src/lib/models/Purchase'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError } from '@/src/lib/api/response'
import { validatePositiveNumber, validateEnum, validateRequired, ValidationException } from '@/src/lib/api/validation'
import { PROVIDER_OPTIONS } from '@/src/shared/purchase.enum'

export async function GET() {
  try {
    await connectToDatabase()
    const purchases = await Purchase.find().populate({
      path: 'product',
      populate: {
        path: 'model',
        select: 'name brand category',
      },
    }).sort({ purchaseDate: -1 })

    return sendSuccess(purchases)
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return sendError('Failed to fetch purchases', 500)
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { provider, product, cost, purchaseDate, notes } = body
    const [year, month, day] = String(purchaseDate).split('-').map(Number)

    // Validate required fields
    validateRequired(
      { provider, product, cost, purchaseDate },
      ['provider', 'product', 'cost', 'purchaseDate']
    )

    // Validate specific fields
    validatePositiveNumber(cost, 'cost')
    validateEnum(provider, PROVIDER_OPTIONS as unknown as readonly string[], 'provider')

    const localDate = new Date(year, month - 1, day, 12, 0, 0)

    const purchase = new Purchase({
      provider,
      product,
      cost: Number(cost),
      purchaseDate: localDate,
      notes,
    })

    await purchase.save()
    return sendSuccess(purchase, 201)
  } catch (error) {
    console.error('Error creating purchase:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to create purchase', 500)
  }
}

